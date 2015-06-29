/**
 * Created by fengyun on 2015/5/25.
 */

var dbService = require('./db_service');
var dbOperate = require('./db_operate');
var logger = require('../lib/log.js').logger;
var async = require('async');

exports.web_logon = function(req,res){

    var conferenceName = '';

    async.auto({
        get_status:function(callback){
            var multiSql = 'SELECT id,`name`,states FROM plc_conference WHERE states != \'0.0.0\' and states != \'4.0.0\'';
            dbService.selectMoreValue(multiSql,callback);
        },
        get_checkinInfo: ['get_status',function(callback, results){
            if(results.get_status.length  === 0 ){
                //no meeting
                /*res.render('index',{title:'',
                                    content:'',
                                    arrived:'',
                                    notArrived:''});*/
                res.send(404,'当前没有会议！');
                return;
            }
            var resValues = results.get_status[0];
            var statusArr = resValues.states.split(".");

            conferenceName = resValues.name;
            var conferenceId = resValues.id;

            if(statusArr[0] === '2'){//show checkinInfo

                //var multiSql = 'SELECT id,`name`,states FROM plc_conference WHERE states != \'0.0.0\' and states != \'4.0.0\'';
                //dbService.selectMoreValue(multiSql,callback);

                dbOperate.updateCheckin(sendUpdateCheckin);

            }else{//show topic info

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

            function sendUpdateCheckin(data){
                if(data.result === false){
                    //get info fail
                }else {
                    var info = data.jsonObj;
                    /*
                     var response = {
                     cmd:'updateCheckin',
                     parameters:{
                     arrived:arrived,
                     notArrived:allNum - arrived
                     }
                     }
                     */
                    var parameters = info.parameters;

                    res.render('index',{title:conferenceName,
                                        content:'',
                                        arrived:parameters.arrived,
                                        notArrived:parameters.notArrived});
                }
            }

        }]
    },function(err,results){
        if(err !== null){
            logger.error('初始化会议状态失败，查询数据库错误！');
        }else{
            var topicName = results.get_checkinInfo;
            res.render('index',{title:conferenceName,
                                content:topicName});
        }
    });
};