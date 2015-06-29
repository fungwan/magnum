/**
 * Created by fengyun on 2015/4/7.
 *
 * 服务器转发投影消息至各个终端，包含web
 */

var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');

exports.projection = function(parameters, socket){

    var projectionType = parameters.type;

//    var webAddr = [];
//    webAddr.push('WEB-CLIENT');
    var msg = '';
    if(projectionType === 'avatar'){
        msg = {
            cmd:'projection',
            parameters: {
                type:projectionType,
                clientId:parameters.clientId
            }
        };
        //发送头像投影至各终端
        socket.send(jsonFormat.jsonToString(msg));
        transponder.messageForwardAll(socket, jsonFormat.jsonToString(msg));
        logger.trace('cmd_projection - 开始转发头像投影到终端，内容为：' + jsonFormat.jsonToString(msg));

        //发送头像投影至web，参数里面的clientId为web生成播放流地址
        /*transponder.messageForward(webAddr, jsonFormat.jsonToString( {
            cmd:'projection',
            parameters: {
                type:projectionType,
                clientId:parameters.clientId
            }
        }));
        logger.trace('cmd_projection - 开始转发头像投影到web大屏幕，内容为：' + jsonFormat.jsonToString( {
            cmd:'projection',
            parameters: {
                type:projectionType,
                clientId:parameters.clientId
            }
        }));*/

    }else if(projectionType === 'playVideo'){
        //发送视频至web端
        transponder.messageForwardAll(socket, jsonFormat.jsonToString( {
            cmd:'projection',
            parameters: {
                type:projectionType,
                videoURL:parameters.videoURL
            }
        }));

        logger.trace('cmd_projection - 开始转发播放视频投影到web大屏幕，内容为：' + jsonFormat.jsonToString( {
            cmd:'projection',
            parameters: {
                type:projectionType,
                videoURL:parameters.videoURL
            }
        }));

    }else if(projectionType === 'voteResult'){
        msg = {
            cmd:'projection',
            parameters: {
                type:projectionType,
                topicId:parameters.topicId
            }
        };
        transponder.messageForwardAll(socket, jsonFormat.jsonToString(msg));
        logger.trace('cmd_projection - 开始转发投票结果投影到web大屏幕，内容为：' + jsonFormat.jsonToString(msg));
    }
};