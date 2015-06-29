/**
 * Created by Dexter on 2015/2/2.
 */

var log4js = require('log4js');

log4js.configure({
    appenders: [
        {
            type: 'console'
        },
        {
            type: "dateFile",
            filename: 'logs/log.txt',
            pattern: "_yyyy-MM-dd",
            alwaysIncludePattern: false,
            category: 'Log'
        }
    ],
    replaceConsole: true,
    levels:{
        Log : 'TRACE'
    }
});


exports.logger = log4js.getLogger('Log');




