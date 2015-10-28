/**
 * Created by Administrator on 2015/3/31.
 */

var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var cmd_logon = require('./cmd_logon').logon;
var cmd_startCheckin = require('./cmd_startCheckin').startCheckin;
var cmd_meetingInfo = require('./cmd_meetingInfo').meetingInfo;
var cmd_startMeeting = require('./cmd_startMeeting').startMeeting;
var cmd_checkinReply = require('./cmd_checkinReply').checkinReply;
var cmd_createGroup  = require('./cmd_createGroup').createGroup;
var cmd_updateGroup  = require('./cmd_updateGroup').updateGroup;
var cmd_message  = require('./cmd_message').message;
var cmd_changeTopic = require('./cmd_changeTopic').changeTopic;
var cmd_startVote = require('./cmd_startVote').startVote;
var cmd_VotingEnded = require('./cmd_votingEnded').votingEnded;
var cmd_memberInfo = require('./cmd_memberInfo').memberInfo;
var cmd_fileShare = require('./cmd_fileShare').fileShare;
var cmd_keepAlive = require('./cmd_keepAlive').keepAlive;
var cmd_callWaiter = require('./cmd_callWaiter').callWaiter;
var cmd_waiterReply = require('./cmd_waiterReply').waiterReply;
var cmd_cancelProjection = require('./cmd_cancelProjection').cancelProjection;
var cmd_voteResult = require('./cmd_voteResult').voteResult;
var cmd_changeRole = require('./cmd_changeRole').changeRole;
var cmd_changeRoleReply = require('./cmd_changeRoleReply').changeRoleReply;
var cmd_projection = require('./cmd_projection').projection;
var cmd_meetingOver = require('./cmd_meetingOver').meetingOver;
var cmd_replyProjection = require('./cmd_replyProjection').replyProjection;
var cmd_onlyChairmanMode = require('./cmd_onlyChairmanMode').onlyChairmanMode;
var cmd_powerOff = require('./cmd_powerOff').powerOff;
var cmd_syncOfficeToWeb = require('./cmd_syncOfficeToWeb').syncOfficeToWeb;

var handle = {};
/////////////////////////////////////////
handle['logon'] = cmd_logon;                //1h
handle['startCheckin'] = cmd_startCheckin;  //1h
handle['checkinReply'] = cmd_checkinReply;         //1h
handle['meetingInfo'] = cmd_meetingInfo;          //3h

/////////////////////////////////////////
handle['startMeeting'] = cmd_startMeeting;  //1h
handle['changeTopic'] = cmd_changeTopic;          //1h
////////////////////////////////////////    //6h
handle['startVote'] = cmd_startVote;
handle['voteResult'] = cmd_voteResult;
handle['votingEnded'] = cmd_VotingEnded;

///////////////////////////////////////////
handle['createGroup'] = cmd_createGroup;
handle['updateGroup'] = cmd_updateGroup;
handle['message'] = cmd_message;              //6h

                                            //3h
handle['changeRole'] = cmd_changeRole;
handle['changeRoleReply'] = cmd_changeRoleReply;

handle['memberInfo'] = cmd_memberInfo;           //1h
handle['share'] = cmd_fileShare;                //1h

                                            //2h
handle['projection'] = cmd_projection;
handle['cancelProjection'] = cmd_cancelProjection;
handle['replyProjection'] = cmd_replyProjection;
//////////////////////////////////////////
handle['waiter'] = cmd_callWaiter;               //1h
handle['waiterReply'] = cmd_waiterReply;

//////////////////////////////////////////
handle['keepAlive'] = cmd_keepAlive;            //0.5h

handle['meetingOver'] = cmd_meetingOver;

handle['onlyChairmanMode'] = cmd_onlyChairmanMode;

handle['powerOff'] = cmd_powerOff;

handle['syncOfficeToWeb']  = cmd_syncOfficeToWeb;

exports.handles = function(message, socket){

    var jsonObj = jsonFormat.stringToJson(message);
    if(jsonObj === null)
        return;

    if (typeof handle[jsonObj.cmd] === 'function'){
        handle[jsonObj.cmd](jsonObj.parameters, socket);
    }
};


