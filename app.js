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

db_operator.initMeetingStatus();
//从数据库读取最新的会议状态，为防止服务器崩溃重启后会议状态清零
server.listen(6688);
//pingPong.openTimer();

logger.info('Magnum has been started and listening on port : 6688 ');

io.on('connection', function (socket) {
    logger.debug('new client connected...');

    socket.on('message', function (message) {
        handles(message, socket);
    });

    socket.on('disconnect', function () {
        db_operator.logoff(socket);
        logger.debug('client disconnect');
    });
});