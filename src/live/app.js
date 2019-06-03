import AgoraRTC from 'agora-rtc-sdk';

function getQueryString(item){

    var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)","i"));
    
    return svalue ? svalue[1] : svalue;
}

let appid = '4eb82c5d2492421399c31e056082fcc9';

let channelId = 'qietv-demo-room';

let userId = getQueryString('uid') || null;

var client = AgoraRTC.createClient({mode: 'live', codec: "h264"});

var localStream;

client.init(appid, function () {

    console.log("AgoraRTC client initialized");

    client.join(null, channelId ,userId, function(uid) {

        console.log("User " + uid + " join channel successfully");

        localStream = AgoraRTC.createStream({
            streamID: uid,
            audio: true,
            video: true,
            screen: false}
        );

        localStream.init(function() {
            console.log("getUserMedia successfully");
            localStream.play('agora_local');
          
          }, function (err) {
            console.log("getUserMedia failed", err);
          });

    }, function(err) {

        console.log("Join channel failed", err);

    });

}, function (err) {

    console.log("AgoraRTC client init failed", err);

});

