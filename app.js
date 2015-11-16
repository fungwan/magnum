/**
 * Created by fengyun on 2015/3/31.
 *
 * modify express framework for adding http page service
 *
 */

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var dgram = require("dgram");

var jsonFormat = require('./lib/jsonFormat');
var handles = require('./modules/handles').handles;
var logger = require('./lib/log.js').logger;
var pingPong = require('./modules/ping_pong.js');
var db_operator = require('./modules/db_operate');
var route = require('./routes');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//static path
app.use(require('express').static(path.join(__dirname, 'public')));

//web screen
route(app);

server.listen(6688);

var dbInitTimer = setInterval(function(){

    db_operator.initMeetingStatus(listen);

},1500);

//从数据库读取最新的会议状态，为防止服务器崩溃重启后会议状态清零

function listen(err,data){

    if(err === null){

        clearInterval(dbInitTimer);

        pingPong.openTimer();

        logger.info('Magnum has been started and listening on port : 6688 ');

    }else{

        logger.error('会议初始化状态失败，服务器启动失败！请检查数据库配置,然后重启!');
    }
}

io.on('connection', function (socket) {
    //logger.debug('new client connected...');

    socket.on('message', function (message) {
        handles(message, socket);
    });

    socket.on('disconnect', function () {
        db_operator.logoff(socket);
        //logger.debug('client disconnect');
    });
});

/*
   udp server
 */
var udpServer = dgram.createSocket("udp4");

udpServer.on("error", function (err) {
    logger.error("server error:\n" + err.stack);
    udpServer.close();
});

udpServer.on("message", function (msg, rinfo) {
    logger.trace("server got: " + msg + " from " +
        rinfo.address + ":" + rinfo.port);

    var jsonObj = jsonFormat.stringToJson(msg);
    if(jsonObj === null)
        return;

    if(jsonObj["cmd"] === 'whoIsServer'){

        var message = new Buffer(jsonFormat.jsonToString({
            cmd:'serverIsHere',
            parameters:	null
        }));

        udpServer.send(message, 0, message.length, 41235, rinfo.address, function(err, bytes) {
            //socket.close();
        });
    }
});

udpServer.on("listening", function () {
    var address = udpServer.address();
    logger.trace("Magnum udp server listening " +
        address.address + ":" + address.port);
});

udpServer.bind(41234);