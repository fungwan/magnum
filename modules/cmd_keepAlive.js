/**
 * Created by Dexter on 2015/4/7.
 */

var jsonFormat = require('../lib/jsonFormat');
var logger = require('../lib/log.js').logger;
var ClientList = require('./client_list');


exports.keepAlive = function(parameters, socket){
    logger.debug('cmd_keepAlive - ...');

    var response;
    var curDate = new Date();
    var cli = ClientList.findClientBySocket(socket);
    if(cli === null){
        response = {
            cmd:'keepAlive',
            result:'fail',
            content:null
        }
    }else{
        cli.time = curDate.getTime();
        ClientList.replaceByMac(cli.mac, cli);
        response = {
            cmd:'keepAlive',
            result:'true',
            content:null
        }
    }
    socket.send(jsonFormat.jsonToString(response));
};