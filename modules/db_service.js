/**
 * Created by fengyun on 14-6-18.
 * Modified by andy.feng on 14-8-28
 */
var async = require('async'),
    conf        = require('../conf/index.js'),
    sessionPool = require('./mySQLPool.js'),
    logger = require('../lib/log.js').logger;

//==================================================================
//函数名：  _query
//作者：    andy.feng
//日期：    2014-08-26
//功能：    负责发送sql查询
//输入参数：无
//返回值：  无
//修改记录：
//==================================================================
var _query = function(sqlData,callback){

    if(sessionPool != null){
        sessionPool.getConnection(function(err, connection) {//'SLAVE*', 'ORDER',
            if(err){
				//sessionPool.add('SLAVE1', conf.slave1Config);
				//sessionPool.add('SLAVE2', conf.slave2Config);
				
                logger.error(new Date() + "POOL ==> " + err);
                callback(err, '');
                return ;
            }

            connection.query( sqlData, function(error, results) {
                if (error) {
                    logger.error('QueryError:' +  sqlData + '--' +error.message);
                    callback(error, '');
                    connection.release();
                    return;
                }

                if (results.length > 0) {
                    callback(null, results);//有值，返回含有1个或多个对象的数组
                }else{
                    callback(null,'');
                }

                connection.release();
            });
        });
    }
}

