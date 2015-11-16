/**
 * Created by fengyun on 14-6-18.
 */
var dbService = require("./db_service.js");
var async = require('async');
var logger = require('../lib/log.js').logger;
var statusManage = require('./status_manage');
var timeHelper  = require('../lib/time');
var ClientList = require('./client_list');

var t_account = "plc_account",
    t_accountlevel ="plc_accountAuth",
    t_checkin = "plc_checkin",
    t_conference = "plc_conference",
    t_device = "plc_device",
    t_filesManagement = "plc_filesmanagement",
    t_member = 'plc_member',
    t_screenconfigure = 'plc_screenconfigure',
    t_topicManagement = 'plc_topicmanagement';

var isSetMeetingStates = 0;

//==================================================================
//函数名：  logon
//作者：    junlin
//日期：    2015-04-03
//功能：    完成登录动作，包括：判断是否注册、是否已签过到、更新登录标记、获取终端人员名和角色
//输入参数  登录终端的MAC、触发器
//==================================================================
exports.logon = function(mac, logonReply){

    /*
        重构登陆逻辑 2015/7/17 by fengyun
     */

    var seatNo = -1;//针对登陆失败而定义的seatNo
    var currStates = {};
    var conferenceId = 0;

    async.auto({
        is_register: function(callback){
            var condition = 'WHERE mac = \'' + mac + '\'';
            dbService.selectValueEx('id,orders', t_device, condition, callback);
        },

        //查看是否有会议
        get_meetingStates : ['is_register',function(callback,results){

            var rsData = results.is_register;

            var id = rsData['id'];
            if(id === '' || id === undefined){
                logger.error('db_operate::logon() - 设备未注册 ' + mac);
                callback('No Register');
                return;
            }

            seatNo = rsData['orders'];

            var condition = 'WHERE states <> \'0.0.0\' and states <> \'4.0.0\'';
            dbService.selectValueEx('id,states',t_conference,condition,callback);

        }],

        get_memberId: ['get_meetingStates',function(callback,results){

            var rsData = results.get_meetingStates;

            conferenceId = rsData['id'];
            var tmpStates = rsData['states'];
            var arrayStates = tmpStates.split(".");
            currStates['mainStatus'] = arrayStates[0];
            currStates['topicStatus'] = arrayStates[1];
            currStates['voteResult'] = arrayStates[2];

            if(conferenceId === '' || conferenceId === undefined){
                callback('No Meeting', seatNo);//当前没有会议
                return;
            }

            var sql = 'SELECT plc_member.id, plc_member.name, plc_member.job,plc_member.company,plc_member.avatarUrl,plc_member.role FROM  plc_member, ' +
                '(select id FROM plc_device WHERE mac = \'' + mac +'\') as deviceId ' +
                ' WHERE deviceId.id = plc_member.deviceId and plc_member.conferenceId = '+
                statusManage.getMeetingId();

            dbService.selectMoreValue(sql, callback);

        }],
        Judgment_checkinRecord: ['get_memberId', function(callback, results){

            var memberId = results.get_memberId;//看有无此人员信息在该会议中
            if(memberId === ''){

                logger.error('db_operate::logon() - 当前状态有会议，但在数据库中未查询到此终端的会议信息,终端mac为：' + mac);
                callback('No InMeeting',seatNo);

            }else{

                memberId = results.get_memberId[0].id;
                var condition = 'WHERE memberId = ' + memberId +' and conferenceId = ';
                condition += conferenceId;
                dbService.selectValue('1', t_checkin, condition, callback);
            }
        }]
    },function(err,result) {

        /*
            修改登陆异常逻辑 2015/7/17 by fengyun
         */


        if(err !== null){

            if(err === 'No Register'){

                var response = {
                    cmd:'logon',
                    result:'fail',
                    content:{
                        seatNum : -1
                    }
                };

                var _result ={
                    result: false,
                    jsonObj: response
                };

                logonReply(_result);

                logger.error('db_operate::logon() - 登陆终端并没有在数据库中注册...');

            }else if(err === 'No Meeting' || err === 'No InMeeting'){//'No Meeting No InMeeting '

                var meetingId = 0;

                if(err === 'No Meeting'){
                    meetingId = -1;
                }else{
                    meetingId = conferenceId;
                }

                var response = {
                    cmd:'logon',
                    result:'fail',
                    content:{
                        status : currStates,
                        meetingId : meetingId,
                        seatNum : seatNo
                    }
                };

                var _result ={
                    result: false,
                    jsonObj: response
                };

                logger.debug('db_operate- 座次号返回' + response.content.seatNum);

                if(err === 'No Meeting'){
                    logger.error('db_operate::logon() - 当前没有会议，返回登录失败消息');
                }else{
                    logger.error('db_operate::logon() - 当前有会议，但是该设备不在会议当中');
                }

                logonReply(_result);

            }else{

                var response = {
                    cmd:'logon',
                    result:'fail',
                    content:{}
                };

                var _result ={
                    result: false,
                    jsonObj: response
                };

                logger.error('db_operate::logon() - 数据库错误' + err);

                logonReply(_result);
            }

        }else{
            var status;
            var isCheckin = result.Judgment_checkinRecord;
            var orders = seatNo;

            if(isCheckin === '')//如果已经签过到则直接发送最新的会议状态，如果没签到则发送1.0.0状态让其先进行签到。
                status = {
                        'mainStatus'  :    1,
                        'topicStatus' :    0,
                        'voteResult'  :    0
                };
            else
                status = currStates;

            var response = {
                cmd:'logon',
                result:'success',
                content:{
                    status:status,
                    meetingId : conferenceId,
                    seatNum : orders,
                    peerInfo:result.get_memberId[0]
                }
            };

            var _result ={
                result: true,
                jsonObj: response
            };
            logonReply(_result);

            var condition = 'WHERE mac = \'' + mac + '\'';
            dbService.updateValue(t_device, 'isOnline = 1 ', condition,updateLogon);
            function updateLogon(err,data){
                if(err) logger.error('db_operate::logon() - 设备登录更新失败，可能是数据库原因！');
            }

            logger.info('db_operate::logon() - 登录成功，MAC地址为： ' + mac);
        }
    });
};

