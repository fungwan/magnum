/**
 * Created by Dexter on 2015/4/3.
 *
 * add group creator by fengyun on 2015/4/15.
 */


var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var shortId = require('shortid');
var transponder = require('./message_forward');
var groupManage = require('./group_manage');
var ClientList = require('./client_list');


exports.createGroup = function(parameters, socket){

    logger.trace('cmd_createGroup - 收到创建组消息');

    var mac = ClientList.findClientBySocket(socket).mac;

    var macArrary = parameters.macArray;
    macArrary.push(mac);

    var groupId =  new Date().getTime();   //shortId.generate();
    var group = {
        groupId: groupId,
        macArray:macArrary,
        creator:mac
    };
    groupManage.addGroup(group);


    var response = {
        cmd:'createGroup',
        result:'success',
        content:{
            groupId:groupId,
            macArray:macArrary,
            creator:mac
        }
    };

    logger.trace('cmd_createGroup - 开始发送已创建的组信息到组成员：' + jsonFormat.jsonToString(response));
    socket.send(jsonFormat.jsonToString(response));
    transponder.messageForward(parameters.macArray, jsonFormat.jsonToString(response));
};