var service = {

    _setSessionPool : function(pool) {
        sessionPool = pool;
    },

    //==================================================================
    //函数名：  _getOne
    //作者：    andy.feng
    //日期：    2014-08-26
    //功能：    查询一个单个的值，例如- sql = 'select count(*) from stu';
    //输入参数：无
    //返回值：  无
    //修改记录：
    //==================================================================

    _getOne : function(queryValue,tableName,condition,callback){

        async.auto({
            query_db: function(_callback){
                var sqlData = 'SELECT ' + queryValue + ' FROM ' + tableName + ' ' +condition;

                _query(sqlData,_callback);
            },
            get_data: ['query_db',function(_callback ,results) {
                var rs = results.query_db;
                if(rs != ''){
                   var signal = rs[0][queryValue];
                    _callback(null,signal);
                }else{
                   _callback(null,rs);
                }
            }]
        },function(err, results) {
            if(err === null){
                var rsData = results.get_data;
                callback(null,rsData);
            }else{
                callback(err,results.query_db);
            }
        });
    },

    //==================================================================
    //函数名：  _getRow
    //作者：    andy.feng
    //日期：    2014-08-26
    //功能：    查询一行记录多个列，例如- sql = 'select * from stu where id=16';
    //输入参数：无
    //返回值：  无
    //修改记录：
    //==================================================================

    _getRow: function(queryValue,tableName,condition,callback){
        async.auto({
            query_db: function(_callback){
                var sqlData = 'SELECT ' + queryValue + ' FROM ' + tableName + ' ' +condition;
                _query(sqlData,_callback);
            },
            get_data: ['query_db',function(_callback ,results) {
                var rs = results.query_db;
                if(rs != ''){
                    var signalRow = rs[0];
                    _callback(null,signalRow);
                }else{
                    _callback(null,rs);
                }
            }]
        },function(err, results) {
            if(err === null){
                var rsData = results.get_data;
                callback(null,rsData);
            }
            else{
                callback(err,results.query_db);
            }
        });
    },

    //==================================================================
    //函数名：  _getAll
    //作者：    andy.feng
    //日期：    2014-08-26
    //功能：    查询多行记录，例如- sql = 'select * from stu ';
    //输入参数：无
    //返回值：  无
    //修改记录：
    //==================================================================

    _getAll: function(queryValue,tableName,condition,callback){
        async.auto({
            query_db: function(_callback){
                var sqlData = 'SELECT ' + queryValue + ' FROM ' + tableName + ' ' +condition;
                _query(sqlData,_callback);
            },
            get_data: ['query_db',function(_callback ,results) {
                var rs = results.query_db;
                _callback(null,rs);
            }]
        },function(err, results) {
            if(err === null){
               var rsData = results.get_data;
               callback(null,rsData);
            }else{
                callback(err,results.query_db);
            }
        });
    },

    //==================================================================
    //函数名：  _updateValue
    //作者：    andy.feng
    //日期：    2014-08-26
    //功能：    更新记录;
    //输入参数：无
    //返回值：  无
    //修改记录：
    //==================================================================
    _updateValue : function(tableName,updateValue,condition,callback){

        async.auto({
            query_db: function(_callback){
                //update area set Name='SheHong' where ID=1
                var updateSQLString = 'update ' + tableName + ' set ' +  updateValue  + condition;
                _query(updateSQLString,_callback);
            }
        },function(err) {
            if(err !== null){
                logger.error('update error: ' + err);
                callback(err,'fail');
            }else{
                callback(null,'success');
            }
        });
    },

    //==================================================================
    //函数名：  _insertValues
    //作者：    andy.feng
    //日期：    2014-08-26
    //功能：    插入数据;
    //输入参数：无
    //返回值：  无
    //修改记录：
    //==================================================================

    _insertValues : function(tableName,columnName,insertValue,callback){

        async.auto({
            query_db: function(_callback){
                //update area set Name='SheHong' where ID=1
                var insertData = 'insert into ' + tableName + ' (' + columnName + ' ) VALUES ( ' +insertValue + ' )';
                _query(insertData,_callback);
            }
        },function(err) {
            if(err !== null){
                logger.error('insert error: ' + err);
                callback(err,'fail');
            }else{
                callback(null,'success');
            }
        });
    },

    //==================================================================
    //函数名：  _replaceValues
    //作者：    andy.feng
    //日期：    2014-08-26
    //功能：    插入数据时判断某列数据是否存在，不存在就插入;
    //输入参数：-columnName    要更新或插入的列
    //         -insertValue   为上述列的值，格式为（2013-3-2；‘23:32,45:23’；‘23:32,33:98’）
    //         -pos           查询字段的下标（可废弃）
    //         -replaceColumn 需要检查的字段
    //返回值：  无
    //修改记录：
    //==================================================================

    _replaceValues : function(tableName,columnName,insertValue,replaceColumn,pos){
        var checkDateValue = insertValue.split(';')[pos];
        var condition = ' where date = ' + checkDateValue + '';

        var replaceData = 'SELECT 1 FROM ' + tableName + ' ' +condition;
        async.auto({
            query_db: function(_callback){
                _query(replaceData,_callback);
            },
            get_data: ['query_db',function(_callback ,results) {
                var rs = results.query_db;
                if(rs === ''){//no record, and insert
                    var semicolonCounts = insertValue.split(';').length;
                    for(var i = 0; i < semicolonCounts;++i){
                        insertValue = insertValue.replace(';',',');
                    }
                    var insertData = 'insert into ' + tableName + ' (' + columnName + ' ) VALUES ( ' +insertValue + ' )';
                    _query(insertData,_callback);
                }else{
                    //update area set Name='SheHong' where ID=1
                    var length = columnName.split(',').length;
                    var updateValue = '';
                    for(var index = 1; index < length;++index){
                        var tmpValue= columnName.split(',')[index] + ' = ' + insertValue.split(';')[index] + ' ,';
                        updateValue += tmpValue;
                    }
                    updateValue = updateValue.substr(0,(updateValue.length - 1));
                    var updateSQLString = 'update ' + tableName + ' set ' +  updateValue  + condition;
                    _query(updateSQLString,_callback);
                }
            }]
        },function(err) {
            if(err !== null){
                logger.error('replace error: ' + err);
            }
        });
    },

    //==================================================================
    //函数名：  _clearTable
    //作者：    andy.feng
    //日期：    2014-08-26
    //功能：    清空表中的数据;
    //输入参数：无
    //返回值：  无
    //修改记录：
    //==================================================================

    _clearTable : function(tableName){
        var removeData = 'TRUNCATE TABLE  ' + tableName ;
        async.auto({
            query_db: function(_callback){
                _query(removeData,_callback);
            }
        },function(err) {
            if(err !== null){
                logger.error('clear error: ' + err);
            }
        });
    },

    //==================================================================
    //函数名：  _getUnion
    //作者：    andy.feng
    //日期：    2014-11-05
    //功能：    查询更为复杂的查询，这里指联合查询;
    //输入参数：无
    //返回值：  无
    //修改记录：
    //==================================================================

    _getUnion: function(queryValue,callback){
        async.auto({
            query_db: function(_callback){
                var sqlData = queryValue;
                _query(sqlData,_callback);
            },
            get_data: ['query_db',function(_callback ,results) {
                var rs = results.query_db;
                _callback(null,rs);
            }]
        },function(err, results) {
            if(err === null){
                var rsData = results.get_data;
                callback(null,rsData);
            }
            else{
                callback(err,results.query_db);
            }
        });
    }
};

exports.setSessionPool = service._setSessionPool;
exports.selectValue = service._getOne;//查询一行一列
exports.selectValueEx = service._getRow;//查询一行，单列/多个列
exports.selectMulitValue = service._getAll;//查询多行,单列/多个列
exports.selectMoreValue = service._getUnion;//查询更为复杂的查询例如多表

exports.insertValue = service._insertValues;
exports.replaceValue = service._replaceValues;
exports.updateValue = service._updateValue;

exports.clearTable = service._clearTable;