/**
 * Created by fengyun on 2015/7/6.
 */

var exec = require('child_process').exec;
var fs = require("fs");
var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var transponder = require('./message_forward');
var ClientList = require('./client_list');

exports.powerOff = function(parameters, socket){

    logger.trace('cmd_poweroff - 接收到关机命令');

    transponder.messageForwardAll(socket, jsonFormat.jsonToString({
        cmd:'powerOff',
        parameters:null
    }));

    socket.send(jsonFormat.jsonToString({
        cmd:'powerOff',
        parameters:null
    }));


//    var currPath = process.cwd();//当前server路径
//    logger.trace('当前app执行路径为：' + currPath);
//
//    var filePath = currPath + '\\dll\\ipList.txt';//bat's location
//
//    var ipListData = '';
//    for(x in ClientList.list){
//        var clientIp = ClientList.list[x].ip;    //从clientList循环拿到各设备Ip地址
//        if(clientIp ===  undefined)
//            continue;
//
//        clientIp += '\r\n';
//        ipListData += clientIp;
//    }
//
//    //fs.writeFileSync(filePath, ipListData, {encoding : 'utf8'});
//
//    var pythonExecPath = currPath + '\\dll\\powerOff.py';//bat's location
//    var execPath = 'python "' + pythonExecPath + '"';
//    exec(execPath,
//        function (error, stdout, stderr) {
//            if (error !== null) {
//                logger.error('错误的执行路径？' + execPath);
//                logger.error('cmd_poweroff - bat文件执行失败！exec error: '+ error.message);
//            }else{
//                logger.trace('cmd_poweroff - bat文件执行成功！以下为adb执行过程...');
//                logger.trace(stdout);
//            }
//
//        });

//    node 异步的方式批量执行bat命令  *废除*
//    cmd for kill adb server
//    exec(' cd dll && adb kill-server',
//        function (error, stdout, stderr) {
//            if (error !== null) {
//                logger.error('cmd_poweroff - exec error: ' + error.message);
//            }else{
//                logger.trace('cmd_poweroff - kill adb server 执行成功！');
//
//
//                for(x in ClientList.list){
//
//                    var clientIp = ClientList.list[x].ip;    //从clientList循环拿到各设备Ip地址
//                    if(clientIp === undefined){
//                        continue;
//                    }
//                    //0.删除某个文件夹下的所有内容(ignore)
//                    //1.创建文件
//                    //2.向文件里面写内容
//
//                    var currPath = process.cwd();//当前server路径
//                    logger.trace('当前app执行路径为：' + currPath);
//
//                    /*
//                     adb's content
//                     */
//                    var adbPath = 'cd dll\r\n';//change to adb dir
//                    //clientIp = '192.168.1.28';
//                    /*
//                     adb exec cmd
//                     */
//                    var execAdb = 'adb disconnect\r\n';
//                    execAdb += 'adb connect ';
//                    execAdb += clientIp + ':5555\r\n';
//                    execAdb += 'adb -s ' + clientIp + ':5555 shell reboot\r\n';// -p
//
//                    var cmdData = adbPath + execAdb;//need stream to adb.bat file
//                    var filePath = currPath + '\\dll\\powerOff\\' + clientIp +'.bat';//bat's location
//
//                    logger.trace('进入同步文件写入处理前的文件路径为：' + filePath);
//
//                    /*
//
//                    考虑到是关机服务，所以用异步的方式写入文件
//
//                     */
//
//                    /*fs.writeFileSync(filePath, cmdData, 'utf8', function(err){
//                        if(err){
//                            logger.error('cmd_poweroff - 创建并写入bat文件失败,路径为：' + filePath);
//                        }else{
//                            logger.trace('cmd_poweroff - 创建并写入bat文件成功,路径为：' + filePath);
//
//                            var execPath = 'call "' + filePath + '"';
//                            exec(execPath,
//                                function (error, stdout, stderr) {
//                                    if (error !== null) {
//
//                                        logger.error('cmd_poweroff - bat文件执行失败！exec error: ' + error.message);
//                                    }else{
//                                        console.log(stdout);
//                                        logger.trace('cmd_poweroff - bat文件执行成功！');
//                                    }
//
//                                });
//                        }
//                    });*/
//
//
//                    fs.writeFileSync(filePath, cmdData, {encoding : 'utf8'});
//
//                    var execPath = 'call "' + filePath + '"';
//                    exec(execPath,
//                        function (error, stdout, stderr) {
//                            if (error !== null) {
//                                logger.error('错误的执行路径吗？' + execPath);
//                                logger.error('cmd_poweroff - bat文件执行失败！exec error: '+ error.message);
//                            }else{
//                                logger.trace('cmd_poweroff - bat文件执行成功！以下为adb执行过程...');
//                                logger.trace(stdout);
//                            }
//
//                    });
//                }
//            }
//        });

};