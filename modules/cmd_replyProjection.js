/**
 * Created by fengyun on 2015/5/15.
 *
 * 收到终端发送的投影回复，一般这里暂时指的是头像，终端回复它的web服务器地址
 *
 */

var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');

exports.replyProjection = function(parameters, socket){

    var projectionType = parameters.type;
    var msg = '';
    if(projectionType === 'avatar'){
        msg = {
            cmd:'replyProjection',
            parameters: {
                type:projectionType,
                mac:parameters.mac,
                url:parameters.url
            }
        };

        transponder.messageForwardAll(socket, jsonFormat.jsonToString(msg));
        logger.trace('cmd_replyPojection - 开始转发头像投影回复到web大屏幕，内容为：' + jsonFormat.jsonToString(msg));
    }

};