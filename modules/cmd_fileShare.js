/**
 * Created by Dexter on 2015/4/7.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');


exports.fileShare = function(parameters, socket){
    logger.trace('cmd_fileShare - 收到文件共享消息');

    var response = {
        cmd:'share',
        parameters:{
            senderId:parameters.senderId,
            fileName:parameters.fileName,
            fileUrl:parameters.fileUrl
        }
    }
    logger.debug('cmd_fileShare - 开始发送文件共享消息：' + jsonFormat.jsonToString(response));
    transponder.messageForward(parameters.receiverId, jsonFormat.jsonToString(response));
};