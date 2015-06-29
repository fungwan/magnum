/**
 * Created by fengyun on 2015/4/23.
 */
var statusManage = require('./status_manage');
var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');
var dbOperate = require('./db_operate');
var portMgt = require('./port_manage');

exports.meetingOver = function(parameters, socket){

    var _meetingId = parameters.meetingId;
    statusManage.setStatus1(0);statusManage.setStatus2(0);statusManage.setStatus3ToZero();
    statusManage.setMeetingId(0);

    transponder.messageForwardAll(socket, jsonFormat.jsonToString({
        cmd:'meetingOver',
        parameters:	  {
            meetingId:_meetingId
        }
    }));

    socket.send(jsonFormat.jsonToString({
        cmd:'meetingOver',
        parameters:	  {
            meetingId:_meetingId
        }
    }));

    //set meeting status 4.0.0
    dbOperate.setMeetingStatus("4.0.0",_meetingId);

    logger.info('cmd_meetingOver - 会议id为： ' + _meetingId + '的会议已结束!\n当前服务器状态初始化为' + statusManage.showCurrentStatus());
};