//==================================================================
//函数名：  getMeetingInfo
//作者：    junlin
//日期：    2015-04-03
//功能：    获取会议信息，包括：会议基本内容、各项议题、会议文件
//输入参数  会议ID、mac地址，回调函数
//==================================================================
exports.getMeetingInfo = function(meetingId, mac, emitter){
    async.auto({

        get_baseinfo: function(callback){
            var value = 'name,date,location,overview';
            var condition = 'WHERE id = ' + meetingId;
            dbService.selectValueEx(value, t_conference, condition, callback);
        },

        get_topic: function(callback){
            var value = 'id,content,type,voteObject,countdown';
            var condition = 'WHERE conferenceId = ' + meetingId;
            condition += ' ORDER BY orders';
            dbService.selectMulitValue(value, t_topicManagement, condition, callback);
        },

        get_files: function(callback){
            var value = 'name,url,fileSize as size';
            var condition = 'WHERE conferenceId = ' +  meetingId;
            dbService.selectMulitValue(value, t_filesManagement, condition, callback);
        }
    },function(err,result) {
        if(err !== null){
            logger.error('db_operate::getMeetingInfo() - 查询数据库失败,返回失败消息 ');
            var response = {
                cmd:'meetingInfo',
                result:'fail',
                content:null
            };
            emitter.emit('meetingInfo',response);

        }else{
            if( result.get_baseinfo === '' ||
                result.get_topic === '' ){//|| result.get_seatNum === '' || result.get_nameAndRole === ''
                logger.error('db_operate::getMeetingInfo() - 查询会议信息内容不全，可能数据库信息有误');
                var response = {
                    cmd:'meetingInfo',
                    result:'fail',
                    content:null
                };
                emitter.emit('meetingInfo',response);
            }else{

                var response = {
                    cmd:'meetingInfo',
                    result:'success',
                    content:{}
                };

                response.content.baseInfo = result.get_baseinfo;
                response.content.topic = result.get_topic;
                if(result.get_files === '')
                    response.content.files = [];
                else
                    response.content.files = result.get_files;
                response.content.meetingId = meetingId;
                emitter.emit('meetingInfo',response);
            }
        }
    });
};

