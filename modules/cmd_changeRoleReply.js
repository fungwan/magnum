/**
 * Created by fengyun on 2015/4/7.
 *
 * 指定终端切换好角色后，返回消息给服务器，再转发结果至原主席端
 *
 */
var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');
var statusManage = require('./status_manage');
var events = require('events');
var emitter = new events.EventEmitter();
var dbOperate = require('./db_operate.js');

exports.changeRoleReply = function(parameters, socket){
    var successorMac = parameters.successorId;
    var chairmanMac = '';

    if(parameters.result === 'success'){

        logger.debug('cmd_changeRoleReply - 服务器收到了接收端的改变角色应答...');
        logger.trace("XXXXXXXXXXXXX" + jsonFormat.jsonToString(parameters));

        /*
            0.get current meeting id
            1.find old chairman device
            2.set role to 1
            3.set successorId's role to 2
            4.tell old chairman change role result
        */

        var successorId ='';
        dbOperate.getMemberidByMAC(successorMac, getSuccessorId);
        function getSuccessorId(id){
            if(id == '')
                return;
            successorId = id;
        }

        var meetingId = statusManage.getMeetingId();

        var chairmanId = '';
        dbOperate.getChairmanMac(meetingId,emitter);
        emitter.once('getChairmanMac',function(data){
            if(data !== ''){
                chairmanMac =  data;
                dbOperate.getMemberidByMAC(chairmanMac,getChairmanId);
            }
        });

        function getChairmanId(id){
            if(id == '')
                return;
            chairmanId = id;
            dbOperate.setChangeRole(meetingId,chairmanId,successorId,emitter);
        }

        emitter.once('changeRoleResult',function(data){
            var macArray = [];
            macArray.push(chairmanMac);
            if(data === 'success'){
                 transponder.messageForward(macArray, jsonFormat.jsonToString({
                 cmd:'changeRoleReply',
                 result:'success',
                 content:null
                 }));
                logger.debug('cmd_changeRoleReply - 数据库将role相互置换,并发送消息回原主席端...');
            }else{
                transponder.messageForward(macArray, jsonFormat.jsonToString({
                    cmd:'changeRoleReply',
                    result:'fail',
                    content:null
                }));

                logger.debug('cmd_changeRoleReply - 数据库将role相互置换失败,可能是db操作出错！');
            }
        });
    }
};