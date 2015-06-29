/**
 * Created by Dexter on 2015/4/7.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');


exports.waiterReply = function(parameters, socket){
    logger.trace('cmd_waiterReply - 收到服务员返回消息，发送给MAC :' + parameters.receiverId);

    var receiver = [];
    receiver.push(parameters.receiverId);

    var msg = {
        cmd:'waiterReply',
        parameters:{
            text:parameters.text
        }
    };

    logger.trace('cmd_waiterReply - 开始发送服务员返回的消息给MAC :' + parameters.receiverId + ',内容为：' + jsonFormat.jsonToString(msg));
    transponder.messageForward(receiver, jsonFormat.jsonToString(msg));
};