//==================================================================
//函数名：  checkin
//作者：    junlin
//日期：    2015-04-03
//功能：    在签到表中更新或者插入签到记录
//输入参数  签到终端的MAC、触发器
//==================================================================
exports.checkin = function (mac, sendResponse) {
    async.auto({
        get_memberId: function(callback){
            var sql = 'SELECT plc_member.id FROM  plc_member, ' +
                      '(select id FROM plc_device WHERE mac = \'' + mac +'\') as deviceId ' +
                      ' WHERE deviceId.id = plc_member.deviceId and plc_member.conferenceId = '+
                        statusManage.getMeetingId();
            dbService.selectMoreValue(sql, callback);
        },
        Judgment_checkinRecord: ['get_memberId', function(callback, results){
            var memberId = results.get_memberId[0].id;
            if(memberId === ''){
                logger.error('db_operate::checkin() - 获取成员ID失败： ' + mac);
                callback('err');
            }else{
                memberId = results.get_memberId[0].id;
                //modify by fengyun
                var coll = 'conferenceId,checkinTime,memberId';
                var meetingId = statusManage.getMeetingId();
                var time = timeHelper.getCurrentTime(1);
                var value = meetingId + ',\'' + time + '\',' + memberId;
                dbService.insertValue(t_checkin, coll, value, callback);
//                var condition = 'WHERE memberId = \'' + memberId +'\' and conferenceId = ';
//                condition += statusManage.getMeetingId();
//                dbService.selectValue('id', t_checkin, condition, callback);
            }
        }]
//        set_checkin:['Judgment_checkinRecord', function(callback, results){
//            var res = results.Judgment_checkinRecord;
//            var memberId = results.get_memberId[0].id;
//            if(res === ''){
//                logger.trace('db_operate::checkin() - 设备尚未签到，开始插入签到记录到数据库： ' + mac);
//                var coll = 'conferenceId,checkinTime,memberId';
//                var meetingId = statusManage.getMeetingId();
//                var time = timeHelper.getCurrentTime(1);
//                var value = meetingId + ',\'' + time + '\',' + memberId;
//                dbService.insertValue(t_checkin, coll, value, callback);
//            }else{
//                logger.trace('db_operate::checkin() - 设备已签到，开始更新签到记录到数据库： ' + mac);
//                var value = 'checkinTime = \'' + timeHelper.getCurrentTime(1) + '\'';
//                var condition = 'WHERE id = ' + res;
//                dbService.updateValue(t_checkin, value, condition,callback);
//            }
//        }]
    },function(err,result) {
        if(err !== null){
            logger.error('db_operate::checkin() -' + mac + ' 签到失败，原因是： ' + err);
            sendResponse(false);
        }else{
            sendResponse(true);
        }
    });
}

