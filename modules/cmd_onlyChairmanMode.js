/**
 * Created by fengyun on 2015/6/8.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');

exports.onlyChairmanMode = function(parameters, socket){

    logger.trace('cmd_onlyChairmanMode - 服务器收到了主席专有模式请求，请求值是' + parameters.isOpen);

    transponder.messageForwardAll(socket, jsonFormat.jsonToString({
        cmd:'onlyChairmanMode',
        parameters:parameters
    }));

    socket.send( jsonFormat.jsonToString({
        cmd:'onlyChairmanMode',
        parameters:parameters
    }));
};