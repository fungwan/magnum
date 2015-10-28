/**
 * Created by Administrator on 2015/3/31.
 *
 * add web client            fengyun 2015/4/28
 *
 * add port attr             fengyun 2015/6/5
 *
 * add reply to web's logon  fengyun 2015/7/21
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var events = require('events');
var dbOperate = require('./db_operate');
var ClientList = require('./client_list');
var portMgt = require('./port_manage');
var statusManage = require('./status_manage');

var emitter = new events.EventEmitter();

exports.logon = function(parameters, socket){
    //logger.trace('cmd_logon - 收到登录消息,MAC地址为: ' + parameters.mac);

    var mac = parameters.mac;
    if(mac === 'WEB-CLIENT' || mac === 'WEB-SCREEN'){
        var loginDate = new Date();

        var cli = {
            mac:parameters.mac,
            socket:socket,
            time:loginDate.getTime()
        };

        ClientList.addClient(cli);

        logger.trace('cmd_logon - 已生成web连接对象并加入clientList,它是：' + mac);

        var resForWeb = {
            cmd:'logon',
            result:'success',
            content:{
                status : statusManage.getCurrentStatus()
            }
        };

        socket.send(jsonFormat.jsonToString(resForWeb));

    }else{
        dbOperate.logon(parameters.mac, logonReply);

        function logonReply(result){
            if(result.result === true){
                var loginDate = new Date();
                var memberName = result.jsonObj['content']['peerInfo'].name;
                var cli = {
                    mac:parameters.mac,
                    socket:socket,
                    time:loginDate.getTime(),
                    ip:socket.handshake.address,
                    name:memberName
                };

                ClientList.addClient(cli);
                logger.trace('cmd_logon - 已生成连接对象并加入clientList,人名和mac名分别为：' + memberName + ' , ' + mac);

                var rtsp_port = portMgt.getNewPort();
                result.jsonObj['content']['port'] = rtsp_port;
            }

            //登陆成功或者失败都要返回给客户端说一声
            socket.send(jsonFormat.jsonToString(result.jsonObj));

            //logger.trace('cmd_logon - 返回登录响应：' + jsonFormat.jsonToString(result.jsonObj));

            if(!result.result){
                socket.disconnect();
                logger.error('cmd_logon - 终端登陆失败,原因如上述，断开socket...');
            }
        }
    }

};