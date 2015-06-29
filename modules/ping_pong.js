/**
 * Created by Administrator on 2015/4/1.
 */
/**
 * Created by fengyun on 2014/10/13.
 * 调度者，负责维护在线用户列表、状态和检查keep-alive
 */

var   userQueue   = require('./client_list.js');
var   logger      = require('../lib/log.js').logger;
var db_operator = require('./db_operate');

function ping_pong() {
}

ping_pong.openTimer = function(){

    setInterval(function(){
        var tokenTime = 20 * 1000;//20s
        var list = userQueue.list;
        for(var x = 0; x < list.length; ){
            var currentDate = new Date();
            var time =currentDate.getTime();
            var ele = list[x];
            if(ele === undefined){
                ++x;
                continue;
            }
            var difference = time - ele.time;
            if(difference > tokenTime){//user should quit?!
                db_operator.logoff(ele.socket);
               // logger.debug('ping_pong - current client numbers: ' + userQueue.list.length);
            }
            ++x;
        }
      //  logger.debug('ping_pong - current client numbers: ' + userQueue.list.length);

    },3000);//3s timer
};

module.exports = ping_pong;
