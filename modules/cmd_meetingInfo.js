/**
 * Created by Dexter on 2015/4/2.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var dbOperate = require('./db_operate');
var ClientList = require('./client_list');


exports.meetingInfo = function(parameters, socket){
    logger.trace('cmd_meetingInfo - 收到获取会议信息消息，会议ID为： ' + parameters.meetingId);

    var meetingId = parameters.meetingId;
    var cli = ClientList.findClientBySocket(socket);
    if(cli === null){
        logger.error('cmd_meetingInfo - 未在组容器中找到对应的对象，可能终端未登录');
        return;
    }
    dbOperate.getMeetingInfo(meetingId, cli.mac, sendResponse);

    //闭包函数用于在查询完数据库后继续执行操作。
    function sendResponse(jsonObj){
        socket.send(jsonFormat.jsonToString(jsonObj));
        logger.trace('cmd_meetingInfo - 发送获取会议信息结果： ' + jsonFormat.jsonToString(jsonObj));
    }
};
