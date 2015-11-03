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

var hightChart; //柱状图控件
var showData = [];//柱状图控件的加载数据
var isShowVoteResults = 0;//控制是否大屏幕显示投票信息
var isStarted = 0;//会议中的状态0：未开始，1：会议开始但议题未进行，2:会议开始议题进行中
var timer = 0;//控制定时显示video的定时器

var arrived = 0;
var no_arrived = 0;
var deviceCounts = 0;


var options = {
    colors: ["#2b908f", "#90ee7e", "#f45b5b", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee",
        "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
    chart: {
        renderTo: 'container',
        type: 'column',
        backgroundColor: {
            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
            stops: [
                [0, '#2a2a2b'],
                [1, '#3e3e40']
            ]
        },
        style: {
            fontFamily: "'Unica One', sans-serif"
        },
        plotBorderColor: '#606063'
    },
    title: {
             text: '',
             //style:{ "color": "#0000cc", "fontSize": "38px" , "fontWeight":'bold'}
            style: {
                color: '#E0E0E3',
                textTransform: 'uppercase',
                fontSize: '38px'
            }
    },
    series: [{

            data:[],
            dataLabels: {
                enabled: true,
                rotation: 0,
                color: '#B0B0B3',
                align: 'center',
                format: '{y} 票',
                y: 6, // 10 pixels down from the top
                style: {
                    fontSize: '53px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
    }],
    xAxis: {
            type: 'category',
            gridLineColor: '#707073',
            labels: {
                rotation: 0,
                style: {
                    fontSize: '33px',
                    fontFamily: 'Verdana, sans-serif',
                    fontWeight:'bold',
                    color: '#E0E0E3'
                }
            },
            lineColor: '#707073',
            minorGridLineColor: '#505053',
            tickColor: '#707073',
            title: {
                style: {
                    color: '#A0A0A3'

                }
            }
    },
    yAxis: {
            gridLineColor: '#707073',
            labels: {
                style: {
                    color: '#E0E0E3'
                }
            },
            lineColor: '#707073',
            minorGridLineColor: '#505053',
            tickColor: '#707073',
            tickWidth: 1,
            min: 0,
            title: {
                text: '票数',
                style: {
                    color: '#A0A0A3'
                }
            }
     },
     legend: {
            enabled: false
     }

};

$(function(){               // equal $(document).ready(function(){})

    var ip = $("#ip").text();

    //socket.io
    var serverUrl = 'http://' + ip + ':6688';
    var socket = io.connect(serverUrl);

    socket.send('{ "cmd":"logon","parameters":{"mac":"WEB-SCREEN"} }');

    socket.on('message', function(msg){

        var jsonObj;
        try {
            jsonObj = JSON.parse(msg);
        }catch (err){
            return false;
        }

        var messageType = jsonObj.cmd;
        if(messageType === 'logon'){

            var data = jsonObj.content;

            var statusObj = data.status;
            var main = statusObj.mainStatus;
            var sec = statusObj.topicStatus;

            if(main < 3 ){

                isStarted = 0;//checkin
            }else{
                if(sec === 0){
                    isStarted = 1;//meeting has already started, but topic no.
                }else{
                    isStarted = 2;//topic is ing.
                }
            }
        }else if(messageType === 'checkin'){

            $("#overInfo").css({'display':'none'});
            $("#noMeeting").css({'display':'none'});
            $("#topicInfo").css({'display':'none'});
            $("#meetingInfo").css({'display':''});

            var data = jsonObj.parameters;
            var styleJsonObj = data.forWebScreen;

            var ip = $("#ip").text();
            var logoUrl = 'http://' + ip + ':8080';
            if(styleJsonObj['name'] === undefined && styleJsonObj['arrived'] === undefined){
                alert('后台服务器出错，请尝试刷新界面...');
                return;
            }

            $("#meetingInfo > h1").text(styleJsonObj['name']);
            $("body").css(styleJsonObj['screen_bg']);
            var imgUrl = logoUrl + styleJsonObj['log_src']['src'];
            styleJsonObj['log_src']['src'] = imgUrl;
            $("#meetingLogo").attr(styleJsonObj['log_src']);

            $(".header-bg").css(styleJsonObj['logo_pos']);

            $("#meetingInfo > h1").css(styleJsonObj['meeting_title']);

            $("#checkinInfo > p").css(styleJsonObj['meeting_info']);
            $("#topicInfo > p").css(styleJsonObj['meeting_info']);

            $("#arrived").text(styleJsonObj['arrived']);
            $("#no_arrived").text(styleJsonObj['notArrived']);


        }else if(messageType === 'updateCheckin'){
            var data = jsonObj.parameters;

            if(isStarted === 0){
                $("#noMeeting").css({'display':'none'});
                $("#checkinInfo").css({'display':''});
                arrived = data.arrived;
                no_arrived = data.notArrived;

                $("#arrived").text(arrived);
                $("#no_arrived").text(no_arrived);
            }

        }else if(messageType === 'startMeeting'){
            $("#checkinInfo").css({'display':'none'});
            $(".avatar_projection").css({'display':'none'});
            $("#syncOfficeToWeb").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#statistics").css({'display':'none'});
            $("#topicInfo").css({'display':''});
            isStarted = 1;
            $("#topicInfo > p").text('会议已开始，但议题未进行');

        }else if(messageType === 'changeTopic'){

            var data = jsonObj.parameters;

            isStarted = 2;
            $("#checkinInfo").css({'display':'none'});
            $(".avatar_projection").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#statistics").css({'display':'none'});
            $("#syncOfficeToWeb").css({'display':'none'});
            $("#meetingInfo").css({'display':''});
            $("#topicInfo").css({'display':''});

            var topicName = data.content;
            topicName = '议题: ' + topicName;

            $("#topicInfo > p").text(topicName);

        }else if(messageType === 'startVote'){

            var data = jsonObj.parameters;
            $("#checkinInfo").css({'display':'none'});
            $(".avatar_projection").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#statistics").css({'display':'none'});
            $("#syncOfficeToWeb").css({'display':'none'});
            $("#meetingInfo").css({'display':''});
            $("#topicInfo").css({'display':''});
            isShowVoteResults = 0;

            showData = [];

            var topicName = data.content;
            var voteObject = data.voteObject;
            var voteType = data.type;
            var tmpArrary = [];
            for(x in voteObject){
                tmpArrary.push([x,0]);//'0票'
            }

            options.title['text'] = topicName;

            options.series[0].data = tmpArrary;
            showData = tmpArrary;
            hightChart = new Highcharts.Chart(options);

        }else if(messageType === 'voteResult'){

            var data = jsonObj.parameters;

            var results = data.optionValues;
            showData = [];
            for(x in results){
                var values = results[x] ;//+ '票'
                var ele = [x,values];
                showData.push(ele);
            }

            options.series[0].data = showData;
            var series = hightChart.series[0];
            series.setData(showData, true, true);
            if(isShowVoteResults === 1){
                $("#checkinInfo").css({'display':'none'});
                $(".avatar_projection").css({'display':'none'});
                $("#vod_projection").css({'display':'none'});
                $("#topicInfo").css({'display':'none'});
                $("#syncOfficeToWeb").css({'display':'none'});
                $("#statistics").css({'display':''});
            }

        }else if(messageType === 'votingEnded'){
            $("#meetingInfo").css({'display':''});
            $("#checkinInfo").css({'display':'none'});
            $("#topicInfo").css({'display':''});
            $(".avatar_projection").css({'display':'none'});
            $("#syncOfficeToWeb").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#statistics").css({'display':'none'});

        }else if(messageType === 'meetingOver'){
            $(".avatar_projection").css({'display':'none'});
            $("#syncOfficeToWeb").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#statistics").css({'display':'none'});
            $("#meetingInfo").css({'display':'none'});
            $("#overInfo").css({'display':''});
            isStarted = 0;
            isShowVoteResults = 0;
            //socket.disconnect();

        }else if(messageType === 'projection'){

            $("#meetingInfo").css({'display':'none'});
            var data = jsonObj.parameters;
            if(data.type === 'playVideo'){
                $(".avatar_projection").css({'display':'none'});
                $("#statistics").css({'display':'none'});//control statistics display
                $("#syncOfficeToWeb").css({'display':'none'});
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
                $("#syncOfficeToWeb").css({'display':'none'});
                //$(".header-bg").css({'display':'none'});
                $(".avatar_projection").css({'display':''});
                $(".avatar_projection").empty();
                $(".avatar_projection").removeAttr("style");

                var macArrary = data.clientId;

                deviceCounts = macArrary.length;
                for(x in macArrary){
                    if(deviceCounts === 1){
                        var html = '';
                        html ='<div style="width:100%;height:99%;position:absolute;top:0;left:0"';
                        //html += "><div id='loadingfullscreen'";
                        html += '><p id="loadingfullscreen" style="margin:0 auto;color: #3399ff;font-size: 40px;font-weight:bold  ;position:relative; top:50%; "';//#
                        html += ">Loading....</p>";
                        html += '<embed style="width:3px; height:3px;border: 1px solid rgb(206, 179, 179);" toolbar="false" autostart="true" type="application/x-vlc-plugin" pluginspage="http://www.videolan.org"';
                        html += 'version="VideoLAN.VLCPlugin.2" id="vlc_' +  macArrary[x] + '"';
                        html += ">";
                        html += '</embed>';
                        html += "</div>";
                        //append client avatar
                        $(".avatar_projection").append(html);


                    }else{
                        var html = '';
                        html ='<div class="video" ';//text-align:center
                        html += 'style="display: inline-block; opacity: 1; margin:3px;"';
                        html += "><div class='loading'";
                        //html += '><img src="images/loading.png"';
                        html += '><p style="margin:0 auto;color: #3399ff;font-size: 40px;font-weight:bold  ;position:relative; top:50%; "';//#
                        html += ">Loading...</p></div>";
                        html += '<embed style="width:3px;height:3px;border: 1px solid rgb(206, 179, 179);" toolbar="false" autostart="true" type="application/x-vlc-plugin" pluginspage="http://www.videolan.org"';
                        html += 'version="VideoLAN.VLCPlugin.2" id="vlc_' +  macArrary[x] + '"';
                        html += ">";
                        html += '</embed></div>';
                        //append client avatar
                        $(".avatar_projection").append(html);
                    }
                }

                if(deviceCounts !== 1){
                    var embeds = $.find(".loading");
                    var embedLength = embeds.length;
                    var documentWidth = $(document).width();
                    var documentHeight = $(document).height();
                    var contentWidth = documentWidth - documentWidth*0.1;
                    var contentHeight = documentHeight - documentHeight*0.1;

                    if(embedLength < 4){
                        embedLength = embedLength%4;
                        var embedWidth = contentWidth/embedLength;
                        var embedHeight = embedWidth*0.75;
                        for(var i=0;i<embedLength;i++){
                            $(embeds[i]).css("width", embedWidth);
                            $(embeds[i]).css("height", embedHeight);
                        }
                    }else if(embedLength === 4){

                        var embedHeight = contentHeight/2 ;
                        var embedWidth = contentWidth/2;
                        for(var i=0;i<embedLength;i++){
                            $(embeds[i]).css("width", embedWidth);
                            $(embeds[i]).css("height", embedHeight);

                        }
                    }else if(embedLength === 5){
                        var embedHeight = contentHeight/2 ;
                        var embedWidth1 = contentWidth/3;
                        var embedWidth2 = embedWidth1*3 / 2;
                        for(var i=0;i<embedLength;i++){
                            if(i<=2){
                                $(embeds[i]).css("width", embedWidth1);
                            }else if(i>2){
                                $(embeds[i]).css("width", embedWidth2);
                            }

                            $(embeds[i]).css("height", embedHeight);

                        }
                    }else if(embedLength === 6){

                        var embedHeight = contentHeight/2 ;
                        var embedWidth = contentWidth/3;

                        for(var i=0;i<embedLength;i++){
                            $(embeds[i]).css("width", embedWidth);
                            $(embeds[i]).css("height", embedHeight);

                        }
                    }
                    else if(embedLength === 7){

                        var embedHeight = contentHeight/2 ;
                        var embedWidth1 = contentWidth/4 ;
                        var embedWidth2 = embedWidth1*4/3;

                        for(var i=0;i<embedLength;i++){
                            if(i <=3){
                                $(embeds[i]).css("width", embedWidth1);
                            }else {
                                $(embeds[i]).css("width", embedWidth2);
                            }

                            $(embeds[i]).css("height", embedHeight);

                        }
                    }else if(embedLength === 8){

                        var embedHeight = contentHeight/2 ;
                        var embedWidth = contentWidth/4;

                        for(var i=0;i<embedLength;i++){
                            $(embeds[i]).css("width", embedWidth);
                            $(embeds[i]).css("height", embedHeight);

                        }
                    }else if(embedLength === 9){

                        var embedHeight = contentHeight/3;
                        var embedWidth = contentWidth/3;

                        for(var i=0;i<embedLength;i++){
                            $(embeds[i]).css("width", embedWidth);
                            $(embeds[i]).css("height", embedHeight);

                        }
                    }

                }

            }else if(data.type === 'voteResult'){

                isShowVoteResults = 1;

                $(".avatar_projection").css({'display':'none'});
                $("#syncOfficeToWeb").css({'display':'none'});
                $("#vod_projection").css({'display':'none'});
                $("#statistics").css({'display':''});

                options.series[0].data = showData;

                hightChart = new Highcharts.Chart(options);

            }else if(data.type === 'syncOfficeToWeb'){

                var imgUrl = data.imgUrl;

                $("#syncOfficeToWeb").attr({ src: imgUrl });//, alt: "Test Image"
                $("#syncOfficeToWeb").css({'display':''});
            }
        }else if(messageType === 'cancelProjection'){
            $(".avatar_projection").css({'display':'none'});
            $("#vod_projection").css({'display':'none'});
            $("#statistics").css({'display':'none'});
            $("#syncOfficeToWeb").css({'display':'none'});
            //$(".header-bg").css({'display':''});
            $("#meetingInfo").css({'display':''});
            window.clearInterval(timer); //清楚定时器
            if(isStarted === 0){
                $("#checkinInfo").css({'display':''});
                $("#topicInfo").css({'display':'none'});
            }else if(isStarted === 1){
                $("#checkinInfo").css({'display':'none'});
                $("#topicInfo").css({'display':''});
                $("#topicInfo > p").text('会议已开始，但议题未进行');
            }else{
                $("#checkinInfo").css({'display':'none'});
                $("#topicInfo").css({'display':''});
            }

        }else if(messageType === 'replyProjection'){

            var data = jsonObj.parameters;
            if(data.type === 'avatar'){

                var macId = data.mac;
                var parameters = 'vlc_' + macId;
                var vlc=document.getElementById(parameters);
                var id=vlc.playlist.add(data.url);
                vlc.playlist.playItem(id);

                showVideo();
            }
        }

    });

});

function showVideo(){
    timer = setTimeout(function(){
        if(deviceCounts !== 1){

                $(".loading").css({'display':'none'});

                var embeds = $.find("embed");
                var embedLength = embeds.length;
                var documentWidth = $(document).width();
                var documentHeight = $(document).height();
                var contentWidth = documentWidth - documentWidth*0.1;
                var contentHeight = documentHeight - documentHeight*0.1;

                if(embedLength < 4){
                    embedLength = embedLength%4;
                    var embedWidth = contentWidth/embedLength;
                    var embedHeight = embedWidth*0.75;
                    for(var i=0;i<embedLength;i++){
                        $(embeds[i]).css("width", embedWidth);
                        $(embeds[i]).css("height", embedHeight);
                    }
                }else if(embedLength === 4){

                    var embedHeight = contentHeight/2 ;
                    var embedWidth = contentWidth/2;
                    for(var i=0;i<embedLength;i++){
                        $(embeds[i]).css("width", embedWidth);
                        $(embeds[i]).css("height", embedHeight);

                    }
                }else if(embedLength === 5){
                    var embedHeight = contentHeight/2 ;
                    var embedWidth1 = contentWidth/3;
                    var embedWidth2 = embedWidth1*3 / 2;
                    for(var i=0;i<embedLength;i++){
                        if(i<=2){
                            $(embeds[i]).css("width", embedWidth1);
                        }else if(i>2){
                            $(embeds[i]).css("width", embedWidth2);
                        }

                        $(embeds[i]).css("height", embedHeight);

                    }
                }else if(embedLength === 6){

                    var embedHeight = contentHeight/2 ;
                    var embedWidth = contentWidth/3;

                    for(var i=0;i<embedLength;i++){
                        $(embeds[i]).css("width", embedWidth);
                        $(embeds[i]).css("height", embedHeight);

                    }
                }
                else if(embedLength === 7){

                    var embedHeight = contentHeight/2 ;
                    var embedWidth1 = contentWidth/4 ;
                    var embedWidth2 = embedWidth1*4/3;

                    for(var i=0;i<embedLength;i++){
                        if(i <=3){
                            $(embeds[i]).css("width", embedWidth1);
                        }else {
                            $(embeds[i]).css("width", embedWidth2);
                        }

                        $(embeds[i]).css("height", embedHeight);

                    }
                }else if(embedLength === 8){

                    var embedHeight = contentHeight/2 ;
                    var embedWidth = contentWidth/4;

                    for(var i=0;i<embedLength;i++){
                        $(embeds[i]).css("width", embedWidth);
                        $(embeds[i]).css("height", embedHeight);

                    }
                }else if(embedLength === 9){

                    var embedHeight = contentHeight/3;
                    var embedWidth = contentWidth/3;

                    for(var i=0;i<embedLength;i++){
                        $(embeds[i]).css("width", embedWidth);
                        $(embeds[i]).css("height", embedHeight);

                    }
                }

            }else{
                $("#loadingfullscreen").css({'display':'none'});
                $(".avatar_projection").css({width:"100%",height:"99%",position: "absolute",top: "0",left: "0"});
                $("embed").css("width", "100%");
                $("embed").css("height", "100%");
        }
    }, 10000);
}


