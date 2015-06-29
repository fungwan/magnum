/**
 * Created by Administrator on 2015/3/31.
 *
 *  * add a comment. modified by Dexter on 2015/4/7.
 */

module.exports = ClientList;

function ClientList(){

}
/*
* 客户端对象容器：每当一个终端成功登录系统后，系统将会为其生成一个对象，
* 并放入此容器当中进行管理，对象属性有socket,mac地址以及最近一次保活时间。
* */

ClientList.list = [];

ClientList.addClient = function(obj){
    ClientList.list.push(obj);
};

ClientList.removeClient = function(mac){
    for(index in ClientList.list){
        if(mac === ClientList.list[index].mac){
            //ClientList.list[index].socket.disconnect();  //不必重复disconnect，亦可规避多个web标签socket异常断开的bug  modify by fengyun 2015/05/25
            ClientList.list.splice(index,1);
            break;
        }
    }
};

ClientList.replaceByMac = function(mac, cli){
    for(index in ClientList.list){
        if(mac === ClientList.list[index].mac){
            ClientList.list.splice(index,1, cli);
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