/**
 * Created by Administrator on 2015/3/31.
 *
 * add web client            fengyun 2015/4/28
 *
 * add port attr             fengyun 2015/6/5
 *
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var events = require('events');
var dbOperate = require('./db_operate');
var ClientList = require('./client_list');
var portMgt = require('./port_manage');

var emitter = new events.EventEmitter();

exports.logon = function(parameters, socket){
    logger.trace('cmd_logon - 收到登录消息,MAC地址为: ' + parameters.mac);

    var mac = parameters.mac;
    if(mac === 'WEB-CLIENT'){
        var loginDate = new Date();
        var cli = {
            mac:parameters.mac,
            socket:socket,
            time:loginDate.getTime()
        };
        ClientList.addClient(cli);
        logger.trace('cmd_logon - 已生成web连接对象并加入clientList');
    }else{
        dbOperate.logon(parameters.mac, emitter);
        emitter.once('logon', function(result){
            if(result.result === true){
                var loginDate = new Date();
                var cli = {
                    mac:parameters.mac,
                    socket:socket,
                    time:loginDate.getTime()
                };
                ClientList.addClient(cli);
                logger.trace('cmd_logon - 已生成连接对象并加入clientList,mac为：' + mac);

                var rtsp_port = portMgt.getNewPort();
                result.jsonObj['content']['port'] = rtsp_port;
            }

            socket.send(jsonFormat.jsonToString(result.jsonObj));
            logger.trace('cmd_logon - 返回登录响应：' + jsonFormat.jsonToString(result.jsonObj));
        });
    }

};