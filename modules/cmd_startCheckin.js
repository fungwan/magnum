/**
 * Created by Dexter on 2015/4/2.
 *
 * 回复startcheckin之前判断当前是否正在有会议开始  fengyun 2015/04/28
 */


var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');
var statusManage = require('./status_manage');
var dbOperate = require('./db_operate');

exports.startCheckin = function(parameters, socket){
    logger.trace('cmd_startCheckin - 收到开始会议消息，会议ID为: ' + parameters.meetingId);

    var strPlcStyle = '';

    if(statusManage.getMeetingId() === 0){
        var meetingId = parameters.meetingId;
        statusManage.setMeetingId(meetingId);

        var response = {
            cmd:'startCheckin',
            result:'success',
            content:null
        };
        socket.send(jsonFormat.jsonToString(response));
        logger.trace('cmd_startCheckin - 返回开始会议成功消息: ' + jsonFormat.jsonToString(response));

        dbOperate.getPlcNameAndStyle(meetingId,styleBack);
        function styleBack(styleData){
            var _plcStyle = {};
            if(styleData !== 'fail'){
                _plcStyle = styleData;
            }

            dbOperate.updateCheckin(sendUpdateCheckin);

            function sendUpdateCheckin(data){
                if(data.result === false){
                    //get info fail

                    _plcStyle['arrived'] = 0;
                    _plcStyle['notArrived'] = 0;

                    logger.error('获取签到信息出错');

                }else {
                    var info = data.jsonObj;
                    var parameters = info.parameters;

                    _plcStyle['arrived'] = parameters.arrived;
                    _plcStyle['notArrived'] = parameters.notArrived;

                    logger.trace('cmd_startCheckin - 签到信息获取是否正确: ' +parameters.arrived + ';' + parameters.notArrived);

                }

                var cmdCheckin = {
                    cmd:'checkin',
                    parameters:{
                        meetingId:meetingId,
                        forWebScreen:_plcStyle
                    }
                };

                //logger.trace('cmd_startCheckin - 参数传递正确与否: ' +jsonFormat.jsonToString(strPlcStyle));
                logger.trace('cmd_startCheckin - 开始通知各个终端开始签到: ' + jsonFormat.jsonToString(cmdCheckin));
                transponder.messageForwardAll(socket, jsonFormat.jsonToString(cmdCheckin));

                statusManage.setStatus1(2);
                dbOperate.setMeetingStatus("2.0.0",meetingId);

            }
        }

    }else{
        var response = {
            cmd:'startCheckin',
            result:'fail',
            content:null
        };
        socket.send(jsonFormat.jsonToString(response));
        logger.error('cmd_startCheckin - 当前已有会议开始不能再次发送该命令！');
    }
};