//==================================================================
//函数名：  updateCheckin
//作者：    junlin
//日期：    2015-04-03
//功能：    获取已签到多少人，未签到多少人
//输入参数  触发器
//modify by fengyun cancel get chairman info
//==================================================================
exports.updateCheckin = function(conferenceId,sendUpdateCheckin){
    async.auto({
        get_arrived: function(callback){

            /*

             SELECT count(a.memberId) from
             (SELECT memberId from plc_checkin WHERE conferenceId = 1431500212154) as a WHERE
             a.memberId NOT IN (SELECT id as memberId from plc_member WHERE conferenceId = 1431500212154 and role = 0)

             排除服务员的签到信息,去差集  modify by fengyun 2015/7/8
             */

            var mulitTable = ' (SELECT memberId from plc_checkin WHERE conferenceId = ' + conferenceId +' ) as a';
            var condition = ' WHERE a.memberId NOT IN (SELECT id as memberId from plc_member WHERE conferenceId = ' + conferenceId + ' and role = 0)';

            dbService.selectValue('count(a.memberId)',mulitTable, condition, callback);
        },
        get_allNum: [function(callback, results){
            var condition = 'WHERE conferenceId = ' + conferenceId +  ' and role != 0';
            dbService.selectValue('count(*)',t_member, condition, callback);
        }]
//        get_chairmanMac:[function(callback, results){
//            var sql = 'SELECT plc_device.mac FROM plc_device,' +
//                ' (SELECT deviceId FROM  plc_member WHERE role = 2 ) as device ' +
//                'WHERE plc_device.id = device.deviceId';
//            dbService.selectMoreValue(sql, callback);
//        }]
    },function(err,result) {
        var res = {};
        if(err !== null){
            logger.error('db_operate::updateCheckin() - 查询数据库失败');
            res.result = false;
            sendUpdateCheckin(res);
        }else{
//            if(result.get_chairmanMac === ''){
//                logger.error('db_operate::updateCheckin() - 查询主席端MAC地址失败，可能数据库内容有误');
//                res.result = false;
//                sendUpdateCheckin(res);
//            }else{
//
//            }
            var arrived = result.get_arrived;
            var allNum = result.get_allNum;
            var response = {
                cmd:'updateCheckin',
                parameters:{
                    arrived:arrived,
                    notArrived:allNum - arrived
                }
            };
            res.result = true;
            res.jsonObj = response;
            //res.mac = result.get_chairmanMac[0].mac;
            sendUpdateCheckin(res);
        }
    });
};

//==================================================================
//函数名：  updateCheckinLw
//作者：    fengyun
//日期：    2015-04-03
//功能：    获取已签到多少人
//输入参数  触发器
//==================================================================
exports.updateCheckinLw = function(sendUpdateCheckin){
    async.auto({
        get_arrived: function(callback){

            var mulitTable = ' (SELECT memberId from plc_checkin WHERE conferenceId = ' + statusManage.getMeetingId()+' ) as a';
            var condition = ' WHERE a.memberId NOT IN (SELECT id as memberId from plc_member WHERE conferenceId = ' + statusManage.getMeetingId() + ' and role = 0)';
            dbService.selectValue('count(a.memberId)',mulitTable, condition, callback);
        }
    },function(err,result) {
        if(err !== null){
            logger.error('db_operate::updateCheckin() - 查询数据库失败');
            sendUpdateCheckin('');
        }else{
            var arrived = result.get_arrived;
            sendUpdateCheckin(arrived);
        }
    });
};

