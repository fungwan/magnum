/**
 * Created by Dexter on 2015/4/3.
 */


/*
* 聊天组管理：当终端之间需要进行聊天时，首先发起端会向服务器申请创建一个聊天组，
* 服务器生成唯一组ID并将其与组员对应起来，再将ID与组员信息推送给每个组员，当组员
* 进行聊天时则将消息发送到指定id组即可。服务器将根据组id来将消息转发给所有组员。
*
* 更新组信息：更新组员信息指在聊天组中增加或减少人员的情况下发送更新消息给服务器，
* 服务器将更新后的消息转发给之前的所有组员。
* */
var groupList = [];

exports.addGroup = function(group){
    groupList.push(group);
}

exports.findGourpById = function(id){
    for(x in groupList){
        if ( groupList[x].groupId  ===  id)
            return groupList[x];
    }
    return null;
}

exports.updateGroup = function(group){
    for(x in groupList){
        if ( groupList[x].groupId  ===  group.groupId)
            groupList.splice(x, 1, group);
    }
}

exports.deleteGroupById = function(id){
    // to do
}