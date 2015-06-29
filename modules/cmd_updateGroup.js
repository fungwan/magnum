/**
 * Created by Dexter on 2015/4/3.
 *
 *  add group creator by fengyun on 2015/4/16.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');
var groupManage = require('./group_manage');
var ClientList = require('./client_list');

exports.updateGroup = function(parameters, socket){

    logger.trace('cmd_updateGroup - 收到更新组消息');

    var groupId = parameters.groupId;
    var group = groupManage.findGourpById(groupId);
    if(group === null){
        logger.error('cmd_updateGroup - 未在组容器中找到对应的组对象，组ID为：' + groupId);
        return;
    }
    var oldMacs = group.macArray;
    group.macArray = parameters.macArray;
    groupManage.updateGroup(group);

    var mac = ClientList.findClientBySocket(socket).mac;
    //var macArrary = parameters.macArray;
    group.macArray.push(mac);

    var message = {
        cmd:'updateGroup',
        parameters:{
            groupId:groupId,
            macArray : group.macArray
        }
    }
    logger.trace('cmd_updateGroup - 开始发送更新组消息到各个组成员：' + jsonFormat.jsonToString(message));
    transponder.messageForward(oldMacs,jsonFormat.jsonToString(message));
}
