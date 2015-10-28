/**
 * Created by Dexter on 2015/4/2.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var dbOperate = require('./db_operate');
var ClientList = require('./client_list');
var events = require('events');
var emitter = new events.EventEmitter();

exports.meetingInfo = function(parameters, socket){

    //logger.trace('cmd_meetingInfo - 收到获取会议信息消息，会议ID为： ' + parameters.meetingId);

    var meetingId = parameters.meetingId;
    var cli = ClientList.findClientBySocket(socket);
    if(cli === null){
        var response = {
            cmd:'meetingInfo',
            result:'fail',
            content:null
        };
        socket.send(jsonFormat.jsonToString(response));

        logger.error('cmd_meetingInfo - 未在组容器中找到对应的对象，可能终端未登录');
        return;
    }
    dbOperate.getMeetingInfo(meetingId, cli.mac, emitter);

    //闭包函数用于在查询完数据库后继续执行操作。
    /*function sendResponse(jsonObj){
        socket.send(jsonFormat.jsonToString(jsonObj));
        logger.debug('cmd_meetingInfo - 请求获取会议信息结果，它是：' + cli.name);
        //logger.trace('cmd_meetingInfo - 发送获取会议信息结果： ' + jsonFormat.jsonToString(jsonObj));
    }*/

    emitter.once('meetingInfo', function(response){
        socket.send(jsonFormat.jsonToString(response));
        logger.trace('cmd_meetingInfo - 请求获取会议信息，它是：' + cli.name);
        //logger.trace('cmd_memberInfo - 发送人员信息消息，内容为：' + jsonFormat.jsonToString(response));
    });

    emitter.setMaxListeners(0);
};
