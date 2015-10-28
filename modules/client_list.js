/**
 * Created by Administrator on 2015/3/31.
 *
 *  * add a comment. modified by Dexter on 2015/4/7.
 */

var logger = require('../lib/log.js').logger;

module.exports = ClientList;

function ClientList(){

}
/*
* 客户端对象容器：每当一个终端成功登录系统后，系统将会为其生成一个对象，
* 并放入此容器当中进行管理，对象属性有socket,mac地址以及最近一次保活时间。
* */

ClientList.list = [];

ClientList.addClient = function(obj){

    /*
        因为考虑到web端可以重复添加到用户列表，所以单独code这段逻辑
     */
    if(obj.mac === 'WEB-CLIENT' || obj.mac === 'WEB-SCREEN'){
        ClientList.list.push(obj);
        return;
    }

    var _socket = ClientList.findSocketByMac(obj.mac);

    if(_socket === null){
        ClientList.list.push(obj);
    }else{

        /*_socket.disconnect();*/
        ClientList.findClientByMac(obj.mac).socket = obj.socket;

        logger.debug('client_list - 有重复终端登陆，说明上一次并没有完全退出，socket未断开，将其替换');

        /*logger.debug('删除前：' + ClientList.list);
        ClientList.removeClient(obj.mac,_socket);
        logger.debug('删除后：' + ClientList.list);
        ClientList.list.push(obj);
        logger.debug('再添加后：' + ClientList.list);*/
    }

};

ClientList.removeClient = function(mac,socket){
    for(index in ClientList.list){

        if(mac === 'WEB-CLIENT' || mac === 'WEB-SCREEN'){
            if(socket === ClientList.list[index].socket){
                logger.trace('client_list - 有web端断开下线，标签号为：' + mac);
                socket.disconnect();
                ClientList.list.splice(index,1);
                break;
            }
        }else{
            if(mac === ClientList.list[index].mac){
                logger.trace('client_list - 有终端断开下线，设备号为：' + ClientList.list[index].name);
                ClientList.list[index].socket.disconnect();
                ClientList.list.splice(index,1);
                break;
            }
        }
    }
};

ClientList.replaceByMac = function(mac, cli){
    for(index in ClientList.list){
        if(mac === ClientList.list[index].mac){
            ClientList.list[index].time = cli.time;//modify 修改替换函数  by fengyun
            break;
        }
    }
    return null;
};

ClientList.findSocketByMac = function(mac){
    for(index in ClientList.list){
        if(mac === ClientList.list[index].mac){
            return ClientList.list[index].socket;
        }
    }
    return null;
};

ClientList.findClientBySocket = function(socket){
    for(index in ClientList.list){
        if(socket === ClientList.list[index].socket){
            return ClientList.list[index];
        }
    }
    return null;
};

ClientList.findClientByMac = function(mac){
    for(index in ClientList.list){
        if(mac === ClientList.list[index].mac){
            return ClientList.list[index];
        }
    }
    return null;
};