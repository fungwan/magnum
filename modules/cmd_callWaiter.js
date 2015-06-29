/**
 * Created by Dexter on 2015/4/7.
 *
 * 发送协议修改，增加optionArray  fengyun 2015/4/28
 *
 * 终端发送带上服务员的mac    fengyun 2015/4/29
 *
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');
var ClientList = require('./client_list');
var events = require('events');
var dbOperate = require('./db_operate');


var emitter = new events.EventEmitter();

exports.callWaiter = function(parameters, socket){
    logger.trace('cmd_callWaiter - 收到呼叫服务员消息');

    var cli = ClientList.findClientBySocket(socket);
    if(cli === null){
        logger.error('cmd_callWaiter - 未在终端容器中找到对应的连接对象，可能此终端未登录');
        return;
    }

    var msg = {
        cmd:'waiter',
        parameters:{
            senderId:cli.mac,
            text:parameters.text,
            optionArray:parameters.optionArray
        }
    };

    logger.trace('cmd_callWaiter - 开始转发消息到服务员终端，内容为：' +  jsonFormat.jsonToString(msg));
    var waiterMac = [];
    waiterMac.push(parameters.mac);
    transponder.messageForward(waiterMac, jsonFormat.jsonToString(msg));

    /*dbOperate.getWaiterMac(emitter);
    emitter.once('getWaiterMac', function(result){
        if(result.result === true){
            var waiterMac = [];
            waiterMac.push(result.mac);
            logger.trace('cmd_callWaiter - 开始转发消息到服务员终端，内容为：' +  jsonFormat.jsonToString(msg));
            transponder.messageForward(waiterMac, jsonFormat.jsonToString(msg));
        }
    });*/
};