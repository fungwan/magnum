/**
 * Created by fengyun on 2015/4/3.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');

exports.changeRole = function(parameters, socket){
    var successorId = parameters.successorId;

    var macArray = [];
    macArray.push(successorId);

    logger.trace('cmd_changeRole - 服务器收到了主席端发送的的改变角色请求...' + successorId);
    logger.trace("XXXXXXXXXXXXX" + jsonFormat.jsonToString(parameters));

    transponder.messageForward(macArray, jsonFormat.jsonToString({
        cmd:'changeRole',
        parameters:null
    }));
};