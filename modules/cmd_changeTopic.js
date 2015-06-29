/**
 * Created by fengyun on 2015/4/2.
 *
 * set meeting status to db fengyun 2015/4/28
 *
 */
var statusManage = require('./status_manage');
var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');
var dbOperate = require('./db_operate');
var voteManage = require('./vote_manage');
var events = require('events');

var emitter = new events.EventEmitter();
exports.changeTopic = function(parameters, socket){

    socket.send(jsonFormat.jsonToString({
        cmd:'changeTopic',
        parameters:	  {
            topicId:parameters.topicId
        }
    }));

    var topicId = parameters.topicId;

    dbOperate.getTopicContent(topicId, emitter);
    emitter.once('TopicContent', function(result){
        if(result.result === 'success'){

            var topicDetail = result.response;
            transponder.messageForwardAll(socket, jsonFormat.jsonToString({
                cmd:'changeTopic',
                parameters:	  {
                    topicId:parameters.topicId,
                    content:topicDetail.content
                }
            }));

            statusManage.setStatus2(topicId);//change next topic
            statusManage.setStatus3ToZero();//status3 return 0

            voteManage.setVoteResultNull();//clear vote results

            dbOperate.setMeetingStatus(statusManage.showCurrentStatus(),statusManage.getMeetingId());

            logger.trace('cmd_changeTopic - current topic status，进行到议题： ' + statusManage.showCurrentStatus());
        }
    });


};