//==================================================================
//函数名：  getMemberInfo
//作者：    junlin
//日期：    2015-04-03
//功能：    获取参会人员的具体信息
//输入参数  会议ID、触发器
//==================================================================
exports.getMemberInfo = function(meetingId ,emitter){
    async.auto({
        get_memberInfo: function(callback){
            /*
             SELECT  member.`name`,member.job, member.company,member.avatarUrl,member.role,member.mac, plc_checkin.checkinTime
             from (select plc_member.id,plc_member.name ,plc_member.job,plc_member.company,plc_member.role, plc_device.mac FROM plc_member, plc_device
             WHERE plc_member.deviceId = plc_device.id  and conferenceId = 1428564574957) as member
             LEFT JOIN plc_checkin
             on member.id= plc_checkin.memberId;


             //add checkin time sql  by fengyun 2015/4/30
             */
            var sql = 'SELECT  member.orders as seatNum ,member.`name`,member.job, member.company,member.avatarUrl,member.role,member.mac, plc_checkin.checkinTime' +
                ' from (select plc_device.orders,plc_member.id,plc_member.name ,plc_member.job,plc_member.company,avatarUrl,plc_member.role, plc_device.mac FROM plc_member, plc_device'+
                ' WHERE plc_member.deviceId = plc_device.id  and conferenceId = ';
            sql += statusManage.getMeetingId();
            sql += ') as member LEFT JOIN plc_checkin on member.id= plc_checkin.memberId';

            dbService.selectMoreValue(sql, callback);
        }
    },function(err,result) {
        var res = result.get_memberInfo;
        if(err !== null || res === ''){
            logger.error('db_operate::getMemberInfo() - 查询数据库失败,返回失败消息');
            var response = {
                cmd:'memberInfo',
                result:'fail',
                content:null
            }
            emitter.emit('memberInfo',response);
        }else{
            //logger.trace('db_operate::getMemberInfo() - 查询数据库成功,返回人员信息内容');
            var response = {
                cmd:'memberInfo',
                result:'true',
                content:res
            }
            emitter.emit('memberInfo',response);
        }
    });
}

//==================================================================
//函数名：  getWaiterMac
//作者：    junlin
//日期：    2015-04-03
//功能：    获取服务员终端MAC地址
//输入参数  触发器
//==================================================================
exports.getWaiterMac = function(emitter){
    async.auto({
        get_waiterMac: function(callback){
            var sql = 'SELECT plc_device.mac FROM plc_device ,' +
                '(SELECT deviceId FROM plc_member WHERE conferenceId = ' +
                statusManage.getMeetingId() + ' and role = 0) as member ' +
                'WHERE member.deviceId = plc_device.id';
            dbService.selectMoreValue(sql, callback);
        }
    },function(err,result) {
        var waiterMac = result.get_waiterMac;
        var res = {};
        if(err !== null || waiterMac === ''){
            logger.error('db_operate::getWaiterMac() - 查询数据库失败 或 查询不到服务员终端MAC地址');
            res.result = 'false';
            emitter.emit('getWaiterMac',res);
        }else{
            //logger.trace('db_operate::getWaiterMac() - 查询服务员终端MAC地址成功');
            res.result = 'true';
            res.mac = result.get_waiterMac[0].mac;
            emitter.emit('getWaiterMac',res);
        }
    });
}


//==================================================================
//函数名：  getChairmanMac
//作者：    andy.feng
//日期：    2015-04-03
//功能：    查询主席端Mac;
//输入参数  触发器
//返回值：  主席端Mac
//修改记录：
//==================================================================

exports.getChairmanMac = function(meetingId,emitter){

    /*
     SELECT plc_device.mac from plc_sitPosition,plc_device WHERE plc_sitPosition.role = 2 AND plc_sitPosition.deviceId = plc_device.id;
     */
    async.auto({
        get_chairmanMac : function(callback){

            var multiSql = 'SELECT plc_device.mac from plc_member,plc_device WHERE plc_member.role = 2 AND plc_member.deviceId = plc_device.id AND conferenceId =';
            multiSql += meetingId;

            dbService.selectMoreValue(multiSql,callback);
        }
    },function(err,results){
        if(err !== null){
            emitter.emit('getChairmanMac','');
        }else{
            var macArray = results["get_chairmanMac"];
            if(macArray.length > 0){
                emitter.emit('getChairmanMac',macArray[0]['mac']);
            }else{
                emitter.emit('getChairmanMac','');
            }

        }
    });
};

