/**
 * Created by fengyun on 2015/4/2.
 *
 * 各个终端发送投票信息给服务器，服务器每次将收到的投票再转发给主席端
 */

var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');
var voteManage = require('./vote_manage');
var events = require('events');
var emitter = new events.EventEmitter();
var dbOperate = require('./db_operate');

exports.voteResult = function(parameters, socket){

    voteManage.addVotingCounts();
    voteManage.statisticsVotes(parameters.optionValues);

    var msg = jsonFormat.jsonToString({
        cmd:'voteResult',
        parameters:{
            topicId:parameters.topicId,
            //optionValues:parameters.optionValues
            optionValues:voteManage.getVoteResult()
        }
    });

    socket.send(msg);

    transponder.messageForwardAll(socket, msg);

    logger.debug('cmd_voteResult - 投票实时计算结果转发至主席端和web大屏... ' + voteManage.showVoteResult());


    //1.find chairman device
    /*dbOperate.getChairmanMac(emitter);

    emitter.once('getChairmanMac',function(data){
        if(data !== ''){
            //2.send voting result msg to chairman device

            voteManage.addVotingCounts();
            voteManage.statisticsVotes(parameters.optionValues);

            transponder.messageForwardAll(socket, jsonFormat.jsonToString({
                cmd:'voteResult',
                parameters:{
                    topicId:parameters.topicId,
                    //optionValues:parameters.optionValues
                    optionValues:voteManage.getVoteResult()
                }
            }));

            logger.debug('cmd_voteResult - 投票实时计算结果转发至主席端和web大屏... ' + voteManage.showVoteResult());
        }
    });*/
};