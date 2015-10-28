/**
 * Created by fengyun on 2015/4/7.
 *
 * 指定终端切换好角色后，返回消息给服务器，再转发结果至原主席端
 *
 * 修改之前异步代码导致的主席列席切换不成功的bug
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
    var meetingId = statusManage.getMeetingId();

    if(parameters.result === 'success'){

        logger.debug('cmd_changeRoleReply - 服务器收到了接收端的改变角色应答...');
        //logger.trace("XXXXXXXXXXXXX" + jsonFormat.jsonToString(parameters));

        /*
            0.get current meeting id
            1.find old chairman device
            2.set role to 1
            3.set successorId's role to 2
            4.tell old chairman change role result
        */

        var successorId ='';
        var chairmanId = '';

        dbOperate.getChairmanId(meetingId,emitter);
        emitter.once('getChairmanId',function(data){
            if(data !== ''){
                chairmanMac =  data['mac'];
                chairmanId = data['memberId'];

                dbOperate.getMemberIdByMAC(successorMac, getSuccessorId);
                function getSuccessorId(id){
                    if(id === ''){

                        var macArray = [];
                        macArray.push(chairmanMac);
                        macArray.push(successorMac);

                        transponder.messageForward(macArray, jsonFormat.jsonToString({
                            cmd:'changeRoleReply',
                            result:'fail',
                            content:null
                        }));

                        logger.error('cmd_changeRoleReply - 列席响应成功，但是却找不到列席mac/id号？可能数据库中列席信息被删除');
                        return;
                    }
                    successorId = id;

                    dbOperate.setChangeRole(meetingId,chairmanId,successorId,emitter);

                    emitter.once('changeRoleResult',function(data){
                        var macArray = [];
                        macArray.push(chairmanMac);
                        macArray.push(successorMac);

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

                            logger.error('cmd_changeRoleReply - 数据库将role相互置换失败,可能是db操作出错！');
                        }
                    });
                }
            }else{

                var macArray = [];
                macArray.push(successorMac);

                transponder.messageForward(macArray, jsonFormat.jsonToString({
                    cmd:'changeRoleReply',
                    result:'fail',
                    content:null
                }));

                logger.error('cmd_changeRoleReply - 列席响应成功，但是却找不到主席端mac/id号？可能数据库中主席信息被删除');
            }
        });

    }else{

        dbOperate.getChairmanId(meetingId,emitter);
        emitter.once('getChairmanId',function(data){
            if(data !== '') {
                chairmanMac = data['mac'];

                var macArray = [];
                macArray.push(chairmanMac);
                macArray.push(successorMac);

                transponder.messageForward(macArray, jsonFormat.jsonToString({
                    cmd:'changeRoleReply',
                    result:'fail',
                    content:null
                }));

                logger.error('cmd_changeRoleReply - 客户端拒绝了原主席的切换请求！');
            }else{

                var macArray = [];
                macArray.push(successorMac);

                transponder.messageForward(macArray, jsonFormat.jsonToString({
                    cmd:'changeRoleReply',
                    result:'fail',
                    content:null
                }));

                logger.error('cmd_changeRoleReply - 客户端拒绝了原主席的切换请求！并且还找不到主席端mac/id号？可能数据库中主席信息被删除');
            }
        });
    }
};