exports.getChairmanId = function(meetingId,emitter){

    /*
     SELECT plc_device.mac from plc_sitPosition,plc_device WHERE plc_sitPosition.role = 2 AND plc_sitPosition.deviceId = plc_device.id;
     */
    async.auto({
        get_chairmanMac : function(callback){

            var multiSql = 'SELECT plc_device.mac,plc_member.id as memberId from plc_member,plc_device WHERE plc_member.role = 2 AND plc_member.deviceId = plc_device.id AND conferenceId =';
            multiSql += meetingId;

            dbService.selectMoreValue(multiSql,callback);
        }
    },function(err,results){
        if(err !== null){
            emitter.emit('getChairmanId','');
        }else{
            var macArray = results["get_chairmanMac"];
            if(macArray.length > 0){
                emitter.emit('getChairmanId',macArray[0]);
            }else{
                emitter.emit('getChairmanId','');
            }

        }
    });
};

//==================================================================
//函数名：  getMemberidByMAC
//作者：    junlin
//日期：    2015-05-08
//功能：    根据会议ID和MAC地址获取memberID;
//输入参数  MAC地址
//返回值：  memberID
//==================================================================

exports.getMemberIdByMAC = function(mac, getSuccessorId){
    async.auto({
        getMemberID : function(callback){

            var multiSql = 'SELECT id FROM plc_member WHERE conferenceId = \''+ statusManage.getMeetingId() +'\'' +
            ' AND deviceId = (SELECT id FROM plc_device WHERE mac = \''+ mac +'\')';

            dbService.selectMoreValue(multiSql,callback);
        }
    },function(err,results){
        if(err !== null){
           // emitter.emit('getMemberidByMAC','');
            logger.error('db_operate::getMemberidByMAC - 查询memberid失败，数据库错误.');
           // return '';
            getSuccessorId('')
        }else{
            var macArray = results["getMemberID"];
            if(macArray.length > 0){
              //  emitter.emit('getMemberidByMAC',macArray[0]['id']);
              //  return macArray[0]['id'];
                getSuccessorId(macArray[0]['id'])
            }else{
               // emitter.emit('getMemberidByMAC','');
                logger.error('db_operate::getMemberidByMAC - 查询memberid失败，数据库错误.');
              //  return '';
                getSuccessorId('')
            }

        }
    });
};

//==================================================================
//函数名：  setChangeRole
//作者：    andy.feng
//日期：    2015-04-07
//功能：    设置主席端和列席端的切换;
//输入参数  会议Id,原主席端口,接收邀请端,触发器
//返回值：
//修改记录：
//==================================================================

exports.setChangeRole = function(meetingId,oldChairmanId,successorId,emitter){

    /*
        update plc_member set role = 1 where ID = oldChairmanId
        update plc_member set role = 2 where ID = successorId
     */
    async.auto({
        set_successorRole : function(callback){

            var condition = ' where ID = "' + successorId +'" and conferenceId = ' + meetingId;

            dbService.updateValue(t_member,'role = 2',condition,callback);

        },
        set_chairmanRole : ['set_successorRole',function(callback, results){

            var re1 = results.set_successorRole;
            if(re1 === 'success'){
                var condition = ' where ID = "' + oldChairmanId +'" and conferenceId = ' + meetingId;
                logger.debug('继承者变为主席成功，数据库设为2');
                dbService.updateValue(t_member,'role = 1',condition,callback);
                logger.debug('接着再把原先主席变为列席，数据库设为1');
            }else{
                callback('changesuccessorfail','fail');
            }

        }]
    },function(err,results){
        if(err !== null){
            emitter.emit('changeRoleResult','fail');
        }else{
            var chairmanResult = results["set_chairmanRole"];
            var successorResult = results["set_successorRole"];

            if(chairmanResult === 'success' && successorResult === 'success'){
                logger.debug('dboperate- 数据库 ,角色切换成功！');
                emitter.emit('changeRoleResult','success');
            }else{
                logger.error('dboperate- 数据库 ,角色切换失败！');
                emitter.emit('changeRoleResult','fail');
            }

        }
    });
};

