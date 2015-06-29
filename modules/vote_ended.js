/**
 * Created by fengyun on 2015/4/2.
 *
 * 统计最后的结果，向指定终端推送统计结果
 */
var statusManage = require('./status_manage');
var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');
var events = require('events');
var emitter = new events.EventEmitter();
var voteManage = require('./vote_manage');
var dbOperate = require('./db_operate');

exports.noticeVotingEnded = function(topicId,timerObj){

    //1.find chairman device
    dbOperate.getChairmanMac(emitter);

    emitter.once('getChairmanMac',function(data){
        if(data !== ''){
            //2.send voting result msg to chairman device
            var macArray = [];
            macArray.push(data);
            macArray.push('WEB-CLIENT');

            //取该议题最终的结果存db
            var resultObj = voteManage.getVoteResult();
            if(resultObj.length > 0){
                var resultStr = jsonFormat.jsonToString(resultObj);
                logger.debug('votingEnded - 当前议题的投票结果:' + resultStr);
                dbOperate.setVoteResult(resultStr);
            }

            //通知主席端和web大屏投票结束
            transponder.messageForward(macArray, jsonFormat.jsonToString({
                cmd:'votingEnded',
                parameters:{
                    topicId:topicId
                }
            }));

            //清除当前投票议题的结果
            voteManage.setVoteResultNull();

            //断开统计当前议题票数定时器
            clearInterval(timerObj);
        }
    });

    statusManage.setStatus3ToVotingEnd();

    logger.debug('votingEnded - current meeting status: ' + statusManage.showCurrentStatus());
};