/**
 * Created by fengyun on 2014/12/17.
 */
//about Mysql database
exports.slave1Config = {
    connectionLimit : 10000,
    host            : '192.168.1.2',
    user            : 'root',
    password        : '123123',
    database        :'plc_db',
    port            : 3306
};

exports.slave2Config = {
    connectionLimit : 10000,
    host            : '127.0.0.1',
    user            : 'root',
    password        : '123123',
    database        :'plc_db',
    port            : 3306
};