//==================================================================
//函数名：  setVoteResult
//作者：    andy.feng
//日期：    2015-04-07
//功能：    投票结束后，将结果存至数据库;
//输入参数  投票结果字符串,议题Id
//返回值：
//修改记录：
//==================================================================

exports.setVoteResult = function(resultValues,topicId){

    async.auto({
        set_chairmanRole : function(callback){
            var updateValues = 'result= ' + resultValues;
            var condition = 'where id = ' + topicId;
            dbService.updateValue(t_topicManagement,updateValues,condition,callback);
        }
    },function(err,results){

    });
};

//==================================================================
//函数名：  logoff
//作者：    junlin
//日期：    2015-04-08
//功能：    完成下线功能，如收到disconnect消息，或超过保活时间。
//输入参数  终端连接的socket
//==================================================================
exports.logoff= function(socket){
    var client = ClientList.findClientBySocket(socket);
    if(client === null){
        logger.debug('断开socket,但是未找到相应的client对象,1.可能设备不在这个会议里面;2.之前的废弃socket');
        socket.disconnect();
        return;
    }

    ClientList.removeClient(client.mac,socket);
    var condition = 'WHERE mac = \'' + client.mac + '\'';
    dbService.updateValue(t_device, 'isOnline = 0 ', condition,function(err){
        if(err){
            logger.error('update logoff error!');
        }
    });
};

//==================================================================
//函数名：  getTopicContent
//作者：    junlin
//日期：    2015-04-21
//功能：    获取会议中某项议题的具体内容
//输入参数  议题的id号
//==================================================================
exports.getTopicContent= function(topicId, emitter){
    async.auto({
        get_topicContent : function(callback){
            var sql = 'select id,content,type,voteObject from ' + t_topicManagement +' WHERE id = '+ topicId +' and conferenceId = '+ statusManage.getMeetingId();
            //logger.debug('operate.js - find topic content ' + sql);
            dbService.selectMoreValue(sql,callback);
        }
    },function(err,results){
        var res = {
            result:'fail',
            response:null
        };
        if(err !== null){
            logger.error('db_operate::getTopicContent - 数据库查询错误.');
            emitter.emit('TopicContent', res);
        }else{
            var content = results.get_topicContent[0];
            if(content === undefined){
                logger.error('db_operate::getTopicContent - 未查询到议题的内容，可能数据库信息有误.');
                emitter.emit('TopicContent', res);
            }else{
                //logger.warn('db_operate::getTopicContent - 查询议题内容成功.');
                res.result = 'success';
                res.response = content;
                emitter.emit('TopicContent',res);
            }
        }
    });
};

//==================================================================
//函数名：  setMeetingStatus
//作者：    fengyun
//日期：    2015-04-21
//功能：    设置会议的状态
//输入参数  当前会议状态,会议id
//==================================================================
exports.setMeetingStatus= function(status,meetingId){

    var condition = ' where ID=' + meetingId;
    var updateValues = 'states= \"' + status + '\"';
    dbService.updateValue(t_conference,updateValues,condition,function(err,data){
        if(err){
            logger.error('修改会议状态为' + status + '失败');
        }
    });
};

exports.initMeetingStatus= _initMeetingStatus;

function _initMeetingStatus (paCallback){
    async.auto({
        get_status:function(callback){
            var multiSql = 'SELECT id,states FROM plc_conference WHERE states <> \'0.0.0\' and states <> \'4.0.0\'';
            dbService.selectMoreValue(multiSql,callback);
        }
    },function(err,results){
        if(err !== null){
            paCallback(err,'');
            logger.error('初始化会议状态失败，查询数据库错误！');
        }else{
            if(results.get_status.length  === 0 ){
                paCallback(null,'');
                logger.info('当前没有会议进行！');
                return;
            }

            var res = results.get_status[0];
            var statusArr = res.states.split(".");
            statusManage.setMeetingId(res.id);
            statusManage.setStatus1(statusArr[0]);
            statusManage.setStatus2(statusArr[1]);
            if(statusArr[2] === '0')
                statusManage.setStatus3ToZero();
            else if(statusArr[2] === '1')
                statusManage.setStatus3ToVoting();
            else if(statusArr[2] === '2')
                statusManage.setStatus3ToVotingEnd();

            isSetMeetingStates = 1;
            if(paCallback !== null){
                paCallback(null,'');
            }
            var curStatus = statusManage.getCurrentStatus();
            logger.info('初始化会议状态成功，当前会议状态为: ' + curStatus.mainStatus +'.' +
            curStatus.topicStatus+ '.'+ curStatus.voteResult  + '   当前会议ID为: ' + statusManage.getMeetingId());
        }
    });
}

