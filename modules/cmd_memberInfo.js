/**
 * Created by Dexter on 2015/4/7.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var events = require('events');
var dbOperate = require('./db_operate');
var ClientList = require('./client_list');

var emitter = new events.EventEmitter();

exports.memberInfo = function(parameters, socket){
    //logger.trace('cmd_memberInfo - 收到获取人员信息消息');

    var cli = ClientList.findClientBySocket(socket);
    if(cli === null){

        var response = {
            cmd:'memberInfo',
            result:'fail',
            content:null
        };

        socket.send(jsonFormat.jsonToString(response));

        logger.error('cmd_membergInfo - 未在组容器中找到对应的对象，可能终端未登录');
        return;
    }
    dbOperate.getMemberInfo(parameters.meetingId, emitter);
    emitter.once('memberInfo', function(response){
        socket.send(jsonFormat.jsonToString(response));
        logger.debug('cmd_memberInfo - 请求获取会议人员结果，它是：' + cli.name);
        //logger.trace('cmd_memberInfo - 发送人员信息消息，内容为：' + jsonFormat.jsonToString(response));
    });

    emitter.setMaxListeners(0);
};