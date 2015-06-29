/**
 * Created by fengyun on 2015/4/2.
 *
 * 管理会议进行中的票数统计，互斥性 ，议题进行只有1项议题在投票
 */
var logger = require('../lib/log.js').logger;
var clientList = require('./client_list');
var votingEnded =  require('./vote_ended');

var votingCounts = 0;
var currentVotingTopicId = 0;

/*
投票结果的存储形式
    {赞成:12,
    反对:10,
    弃权:1}
 张三:22, 李四:11, 王五:12 ...(All)
 100:32, 90:23, 60:11
 */
var voteResult  = {};

//==================================================================
//函数名：  addVotingCounts
//作者：    andy.feng
//日期：    2015-04-03
//功能：    增加投票次数，每收到终端/列席的一次投票就加1。目的在于知晓什么时候作为投票结束
//输入参数
//返回值：
//修改记录：
//==================================================================
exports.addVotingCounts = function(){
    votingCounts += 1;
};

//==================================================================
//函数名：  getVotingCounts
//作者：    andy.feng
//日期：    2015-04-03
//功能：    得到已经投票的个数;
//输入参数
//返回值：
//修改记录：
//==================================================================
exports.getVotingCounts = function(){
    return votingCounts;
};

//==================================================================
//函数名：  getVotingTopicId
//作者：    andy.feng
//日期：    2015-04-03
//功能：    得到当前投票的议题ID;
//输入参数
//返回值：
//修改记录：
//==================================================================
exports.getVotingTopicId = function(){
    return currentVotingTopicId;
};

//==================================================================
//函数名：  openStatisticsVoting
//作者：    andy.feng
//日期：    2015-04-03
//功能：    开启投票定时器;
//输入参数
//返回值：
//修改记录：
//==================================================================
exports.openStatisticsVoting = function(topicId){

    currentVotingTopicId = topicId;

    var timerObj = setInterval(function(){

    if(votingCounts >= clientList.list.length){//votingEnded

        logger.debug('vote_manage - 通知各个终端投票结束，关闭投票定时器,当前票数和当前在线终端为'+ votingCounts +',' +clientList.list.length);
        votingEnded.noticeVotingEnded(topicId,timerObj);
        votingCounts = 0;
    }

    logger.debug('vote_manage - 现在收到的投票数为:' + votingCounts);
    },3000);//3s timer

};

//==================================================================
//函数名：  statisticsVotes
//作者：    andy.feng
//日期：    2015-04-03
//功能：    实时统计投票结果
//输入参数  终端发过来的用数组装的选项值，如 [赞成]或者[张三，李四]或者10
//返回值：
//==================================================================
exports.statisticsVotes = function(optionValue){

    var eleArrary = optionValue;
//    while((pos = optionValue.indexOf(',')) !== -1){
//        var ele = optionValue.substr(0,pos);
//        eleArrary.push(ele);
//        optionValue = optionValue.substr(pos+1);
//    }
//    eleArrary.push(optionValue);

    logger.trace('vote_manage - 终端发过来的选项值:' + eleArrary);

    for(z in eleArrary){
       if(voteResult[eleArrary[z]] === undefined){
            continue;
       }
       else if(voteResult[eleArrary[z]] === 0){
          voteResult[eleArrary[z]] = 1;
       }else{
          voteResult[eleArrary[z]] += 1;
       }
    }

    logger.trace('vote_manage - 该议题当前的投票情况:' + _showVoteResult());
};

//==================================================================
//函数名：  getVoteResult
//作者：    andy.feng
//日期：    2015-04-03
//功能：    得到当前投票议题的最终结果
//输入参数
//返回值：
//修改记录：
//==================================================================

exports.getVoteResult = function(){
    return voteResult;
};

//==================================================================
//函数名：  setVoteResultNull
//作者：    andy.feng
//日期：    2015-04-03
//功能：    清除当前投票议题的最终结果
//输入参数
//返回值：
//修改记录：
//==================================================================
exports.setVoteResultNull = function(){
    voteResult = {};
};

//==================================================================
//函数名：  showVoteResult
//作者：    andy.feng
//日期：    2015-04-03
//功能：    显示当前投票议题的最终结果，以字符串显示
//输入参数
//返回值：
//修改记录：
//==================================================================
exports.showVoteResult = _showVoteResult;

function _showVoteResult(){
    var voteResultStr = '';
    for(x in voteResult){
        voteResultStr += x + '：' +voteResult[x] + '.';
    }
    return voteResultStr;
};

//==================================================================
//函数名：  initVoteResults
//作者：    andy.feng
//日期：    2015-04-03
//功能：
//输入参数 type:议题类型 options：议题的选项值
//返回值：
//修改记录：
//==================================================================
exports.initVoteResults = function(type,options){

    var voteObject;

    if(type === 2){
        options = options.replace(/:[0-9]+/,'');
    }

    voteObject = options;

    var voteArrary = voteObject.split(',');
    for(x in voteArrary){
        voteResult[voteArrary[x]] = 0;
    }
};