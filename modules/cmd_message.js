/**
 * Created by Dexter on 2015/4/3.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');
var groupManage = require('./group_manage');


exports.message = function(parameters, socket){

    logger.trace('cmd_message - 收到message消息');

    var groupId = parameters.groupId;
    var group = groupManage.findGourpById(groupId);
    if(group === null){
        logger.error('cmd_message - 未在组容器中找到对应的组对象，组ID为：' + groupId);
        return;
    }

    var myDate = new Date();
    var msg = {
        cmd:'message',
        parameters:{
            sender:parameters.sender,
            groupId:parameters.groupId,
            content:parameters.content,
            sendDate: myDate.getTime()
        }
    }
    logger.trace('cmd_message - 开始转发消息到其它组成员：' + jsonFormat.jsonToString(msg));
    transponder.messageForward(group.macArray, jsonFormat.jsonToString(msg));
}