/**
 * Created by Dexter on 2015/4/1.
 */

var ClientList = require('./client_list');
var logger = require('../lib/log.js').logger;


//==================================================================
//函数名：  messageForward
//作者：    junlin
//日期：    2015-04-03
//功能：    向指定终端发送消息
//输入参数  所需发送人员的mac地址数组、消息内容
//==================================================================
exports.messageForward = function(receiver, message){

    if(receiver instanceof  Array){
        for(var x = 0; x < receiver.length; ++x){
            var client = ClientList.findSocketByMac(receiver[x]);
            if(client === null){
                logger.error('messageforward - 未在终端容器中找到对应的MAC地址的连接对象,不能完成发送，MAC地址为：' + receiver[x]);
                continue;
            }
            client.send(message);
        }
    }else{
        logger.error('message_forward - 广播消息的入口参数不为数组！');
    }
};

//==================================================================
//函数名：  messageForwardAll
//作者：    junlin
//日期：    2015-04-03
//功能：    向当前所有与服务器保持连接的socket广播消息（自己除外）
//输入参数  发送者的socket、消息内容
//==================================================================
exports.messageForwardAll = function(socket, msg){
    socket.broadcast.emit('message', msg);
};