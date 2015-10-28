/**
 * Created by Dexter on 2015/4/3.
 *
 * add fun by fengyun 2015/7/8
 *
 * 增加异常判断：假如服务器宕机，重启后，之前保存在内存中的消息组会丢失，所以改为一旦有人发消息则创建该消息组
 *
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');
var groupManage = require('./group_manage');


exports.message = function(parameters, socket){

    logger.trace('cmd_message - 收到message消息');

    var groupId = parameters.groupId;
    var group = groupManage.findGourpById(groupId);
    if(group === null){//防止服务器重启后group丢失
        var groupEle = {
            groupId: groupId,
            macArray:parameters.macArray,
            creator:parameters.creator
        };
        groupManage.addGroup(groupEle);

        logger.error('cmd_message - 未在组容器中找到对应的组对象，组ID为：' + groupId + ',所以服务器重新创建该消息组');

        group = groupEle;
    }
    //logger.debug(group.macArray);
    var myDate = new Date();
    var msg = {
        cmd:'message',
        parameters:{
            macArray:group.macArray,
            sender:parameters.sender,
            groupId:parameters.groupId,
            content:parameters.content,
            sendDate: myDate.getTime()
        }
    };

    transponder.messageForward(group.macArray, jsonFormat.jsonToString(msg));
    logger.trace('cmd_message - 开始转发消息到其它组成员：' + jsonFormat.jsonToString(msg));
};