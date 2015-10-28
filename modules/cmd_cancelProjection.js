/**
 * Created by Dexter on 2015/4/7.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');


exports.cancelProjection = function(parameters, socket){

    if(parameters.type === 'avatar'){
        logger.trace('cmd_cancelProjection - 收到取消头像投影消息');
        var msg = {
              cmd:'cancelProjection',
              parameters:{
                type:'avatar'
              }
            };
        logger.trace('cmd_cancelProjection - 开始转发消息到取消投影的终端，内容为：' + jsonFormat.jsonToString(msg));
        transponder.messageForwardAll(socket, jsonFormat.jsonToString(msg));
    }
    else if(parameters.type === 'playVideo'){
        logger.trace('cmd_cancelProjection - 收到取消视频播放投影消息');
        var msg = {
            cmd:'cancelProjection',
            parameters:{
                type:'playVideo',
                videoURL:parameters.videoURL
            }
        };

        logger.trace('cmd_cancelProjection - 开始转发消息到WEB，内容为：' + jsonFormat.jsonToString(msg));
        transponder.messageForwardAll(socket, jsonFormat.jsonToString(msg));
    }
    else if(parameters.type === 'voteResult'){
        logger.trace('cmd_cancelProjection - 收到取消表决情况投影消息');
        var msg = {
            cmd:'cancelProjection',
            parameters:{
                type:'voteResult',
                topicId:parameters.topicId
            }
        };

        logger.trace('cmd_cancelProjection - 开始转发消息到WEB，内容为：' + jsonFormat.jsonToString(msg));
        transponder.messageForwardAll(socket, jsonFormat.jsonToString(msg));
    }else if(parameters.type === 'syncOfficeToWeb'){
        logger.trace('cmd_cancelProjection - 收到取消同屏Office投影消息');
        var msg = {
            cmd:'cancelProjection',
            parameters:{
                type:'syncOfficeToWeb'
            }
        };

        logger.trace('cmd_cancelProjection - 开始转发消息到WEB，内容为：' + jsonFormat.jsonToString(msg));
        transponder.messageForwardAll(socket, jsonFormat.jsonToString(msg));
    }
};