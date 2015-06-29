/**
 * Created by fengyun on 2015/4/2.
 *
 * add modify meeting status @fengyun
 *
 */
var statusManage = require('./status_manage');
var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');
var dbOperate = require('./db_operate');

exports.startMeeting = function(parameters, socket){

    var _meetingId = parameters.meetingId;

    //bordercast startMeeting msg to android device
    transponder.messageForwardAll(socket, jsonFormat.jsonToString({
        cmd:'startMeeting',
        parameters:{
            meetingId:_meetingId
        }
    }));

    socket.send(jsonFormat.jsonToString({
        cmd:'startMeeting',
        parameters:{
            meetingId:_meetingId
        }
    }));

    statusManage.setStatus1(3);//into the meeting
    //statusManage.setStatus2(1);//auto into topic1

    dbOperate.setMeetingStatus(statusManage.showCurrentStatus(),_meetingId);

    logger.trace('cmd_statMeeting - current meeting status: ' + statusManage.showCurrentStatus());
};