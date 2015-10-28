/**
 * Created by fengyun on 2015/7/14.
 */
var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');

exports.syncOfficeToWeb = function(parameters, socket){

    transponder.messageForwardAll(socket, jsonFormat.jsonToString({
        cmd:'syncOfficeToWeb',
        parameters:{
            picUrl : parameters.picUrl
        }
    }));

    logger.trace('cmd_syncOfficeToWeb - 服务器收到了同步大屏office的请求...图片路径为：' + parameters.picUrl);
};