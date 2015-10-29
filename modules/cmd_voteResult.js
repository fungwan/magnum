/**
 * Created by fengyun on 2015/4/2.
 *
 * 各个终端发送投票信息给服务器，服务器每次将收到的投票再转发给主席端
 */

var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var transponder = require('./message_forward');
var voteManage = require('./vote_manage');
var dbOperate = require('./db_operate');

exports.voteResult = function(parameters, socket){

    voteManage.addVotingCounts();
    voteManage.statisticsVotes(parameters.optionValues);

    dbOperate.updateCheckinLw(checkinInfo);

    function checkinInfo(result){
        if(result === ''){
            return false;
        }

        var _allVoter = result;//parseInt(result);
        var _alreadyVoter = voteManage.getVotingCounts();

        var msg = jsonFormat.jsonToString({
            cmd:'voteResult',
            parameters:{
                topicId:parameters.topicId,
                optionValues:voteManage.getVoteResult(),
                voter:{
                    allVoter:_allVoter,
                    alreadyVoter:_alreadyVoter
                }
            }
        });

        socket.send(msg);
        //logger.debug('cmd_voteResult - 投票实时计算结果转发至主席端和web大屏... ' + msg);
        transponder.messageForwardAll(socket, msg);

        logger.debug('cmd_voteResult - 投票实时计算结果转发至主席端和web大屏... ' + voteManage.showVoteResult());
    }
};