/**
 * Created by Dexter on 2015/4/7.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var events = require('events');
var dbOperate = require('./db_operate');


var emitter = new events.EventEmitter();

exports.memberInfo = function(parameters, socket){
    logger.trace('cmd_memberInfo - 收到获取人员信息消息');

    dbOperate.getMemberInfo(parameters.meetingId, emitter);
    emitter.once('memberInfo', function(response){
        socket.send(jsonFormat.jsonToString(response));
        logger.trace('cmd_memberInfo - 发送人员信息消息，内容为：' + jsonFormat.jsonToString(response));
    });

    emitter.setMaxListeners(0);
};