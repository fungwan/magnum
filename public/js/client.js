/**
 * Created by fengyun on 2015/4/18.
 *
 * important eg:
 *
                options.series[0].data = [
                                           ['d',0],
                                           ['f',0]
                                         ];
 *
 *
 */
//doc loading

var hightChart; //
var showData = [];//
var isShowVoteResults = 0;
var isStarted = 0;

var arrived = 0;
var no_arrived = 0;

var options = {
    chart: {
        renderTo: 'container',
        type: 'column'
    },
    title: {
             text: '',
             style:{ "color": "#0000cc", "fontSize": "38px" , "fontWeight":'bold'}
    },
    series: [{
            dataLabels: {
                enabled: true,
                rotation: -1,
                color: '#ff0000',
                align: 'right',
                //format: '{point.y:d}', // one decimal
                y: 5, // 10 pixels down from the top
                style: {
                    fontSize: '53px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
    }],
    xAxis: {
            type: 'category',
            labels: {
                rotation: 0,
                style: {
                    fontSize: '33px',
                    fontFamily: 'Verdana, sans-serif',
                    fontWeight:'bold'
                }
            }
    },
    yAxis: {
            min: 0,
            title: {
                text: '票数'
            }
     },
     legend: {
            enabled: false
     }

};

$(function(){               // equal $(document).ready(function(){})
    //alert("test read load");
});

//socket.io
var socket = io.connect('192.168.1.111:6688');

socket.send('{ "cmd":"logon","parameters":{"mac":"WEB-CLIENT"} }');

socket.on('message', function(msg){

    var jsonObj;
    try {
        jsonObj = JSON.parse(msg);
    }catch (err){
        return false;
    }

    var messageType = jsonObj.cmd;
    var data = jsonObj.parameters;

    if(messageType === 'updateCheckin'){
        if(isStarted === 0){
            $("#noMeeting").css({'display':'none'});
            $(".meetingInfo").css({'display':''});
            arrived = data.arrived;
            no_arrived = data.notArrived;

            $("#arrived").text(arrived);
            $("#no_arrived").text(no_arrived);
        }

    }else if(messageType === 'changeTopic'){

        isStarted = 1;

        $(".meetingInfo").css({'display':'none'});
        $(".avatar_projection").css({'display':'none'});
        $("#vod_projection").css({'display':'none'});
        $("#statistics").css({'display':'none'});
        $("#topicInfo").css({'display':''});

        var topicName = data.content;
        topicName = '议题: ' + topicName;

        $("#topicInfo > p").text(topicName);

    }else if(messageType === 'startVote'){

        $(".meetingInfo").css({'display':'none'});
        $(".avatar_projection").css({'display':'none'});
        $("#vod_projection").css({'display':'none'});
        $("#statistics").css({'display':'none'});
        $("#topicInfo").css({'display':''});
        isShowVoteResults = 0;

        showData = [];

        var topicName = data.content;
        var voteObject = data.voteObject;
        var voteType = data.type;
        if(voteType === 2){
            voteObject = voteObject.replace(/:[0-9]+/,'');
        }
        var voteArrary = voteObject.split(',');
        var tmpArrary = [];
        for(x in voteArrary){
            tmpArrary.push([voteArrary[x],0]);
        }

        options.title['text'] = topicName;

        options.series[0].data = tmpArrary;
        showData = tmpArrary;
        hightChart = new Highcharts.Chart(options);

    }else if(messageType === 'voteResult'){

        var results = data.optionValues;
        showData = [];
        for(x in results){
            var ele = [x,results[x]];
            showData.push(ele);
        }

        options.series[0].data = showData;
        hightChart = new Highcharts.Chart(options);

        if(isShowVoteResults === 1){
            $(".meetingInfo").css({'display':'none'});
            $(".avatar_projection").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#topicInfo").css({'display':'none'});
            $("#statistics").css({'display':''});
        }

    }else if(messageType === 'votingEnded'){

        $(".meetingInfo").css({'display':'none'});
        $("#topicInfo").css({'display':''});
        $(".avatar_projection").css({'display':'none'});
        $("#vod_projection").css({'display':'none'});
        $("#statistics").css({'display':'none'});

    }else if(messageType === 'meetingOver'){
        $(".avatar_projection").css({'display':'none'});
        $("#vod_projection").css({'display':'none'});
        $("#statistics").css({'display':'none'});
        $(".meetingInfo").css({'display':''});
        $("#checkinInfo").css({'display':'none'});
        $("#topicInfo").css({'display':'none'});
        $("#overInfo").css({'display':''});
        isStarted = 0;
        isShowVoteResults = 0;
        socket.disconnect();

    }else if(messageType === 'projection'){
        $(".meetingInfo").css({'display':'none'});
        if(data.type === 'playVideo'){
            $(".avatar_projection").css({'display':'none'});
            $("#statistics").css({'display':'none'});//control statistics display
            $("#topicInfo").css({'display':'none'});
            $("#vod_projection").css({'display':''});

            var url = data.videoURL;

            var flashvars={
                f:url,//http://movie.ks.js.cn/flv/other/1_0.flv
                c:0,
                b:1,
                p:1

            };
            var params={bgcolor:'#FFF',allowFullScreen:true,allowScriptAccess:'always',wmode:'transparent'};
            CKobject.embedSWF('/ckplayer/ckplayer.swf','vod_projection','ckplayer_a1','100%','100%',flashvars,params);

        }else if(data.type === 'avatar'){

            options.series[0].data = showData;

            $("#statistics").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#topicInfo").css({'display':'none'});
            $(".avatar_projection").css({'display':''});

            $(".avatar_projection").empty();
			$(".avatar_projection").removeAttr("style"); 
			
            var macArrary = data.clientId;

			var deviceCounts = macArrary.length;
            for(x in macArrary){
				if(deviceCounts === 1){
                    var html = '';
					html += '<embed autostart="true" type="application/x-vlc-plugin" pluginspage="http://www.videolan.org"';
					html += 'version="VideoLAN.VLCPlugin.2" width="100%" height="100%" id="vlc_' +  macArrary[x] + '"';
					html += ">";
					html += '</embed>';
                    //append client avatar
                    $(".avatar_projection").append(html);

                    $(".avatar_projection").css({width:"100%",height:"100%",position: "absolute",top: "0",left: "0"});
				}else{
                    var html = '';
					html ='<div class="\" ';
					html += 'style="display: inline-block; opacity: 1;margin-right:25px;margin-bottom:10px;"';
					html += ">";
					html += '<div class="portfolio-wrapper"';
					html += ">";
					html += '<embed autostart="true" type="application/x-vlc-plugin" pluginspage="http://www.videolan.org"';
					html += 'version="VideoLAN.VLCPlugin.2" width="320" height="240" id="vlc_' +  macArrary[x] + '"';
					html += ">";
					html += '</embed></div></div>';
                    //append client avatar
                    $(".avatar_projection").append(html);
				}
            }
        }else if(data.type === 'voteResult'){

            isShowVoteResults = 1;

            $(".avatar_projection").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#topicInfo").css({'display':'none'});
            $("#statistics").css({'display':''});

            options.series[0].data = showData;

            hightChart = new Highcharts.Chart(options);

        }
    }else if(messageType === 'cancelProjection'){
        $(".avatar_projection").css({'display':'none'});
        $("#vod_projection").css({'display':'none'});
        $("#statistics").css({'display':'none'});
        if(isStarted === 0){
            $(".meetingInfo").css({'display':''});
            $("#topicInfo").css({'display':'none'});
        }else{
            $(".meetingInfo").css({'display':'none'});
            $("#topicInfo").css({'display':''});
        }

    }else if(messageType === 'replyProjection'){
        if(data.type === 'avatar'){

            var macId = data.mac;
            var parameters = 'vlc_' + macId;
            var vlc=document.getElementById(parameters);
            var id=vlc.playlist.add(data.url);
            vlc.playlist.playItem(id);

        }
    }
});
