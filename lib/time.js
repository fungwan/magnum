/**
 * Created by fengyun on 14-6-20.
 *
 *
 *
    var myDate = new Date();
     myDate.getYear();        //获取当前年份(2位)
     myDate.getFullYear();    //获取完整的年份(4位,1970-????)
     myDate.getMonth();       //获取当前月份(0-11,0代表1月)
     myDate.getDate();        //获取当前日(1-31)
     myDate.getDay();         //获取当前星期X(0-6,0代表星期天)
     myDate.getTime();        //获取当前时间(从1970.1.1开始的毫秒数)
     myDate.getHours();       //获取当前小时数(0-23)
     myDate.getMinutes();     //获取当前分钟数(0-59)
     myDate.getSeconds();     //获取当前秒数(0-59)
     myDate.getMilliseconds();    //获取当前毫秒数(0-999)
     myDate.toLocaleDateString();     //获取当前日期
     var mytime=myDate.toLocaleTimeString();     //获取当前时间
     myDate.toLocaleString( );        //获取日期与时间
 *
 *
 *
 *
 */
exports.getCurrentTime = function(flag){

    var currentTime = "";
    var myDate = new Date();
    var year = myDate.getFullYear();
    var month = parseInt(myDate.getMonth().toString()) + 1; //month是从0开始计数的，因此要 + 1
    if (month < 10) {
        month = "0" + month.toString();
    }
    var date = myDate.getDate();
    if (date < 10) {
        date = "0" + date.toString();
    }
    var hour = myDate.getHours();
    if (hour < 10) {
        hour = "0" + hour.toString();
    }
    var minute = myDate.getMinutes();
    if (minute < 10) {
        minute = "0" + minute.toString();
    }
    var second = myDate.getSeconds();
    if (second < 10) {
        second = "0" + second.toString();
    }
    if(flag == "0")
    {
        currentTime = year.toString() + month.toString() + date.toString() + hour.toString() + minute.toString() + second.toString(); //返回时间的数字组合
    }
    else if(flag == "1")
    {
        currentTime = year.toString() + "/" + month.toString() + "/" + date.toString() + " " + hour.toString() + ":" + minute.toString() + ":" + second.toString(); //以时间格式返回
    }
    return currentTime;
};

exports.isFromBiggerThanTo = function(dtmfrom, dtmto){
    var from = new Date(dtmfrom).getTime();
    var to = new Date(dtmto).getTime() ;
    return from >= to ;
};