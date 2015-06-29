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
    t_filesManagement = "plc_filesManagement",
    t_member = 'plc_member',
    t_sitPosition = 'plc_sitPosition',
    t_topicManagement = 'plc_topicManagement';


//==================================================================
//函数名：  logon
//作者：    junlin
//日期：    2015-04-03
//功能：    完成登录动作，包括：判断是否注册、是否已签过到、更新登录标记、获取终端人员名和角色
//输入参数  登录终端的MAC、触发器
//==================================================================
exports.logon = function(mac, emitter){
    async.auto({
        is_register: function(callback){
            var condition = 'WHERE mac = \'' + mac + '\'';
            dbService.selectValue('id', t_device, condition, callback);
        },
        update_online: ['is_register',function(callback, results){
            var id = results.is_register;
            if(id === ''){
                logger.error('db_operate::logon() - 设备未注册 ' + mac);
                callback('err');
            }else{
                var condition = 'WHERE mac = \'' + mac + '\'';
                dbService.updateValue(t_device, 'isOnline = 1 ', condition,callback);
            }
        }],
        is_anyMeeting:['update_online', function(callback){
            var status = statusManage.getCurrentStatus();
            if(status.mainStatus === 0){
                callback('No Meeting', '');//当前没有会议
            }
            else{
                callback(null, '');//当前有会议，继续判断是否已经签过到
            }
        }],
        //以上代码为正常登录流程，以下代码为检测此终端是否已经签过到，即会议途中断线重连的情况
        get_memberId: ['is_anyMeeting', function(callback){
            var sql = 'SELECT plc_member.id FROM  plc_member, ' +
                '(select id FROM plc_device WHERE mac = \'' + mac +'\') as deviceId ' +
                ' WHERE deviceId.id = plc_member.deviceId and plc_member.conferenceId = '+
                statusManage.getMeetingId();
            dbService.selectMoreValue(sql, callback);
        }],
        Judgment_checkinRecord: ['get_memberId', function(callback, results){
            var memberId = results.get_memberId;
            if(memberId === ''){
                logger.error('db_operate::logon() - 当前状态表示有会议，但在数据库中未查询到此终端的会议信息');
                logger.error('db_operate::logon() - 获取成员ID失败： ' + mac);
                callback('err');
            }else{
                memberId = results.get_memberId[0].id;
                var condition = 'WHERE memberId = ' + memberId +' and conferenceId = ';
                condition += statusManage.getMeetingId();
                dbService.selectValue('id', t_checkin, condition, callback);
            }
        }]
    },function(err,result) {
        if(err !== null){
            if(err === 'No Meeting'){ //此处并未有错误，且发现当前没有会议正在进行
                var response = {
                    cmd:'logon',
                    result:'success',
                    content:{
                        status : statusManage.getCurrentStatus(),//此处状态应为0.0.0,请核对
                        meetingId : statusManage.getMeetingId()
                }
                }
                logger.trace('db_operate::logon() - 当前没有会议，返回登录成功消息');
                var result ={
                    result: true,
                    jsonObj: response
                }
                emitter.emit('logon',result);
            }else{                  //以上的if语句为当前没有会议的情况，以下为登录失败的情况。
                var response = {
                    cmd:'logon',
                    result:'fail',
                    content:null
                }
                logger.error('db_operate::logon() - 登录失败: ' + mac);
                var result ={
                    result: false,
                    jsonObj: response
                }
                emitter.emit('logon',result);
            }
        }else{
            var status;
            var isCheckin = result.Judgment_checkinRecord;

            if(isCheckin === '')//如果已经签过到则直接发送最新的会议状态，如果没签到则发送1.0.0状态让其先进行签到。
                status = {
                        'mainStatus'  :    1,
                        'topicStatus' :    0,
                        'voteResult'  :    0
                };
            else
                status = statusManage.getCurrentStatus();

            var response = {
                cmd:'logon',
                result:'success',
                content:{
                    status:status,
                    meetingId : statusManage.getMeetingId()
                }
            }
            logger.trace('db_operate::logon() - 登录成功，MAC地址为： ' + mac);
            var result ={
                result: true,
                jsonObj: response
            }
            emitter.emit('logon',result);
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
exports.getMeetingInfo = function(meetingId, mac, sendResponse){
    async.auto({
        get_nameAndRole: function(callback){
            var sql = 'SELECT plc_member.name,plc_member.role, plc_member.job, plc_member.company, deviceId.orders as seatNum, '+
                'plc_member.avatarUrl FROM plc_member, ' +
                '(SELECT id,orders from plc_device WHERE mac = \'' + mac + '\') as deviceId ' +
                'WHERE deviceId.id = plc_member.deviceId and plc_member.conferenceId = ' +meetingId;

            dbService.selectMoreValue(sql,callback);
        },
        get_baseinfo: function(callback,results){
            var value = 'name,date,location,overview';
            var condition = 'WHERE id = ' + meetingId;
            dbService.selectValueEx(value, t_conference, condition, callback);
        },
        get_seatNum: function(callback,results){
            var value = 'orders';
            var condition = 'WHERE mac = \'' + mac +'\'';
            dbService.selectValueEx(value, t_device, condition, callback);
        },
        get_topic: function(callback, results){
            var value = 'id,content,type,voteObject';
            var condition = 'WHERE conferenceId = ' + meetingId;
            condition += ' ORDER BY orders';
            dbService.selectMulitValue(value, t_topicManagement, condition, callback);
        },
        get_files: function(callback, results){
            var value = 'name,url';
            condition = 'WHERE conferenceId = ' +  meetingId;
            dbService.selectMulitValue(value, t_filesManagement, condition, callback);
        }
    },function(err,result) {
        if(err !== null){
            logger.error('db_operate::getMeetingInfo() - 查询数据库失败,返回失败消息 ');
            var response = {
                cmd:'meetingInfo',
                result:'fail',
                content:null
            }
            sendResponse(response);//调用回调函数完成后续操作
        }else{
            if(result.get_nameAndRole === '' || result.get_baseinfo === '' ||
                result.get_topic === '' || result.get_seatNum === ''){
                logger.error('db_operate::getMeetingInfo() - 查询会议信息内容不全，可能数据库信息有误');
                var response = {
                    cmd:'meetingInfo',
                    result:'fail',
                    content:null
                }
                sendResponse(response);
            }else{
                logger.trace('db_operate::getMeetingInfo() - 查询数据库成功,返回会议信息内容 ');
                var response = {
                    cmd:'meetingInfo',
                    result:'success',
                    content:{}
                }
                response.content.memberInfo = result.get_nameAndRole[0];
         //       response.content.memberInfo.seatNum = result.get_seatNum['orders'];
                response.content.baseInfo = result.get_baseinfo;
                response.content.topic = result.get_topic;
                if(result.get_files === '')
                    response.content.files = [];
                else
                    response.content.files = result.get_files;
                response.content.meetingId = meetingId;
                sendResponse(response);
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
                var condition = 'WHERE memberId = \'' + memberId +'\' and conferenceId = ';
                condition += statusManage.getMeetingId();
                dbService.selectValue('id', t_checkin, condition, callback);
            }
        }],
        set_checkin:['Judgment_checkinRecord', function(callback, results){
            var res = results.Judgment_checkinRecord;
            var memberId = results.get_memberId[0].id;
            if(res === ''){
                logger.trace('db_operate::checkin() - 设备尚未签到，开始插入签到记录到数据库： ' + mac);
                var coll = 'conferenceId,checkinTime,memberId';
                var meetingId = statusManage.getMeetingId();
                var time = timeHelper.getCurrentTime(1);
                var value = meetingId + ',\'' + time + '\',' + memberId;
                dbService.insertValue(t_checkin, coll, value, callback);
            }else{
                logger.trace('db_operate::checkin() - 设备已签到，开始更新签到记录到数据库： ' + mac);
                var value = 'checkinTime = \'' + timeHelper.getCurrentTime(1) + '\'';
                var condition = 'WHERE id = ' + res;
                dbService.updateValue(t_checkin, value, condition,callback);
            }
        }]
    },function(err,result) {
        if(err !== null){
            logger.error('db_operate::checkin() - 签到失败： ' + mac);
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
//==================================================================
exports.updateCheckin = function(sendUpdateCheckin){
    async.auto({
        get_arrived: function(callback){
            var condition = 'WHERE conferenceId = ' + statusManage.getMeetingId();
            dbService.selectValue('count(*)',t_checkin, condition, callback);
        },
        get_AllNum: [function(callback, results){
            var condition = 'WHERE conferenceId = ' + statusManage.getMeetingId();
            dbService.selectValue('count(*)',t_member, condition, callback);
        }],
        get_chairmanMac:[function(callback, results){
            var sql = 'SELECT plc_device.mac FROM plc_device,' +
                ' (SELECT deviceId FROM  plc_member WHERE role = 2 ) as device ' +
                'WHERE plc_device.id = device.deviceId';
            dbService.selectMoreValue(sql, callback);
        }]
    },function(err,result) {
        var res = {};
        if(err !== null){
            logger.error('db_operate::updateCheckin() - 查询数据库失败');
            res.result = false;
            sendUpdateCheckin(res);
        }else{
            if(result.get_chairmanMac === ''){
                logger.error('db_operate::updateCheckin() - 查询主席端MAC地址失败，可能数据库内容有误');
                res.result = false;
                sendUpdateCheckin(res);
            }else{
                var arrived = result.get_arrived;
                var allNum = result.get_AllNum;
                var response = {
                    cmd:'updateCheckin',
                    parameters:{
                        arrived:arrived,
                        notArrived:allNum - arrived
                    }
                }
                res.result = true;
                res.jsonObj = response;
                res.mac = result.get_chairmanMac[0].mac;
                sendUpdateCheckin(res);
            }
        }
    });
}

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


             //add checkin time sql  by fengyun 2015/0430
             */
            var sql = 'SELECT  member.`name`,member.job, member.company,member.avatarUrl,member.role,member.mac, plc_checkin.checkinTime' +
                ' from (select plc_member.id,plc_member.name ,plc_member.job,plc_member.company,avatarUrl,plc_member.role, plc_device.mac FROM plc_member, plc_device'+
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
            logger.trace('db_operate::getMemberInfo() - 查询数据库成功,返回人员信息内容');
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
            logger.trace('db_operate::getWaiterMac() - 查询服务员终端MAC地址成功');
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

//==================================================================
//函数名：  getMemberidByMAC
//作者：    junlin
//日期：    2015-05-08
//功能：    根据会议ID和MAC地址获取memberID;
//输入参数  MAC地址
//返回值：  memberID
//==================================================================

exports.getMemberidByMAC = function(mac, getSuccessorId){
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
        set_chairmanRole : function(callback){

            var condition = ' where ID = "' + oldChairmanId +'" and conferenceId = ' + meetingId;

            dbService.updateValue(t_member,'role = 1',condition,callback);
        },
        set_successorRole : function(callback){

            var condition = ' where ID = "' + successorId +'" and conferenceId = ' + meetingId;

            dbService.updateValue(t_member,'role = 2',condition,callback);
        }
    },function(err,results){
        if(err !== null){
            emitter.emit('changeRoleResult','fail');
        }else{
            var chairmanResult = results["set_chairmanRole"];
            var successorResult = results["set_successorRole"];
            if(chairmanResult === 'success' && successorResult === 'success')
                emitter.emit('changeRoleResult','success');
            else
                emitter.emit('changeRoleResult','fail');
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
    if(client === null)
        return;

    ClientList.removeClient(client.mac);
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
            logger.debug('operate.js - find topic content ' + sql);
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
                logger.warn('db_operate::getTopicContent - 查询议题内容成功.');
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

exports.initMeetingStatus = function(){
    async.auto({
        get_status:function(callback){
            var multiSql = 'SELECT id,states FROM plc_conference WHERE states <> \'0.0.0\' and states <> \'4.0.0\'';
            dbService.selectMoreValue(multiSql,callback);
        }
    },function(err,results){
        if(err !== null){
            logger.error('初始化会议状态失败，查询数据库错误！');
        }else{
            if(results.get_status.length  === 0 )
               return;
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

            var curStatus = statusManage.getCurrentStatus();
            logger.trace('初始化会议状态成功，当前会议状态为: ' + curStatus.mainStatus +'.' +
            curStatus.topicStatus+ '.'+ curStatus.voteResult  + '   当前会议ID为: ' + statusManage.getMeetingId());
        }
    });
};














