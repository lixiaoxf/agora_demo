import AgoraRTC from 'agora-rtc-sdk';
import $ from 'jquery';

function getQueryString(item){

    var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)","i"));
    
    return svalue ? svalue[1] : svalue;
}

let appid = '4eb82c5d2492421399c31e056082fcc9';

let channelId = 'qietv-demo-room';

let userId = getQueryString('uid') || null;

let total = 0;

var client = AgoraRTC.createClient({mode: 'live', codec: "h264"});

var localStream;

let initialized = false;

client.init(appid, function () {

    console.log("AgoraRTC client initialized");

    initialized = true;

}, function (err) {

    console.log("AgoraRTC client init failed", err);

});

client.on('stream-added', function (evt) {
    var stream = evt.stream;
    console.log("New stream added: " + stream.getId());

    client.subscribe(stream, function (err) {
        console.log("Subscribe stream failed", err);
    });
});
client.on('stream-subscribed', function (evt) {
    var remoteStream = evt.stream;

    $('.videos').append('<div class="video-card" id=remote_'+remoteStream.getId()+'></div>');

    remoteStream.play('remote_' + remoteStream.getId());
    
})

client.on('stream-removed', function (evt) {
    var stream = evt.stream;
    stream.stop();
    $('#remote_' + stream.getId()).remove();
    console.log("Remote stream is removed " + stream.getId());
});

client.on('peer-leave', function (evt) {
    var stream = evt.stream;
    if (stream) {
      stream.stop();
      $('#remote_' + stream.getId()).remove();
      console.log(evt.uid + " leaved from this channel");
    }
});

$('.app .add-channel').on('click',function(){
    if(!initialized){
        return ;
    }
    $(".channel-wrap").hide();
    client.join(null, channelId ,userId, function(uid) {

        localStream = AgoraRTC.createStream({
            streamID: uid,
            audio: true,
            video: true,
            screen: false}
        );
        
        // // The user has granted access to the camera and mic.
        // localStream.on("accessAllowed", function() {
        //     console.log("accessAllowed");
        //   });
  
        // // The user has denied access to the camera and mic.
        // localStream.on("accessDenied", function() {
        // console.log("accessDenied");
        // });

        localStream.init(function() {
            localStream.play('local-video');

            client.publish(localStream, function (err) {
                console.log("Publish local stream error: " + err);
            });
    
            client.on('stream-published', function (evt) {
                console.log("Publish local stream successfully");
            });
          
          }, function (err) {
            console.log("getUserMedia failed", err);
          });

    }, function(err) {

        console.log("Join channel failed", err);

    });
})