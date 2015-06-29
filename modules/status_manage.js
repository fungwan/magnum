/**
 * Created by Administrator on 2015/4/1.
 *
 * add a comment. modified by fengyun on 2015/4/7.
 *
 * modify status performance to json by fengyun on 2015/4/9.
 */

/*
此文件为管理会议当中的状态，对终端异常断开重连后，实时获取当前会议状态很重要的类！
 */

var logger = require('../lib/log.js').logger;

module.exports = status_manage;

function status_manage(){
}

status_manage.status = {
    'mainStatus'  :    0,
    'topicStatus' :    0,
    'voteResult'  :    0
};

/*status_manage.status1 = 0;//大会主流程：无状态（终端仅显开机）0、签到状态1、会议未开始状态2、会议进行状态（自动进入议题1阶段）3、会议结束状态4(对数据库而言)
status_manage.status2 = 0;//议题流程：表示正在进行的第几项议题
status_manage.status3 = 0;//议题状态：关联status2，表示第几项议题的议题状态,表决未进行、表决进行中、表决结束*/

/*
承上，比如返回的状态为：3.1.1,解析过程：
先看高位，第一位（status1）为3,表示会议进行中，第二位（status2）为1，表示进行的是议题1，第三位（status3）为1，表示该议题涉及表决，且正在表决
即大会此时的状态是：会议进行到议题1正在投票...
 */

status_manage.meetingId = 0;//just init meeting id

status_manage.setMeetingId = function(id){
    status_manage.meetingId =id;
}

status_manage.getMeetingId = function () {
    return status_manage.meetingId;
}

status_manage.getCurrentStatus = function(){
//    var status = status_manage.status1 + '.' +
//        status_manage.status2 + '.' + status_manage.status3;
    return status_manage.status;
};

status_manage.showCurrentStatus = function(){
    var strStatus = status_manage.status.mainStatus + '.' + status_manage.status.topicStatus + '.' + status_manage.status.voteResult;
    return strStatus;
};

/*
下面的这些接口函数主要是对会议进行中的状态的动态更改
 */

status_manage.setStatus1 = function(mainStatus){
    status_manage.status['mainStatus'] = mainStatus;
};

status_manage.setStatus2 = function(topicId){
    status_manage.status['topicStatus']  = topicId;
};

status_manage.setStatus3ToVoting = function(){
    status_manage.status['voteResult']  = 1;
};

status_manage.setStatus3ToVotingEnd = function(){
    status_manage.status['voteResult']  = 2;
};

status_manage.setStatus3ToZero = function(){
    status_manage.status['voteResult']  = 0;
};
