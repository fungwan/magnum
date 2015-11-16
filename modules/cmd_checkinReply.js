/**
 * Created by Dexter on 2015/4/3.
 */


var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var statusManage = require('./status_manage');
var events = require('events');
var dbOperate = require('./db_operate');
var transponder = require('./message_forward');


var emitter = new events.EventEmitter();

exports.checkinReply = function(parameters, socket){

    //logger.trace('cmd_checkinReply - 收到签到信息 :' +  parameters.mac);
    dbOperate.checkin(parameters.mac,  sendResponse);

    function sendResponse(result){
        var response;
        if(result === true){
            response = {
                cmd:'checkinReply',
                result:'success',
                content:{
                    status:statusManage.getCurrentStatus()
                }
            };
            dbOperate.updateCheckin(statusManage.getMeetingId(),sendUpdateCheckin);

        }else{
            response = {
                cmd:'checkinReply',
                result:'fail',
                content:null
            };
            logger.error('cmd_checkinReply - 签到失败： ' + parameters.mac);
        }
        socket.send(jsonFormat.jsonToString(response));
    }

    function sendUpdateCheckin(result){
        if(result.result === false){
            //get info fail
            var _response = {
                cmd:'checkinReply',
                result:'fail',
                content:null
            };
            logger.error('cmd_checkinReply - 签到失败： ' + parameters.mac);
            socket.send(jsonFormat.jsonToString(_response));

        }else {
            logger.info('cmd_checkinReply - 签到成功： ' + parameters.mac);
            logger.trace('cmd_checkinReply - 开始发送签到情况到主席端和Web端(updateCheckin)： ' + jsonFormat.jsonToString(result.jsonObj));
            transponder.messageForwardAll(socket, jsonFormat.jsonToString(result.jsonObj));
            socket.send(jsonFormat.jsonToString(result.jsonObj));
        }
    }
};