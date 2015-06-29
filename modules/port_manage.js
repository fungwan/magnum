/**
 * Created by fengyun on 2015/6/5.
 *
 * 对直播流所需要的端口进行管理
 *
 */


var rtsp_port = 10000;


exports.getNewPort = function(){

    rtsp_port += 1;

    if(rtsp_port > 60000){
        rtsp_port = 10000;
    }

    return rtsp_port;
};

exports.rollbackPort = function(){



};