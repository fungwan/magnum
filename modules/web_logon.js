/**
 * Created by fengyun on 2015/5/25.
 */

var dbService = require('./db_service');
var dbOperate = require('./db_operate');
var logger = require('../lib/log.js').logger;
var jsonFormat = require('../lib/jsonFormat');
var async = require('async');

exports.web_logon = function(req,res){

    var conferenceName = '';
    var strPlcStyle = '';

    var ipAddress = getIPAddress();
    function getIPAddress(){

        var interfaces = require('os').networkInterfaces();

        for(var devName in interfaces){

            var iface = interfaces[devName];
            for(var i=0;i<iface.length;i++){
                var alias = iface[i];
                if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                    return alias.address;
                }
            }
        }
    }

    if(ipAddress === undefined){
        res.send(503,'服务器IP地址获取错误，请检查网络配置！');
        return;
    }

    async.auto({
        get_status:function(callback){
            var multiSql = 'SELECT id,`name`,states FROM plc_conference WHERE states != \'0.0.0\' and states != \'4.0.0\'';
            dbService.selectMoreValue(multiSql,callback);
        },
        get_checkinInfo: ['get_status',function(callback, results){
            if(results.get_status.length  === 0 ){
                //no meeting
                res.send(404,'当前没有会议！');
                return;
            }
            var resValues = results.get_status[0];
            var statusArr = resValues.states.split(".");

            conferenceName = resValues.name;
            var conferenceId = resValues.id;

            //获取本次会议的大屏风格
            var _plcStyle = {};
            dbOperate.getScreenStyle(conferenceId,styleBack);

            function styleBack(styleData){

                if(styleData !== 'fail'){
                    _plcStyle = styleData;
                    strPlcStyle = jsonFormat.jsonToString(_plcStyle);
                    if(strPlcStyle === null)
                        strPlcStyle = '';
                }

                if(statusArr[0] === '2'){//show checkinInfo

                    dbOperate.updateCheckin(sendUpdateCheckin);

                    function sendUpdateCheckin(data){
                        if(data.result === false){
                            //get info fail

                            console.error('web-logon 获取签到信息出错');

                            res.send(503,'获取签到信息出错！请检查服务器数据库配置');

                        }else {
                            var info = data.jsonObj;
                            var parameters = info.parameters;

                            res.render('index',{title:conferenceName,
                                content:'',
                                arrived:parameters.arrived,
                                notArrived:parameters.notArrived,
                                ip :ipAddress,
                                screenStyle:strPlcStyle});
                        }
                    }

                }else{//show topic info

                    if(statusArr[1] === '0'){
                        //会议开始了，但是议题没有开始
                        res.render('index',{title:conferenceName,
                            content:' 还未开始',
                            arrived:0,
                            notArrived:0,
                            ip :ipAddress});
                        return;
                    }

                    /*SELECT content from plc_topicmanagement
                     WHERE conferenceId = 1428564574957
                     AND   id = 3*/

                    var topicId = statusArr[1];

                    var condition = 'WHERE conferenceId = ';
                    condition += conferenceId;
                    condition += ' AND id= ';
                    condition += topicId;

                    dbService.selectValue('content','plc_topicmanagement',condition,callback);
                }
            }
        }]
    },function(err,results){
        if(err !== null){

            logger.error('初始化会议状态或者抓取议题内容失败，查询数据库错误！');
            res.send(503,'获取议题信息出错！请检查服务器数据库配置！');

        }else{
            var topicName = results.get_checkinInfo;
            res.render('index',{title:conferenceName,
                                content:topicName,
                                arrived:0,
                                notArrived:0,
                                ip :ipAddress,
                                screenStyle:strPlcStyle});
        }
    });
};