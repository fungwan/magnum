/**
 * Created by Dexter on 2015/4/3.
 *
 * add group creator by fengyun on 2015/4/15.
 *
 * add group id by fengyun 2015/7/7
 *
 * add fun by fengyun 2015/7/8 无论群组是否创建成功都返回给创建者，前提是，app端要增加判断是否有重复组的逻辑
 */


var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var shortId = require('shortid');
var transponder = require('./message_forward');
var groupManage = require('./group_manage');
var ClientList = require('./client_list');


exports.createGroup = function(parameters, socket){

    logger.trace('cmd_createGroup - 收到创建组消息');

    var _client = ClientList.findClientBySocket(socket);
    if(_client === null){

        //socket.send(jsonFormat.jsonToString({ cmd:'createGroup', result:'fail',content:null}));

        logger.error('cmd_createGroup - 找不到发送人的socket');

        return;
    }
    var mac = _client.mac;

    var macArrary = parameters.macArray;
    macArrary.push(mac);

    //var groupId =  new Date().getTime();   //shortId.generate();

    var groupId =  parameters.groupId;   //shortId.generate();
    var response = {
        cmd:'createGroup',
        result:'success',
        content:{
            groupId:groupId,
            macArray:macArrary,
            creator:mac
        }
    };
    var group = groupManage.findGourpById(groupId);
    if(group === null){
        var groupEle = {
            groupId: groupId,
            macArray:macArrary,
            creator:mac
        };
        groupManage.addGroup(groupEle);

        logger.debug('cmd_createGroup - 开始发送已创建的组信息到组成员：' + jsonFormat.jsonToString(response));
        socket.send(jsonFormat.jsonToString(response));
        transponder.messageForward(parameters.macArray, jsonFormat.jsonToString(response));
    }else{
        logger.debug('cmd_createGroup - 该会议已经创建，但是还要发消息给创建人：' + jsonFormat.jsonToString(response));
        socket.send(jsonFormat.jsonToString(response));
    }
};