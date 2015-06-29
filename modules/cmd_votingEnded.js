/**
 * Created by fengyun on 2015/4/22.
 *
 * modify update voteResult by fengyun on 2015/5/12
 *
 */
var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');
var statusManage = require('./status_manage');
var voteManage = require('./vote_manage');
var dbOperate = require('./db_operate');

exports.votingEnded = function(parameters, socket){

    logger.trace('cmd_votingEnded - 收到主席端发过来的投票结束消息');

    var response = {
        cmd:'votingEnded',
        parameters:{
            topicId:parameters.topicId
        }
    };
    socket.send(jsonFormat.jsonToString(response));

    transponder.messageForwardAll(socket, jsonFormat.jsonToString(response));

    //取该议题最终的结果存db
    var resultObj = voteManage.getVoteResult();
    var resultStr = jsonFormat.jsonToString(resultObj);
    resultStr = '\"' + resultStr.replace(/"/g,'') + '\"';

    logger.debug('votingEnded - 当前议题的投票结果:' + resultStr);
    var topicId = parameters.topicId;
    dbOperate.setVoteResult(resultStr,topicId);

    //清除当前投票议题的结果
    voteManage.setVoteResultNull();
    statusManage.setStatus3ToVotingEnd();

    logger.trace('cmd_votingEnded - 通知所有终端投票结束，当前会议状态为：' + statusManage.showCurrentStatus());
};