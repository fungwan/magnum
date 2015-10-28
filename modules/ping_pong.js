/**
 * Created by Administrator on 2015/4/1.
 */
/**
 * Created by fengyun on 2014/10/13.
 * 调度者，负责维护在线用户列表、状态和检查keep-alive
 */

var   userQueue   = require('./client_list.js');
var   logger      = require('../lib/log.js').logger;

function ping_pong() {
}

ping_pong.openTimer = function(){

    setInterval(function(){
        var tokenTime = 20 * 1000;//20s
        var list = userQueue.list;
        var deviceCounts = 0;
        var memberList = [];
        for(var x = 0; x < list.length; ){
            var currentDate = new Date();
            var time =currentDate.getTime();
            var ele = list[x];

            /*

            因为考虑到socket.io强大的重连机制，所以这里的定时器，刷新在线设备列表仅是测试时方便查看   modify by fengyun 2015/7/10

             */
//            if(ele === undefined){
//                ++x;
//                continue;
//            }
//            var difference = time - ele.time;
//            if(difference > tokenTime){//user should quit?!
//                db_operator.logoff(ele.socket);
//               // logger.debug('ping_pong - current client numbers: ' + userQueue.list.length);
//            }
            if(ele.mac !== 'WEB-CLIENT' && ele.mac !== 'WEB-SCREEN'){
                memberList.push(ele.name);
                ++deviceCounts;
            }
            ++x;
        }
        logger.debug('ping_pong - current client numbers: ' + memberList.length +
            ' 分别有：' + memberList.join(","));

    },10000);//10s timer
};

module.exports = ping_pong;