//==================================================================
//函数名：  getScreenStyle
//作者：    fengyun
//日期：    2015-10-23
//功能：    获取指定会议的大屏风格参数
//输入参数  会议id,需要回传的风格参数
//==================================================================
exports.getScreenStyle= function(plcId,styleBack){

    var condition = ' where conferenceId= ' + plcId;

    async.auto({
        get_screenStyle : function(callback){

            dbService.selectValueEx('*', t_screenconfigure, condition, callback);
        }
    },function(err,results){
        if(err !== null){
            styleBack('fail');
        }else {
            var data = results["get_screenStyle"];

            var styleConfig = {};

            styleConfig['screen_bg'] = {"background-color":data['backgroundColor']};
            styleConfig['logo_pos'] = {"text-align":data['logoPosition']};
            styleConfig['log_src'] = {"src":data['logoUrl']};
            styleConfig['meeting_title'] = {"color":data['titleColor'],"font-size":data['titleSize']+'px'};
            styleConfig['meeting_info'] = {"color":data['topicTitleColor'],"font-size":data['topicTitleSize']+'px'};

            logger.trace(styleConfig);
            styleBack(styleConfig);
        }
    });
};


//==================================================================
//函数名：  getScreenStyle
//作者：    fengyun
//日期：    2015-10-23
//功能：    获取指定会议的大屏风格参数
//输入参数  会议id,需要回传的风格参数
//==================================================================
exports.getPlcNameAndStyle= function(plcId,styleBack){

//    SELECT meeting.name,conf.logoUrl,conf.logoPosition, conf.backgroundColor ,conf.titleColor,conf.titleSize,conf.titleColor,conf.topicTitleSize
//
//    from plc_screenconfigure as conf RIGHT JOIN (SELECT id,name from plc_conference WHERE id = 1428564574957) as meeting
//
//    on conf.conferenceId = meeting.id;

    var sql = 'SELECT meeting.name,conf.logoUrl,conf.logoPosition, conf.backgroundColor ,conf.titleColor,conf.titleSize,conf.topicTitleColor,conf.topicTitleSize ';
        sql += 'from plc_screenconfigure as conf RIGHT JOIN (SELECT id,name from plc_conference WHERE id= ' + plcId + ') as meeting on conf.conferenceId = meeting.id;';

    async.auto({
        get_screenStyleEx : function(callback){

            dbService.selectMoreValue(sql,  callback);
        }
    },function(err,results){
        if(err !== null){
            styleBack('fail');
        }else {
            var tmpArray = results["get_screenStyleEx"];
            var data = tmpArray[0];
            var styleConfig = {};

            styleConfig['name'] = data['name'];
            styleConfig['screen_bg'] = {"background-color":data['backgroundColor']};
            styleConfig['logo_pos'] = {"text-align":data['logoPosition']};
            styleConfig['log_src'] = {"src":data['logoUrl']};
            styleConfig['meeting_title'] = {"color":data['titleColor'],"font-size":data['titleSize']+'px'};
            styleConfig['meeting_info'] = {"color":data['topicTitleColor'],"font-size":data['topicTitleSize']+'px'};

            styleBack(styleConfig);
        }
    });
};














