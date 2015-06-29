/**
 * Created by fengyun on 2015/4/2.
 *
 * 主席发送开始投票信息至服务器，服务器转发至各个终端
 *
 * 针对除主席端，广播开始投票消息（多了几个字段），对主席段解析协议无影响   fengyun
 */
var statusManage = require('./status_manage');
var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');
var dbOperate = require('./db_operate');
var events = require('events');
var voteManage = require('./vote_manage');

var emitter = new events.EventEmitter();

exports.startVote = function(parameters, socket){

    //bordercast startMeeting msg to android device

    var topicId = parameters.topicId;

    dbOperate.getTopicContent(topicId, emitter);
    emitter.once('TopicContent', function(result){
        if(result.result === 'success'){

            var topicDetail = result.response;
            transponder.messageForwardAll(socket, jsonFormat.jsonToString({
                     cmd:'startVote',
                     parameters:{
                     topicId:parameters.topicId,
                     content:topicDetail.content,
                     type:topicDetail.type,
                     voteObject:topicDetail.voteObject
                 }
             }));

            socket.send(jsonFormat.jsonToString({
                cmd:'startVote',
                parameters:{
                    topicId:parameters.topicId
                }
            }));

            //初始化该议题的投票结果
            voteManage.initVoteResults(topicDetail.type,topicDetail.voteObject);

            statusManage.setStatus3ToVoting();//meeting status is changed to voting...
            dbOperate.setMeetingStatus(statusManage.showCurrentStatus(),statusManage.getMeetingId());

            //开启投票计时器
            //voteManage.openStatisticsVoting(parameters.topicId);

            logger.debug('cmd_statVoting - current meeting status: 开始投票了,转发投票信息');
        }
    });
};