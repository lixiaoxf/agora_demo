import '@/lib/agoraRTM/rtm';
import $ from 'jquery';
import appConfig from '@/config';
import AgoraRTC from 'agora-rtc-sdk';

console.log(AgoraRTM)

function getQueryString(item){

    var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)","i"));
    
    return svalue ? svalue[1] : svalue;
}
function updateQueryString(key, value) {
    var url = location.href;
    var newurl = ''
	var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
	var separator = url.indexOf('?') !== -1 ? "&" : "?";
	if (url.match(re)) {
		newurl = url.replace(re, '$1' + key + "=" + value + '$2');
	}
	else {
		newurl = url + separator + key + "=" + value;
    }
    location.replace(newurl)
}

let appid = appConfig.APPID;
let userid = getQueryString('nickname');

//聊天
let talk = {
    init(){
        this.wrap = $('#talk')
    },
    msg(text,nickname){
        var html = [
            '<div class=talk-card>',
                '<span>'+nickname+' :</span>',
                '<p>'+text+'</p>',
            '</div>'
        ].join('');
        
        this.wrap.append(html)
    }
}
talk.init();

//输入昵称
let nickMode = {
    init(){
        this.wrap = $('.nick-mode')
        this.btn = this.wrap.find('.btn');
        this.nickname = this.wrap.find('input')
        this.initEvts();
    },
    show(cb){
        var curnick = getQueryString('nickname')
        this.nickname.val(curnick)
        this.wrap.removeClass('none');
        this.cb = cb;
    },
    hide(){
        this.wrap.fadeOut()
    },
    initEvts(){
        this.btn.on('click',()=>{
            var nickname = this.nickname.val()
            updateQueryString('nickname',nickname)
            this.cb && this.cb(nickname)
            this.hide();
        })
    }

}



//频道用户
let channelUsers = {
   
    renderUsers(list){
        var html = [];
        list.forEach(item => {
            html.push('<div class=channel-user-item>'+item+'</div>')
        })
        $('#channel-users').html(html.join(''))
    },
    append(user){
        $('#channel-users').append('<div class=channel-user-item id='+user+'>'+user+'</div>')
    },
    remove(user){
        $('#'+user).remove();
    }
}

//rtm
let rtm = {
    init(uid){
        this.appid = appid;
        this.userid = userid;
        if(this.appid && this.userid){
            this.loginRTM(this.userid)
        }
    },
    loginRTM(userid){
        this.rtmClient = AgoraRTM.createInstance(this.appid);

        this.rtmClient.on('ConnectionStateChanged', (newState, reason) => {
            console.log('on connection state changed to ' + newState + ' reason: ' + reason);
        });

        this.logindRTM = this.rtmClient.login({ token: null, uid: userid })
    },
    usechannel(channelid){
        
        this.logindRTM && this.logindRTM.then(()=>{
            this.initChannel(channelid)
        }).catch(error=>{
            console.error('加入频道失败：', error)
        })
    },
    initChannel(channelid){
        let curchannel = this.rtmClient.createChannel(channelid);
        this.channel = curchannel;
        curchannel.on('ChannelMessage', ({text}, senderId) => { // text 为收到的频道消息文本，senderId 为发送方的 User ID
            talk.msg(text,senderId)
        });
        curchannel.join().then(res=>{
            curchannel.getMembers().then(membersList => { // membersList 为获取到的频道成员列表
            /* 获取频道成员列表成功的处理逻辑 */

            channelUsers.renderUsers(membersList)
            }).catch(error => {
            /* 频道消息发送失败的处理逻辑 */
            });
        
            
        }).catch(error => {
            console.error('加入频道失败')
        }); 
        curchannel.on('MemberJoined', memberId => { // memberId 为加入频道的用户 ID
            channelUsers.append(memberId)
        })
        curchannel.on('MemberLeft', memberId => { // memberId 为离开频道的用户 ID
            channelUsers.remove(memberId)
        })
    }

}

//rtc
let rtc = {
    init(){
        this.appid = appid;
        this.userid = userid;
        this.initRTC();
    },
    initRTC(){
        var _this = this;
        
        this.client = AgoraRTC.createClient({mode: 'live', codec: "h264"});

        this.client.init(this.appid, function () {

            console.log("AgoraRTC client initialized"); 

        }, function (err) {

            console.log("AgoraRTC client init failed", err);

        });

        this.client.on('stream-subscribed', function (evt) {

            var remoteStream = evt.stream;
        
            $('.live').append('<div class="live-card" id=remote_'+remoteStream.getId()+'></div>');
        
            remoteStream.play('remote_' + remoteStream.getId());
            
        })

        this.client.on('stream-added', function (evt) {
            var stream = evt.stream;
            console.log("New stream added: " + stream.getId());

            _this.client.subscribe(stream, function (err) {
                console.log("Subscribe stream failed", err);
            });
        });

        this.client.on('stream-removed', function (evt) {
            var stream = evt.stream;
            stream.stop();
            $('#remote_' + stream.getId()).remove();
            console.log("Remote stream is removed " + stream.getId());
        });

        this.client.on('peer-leave', function (evt) {
            var stream = evt.stream;
            if (stream) {
            stream.stop();
            $('#remote_' + stream.getId()).remove();
            console.log(evt.uid + " leaved from this channel");
            }
        });
    },
    joinChannel(channelId){
        this.channelId = channelId;

        this.client.join(null, channelId ,this.userid, function(uid) {
            
    
        }, function(err) {
    
            console.log("Join channel failed", err);
    
        });
    },
    leave(){
        this.client.unpublish(this.localStream);
        this.localStream.close();
        $('#local-video').addClass('none').html('');
    },
    publish(){
        var _this = this;
        this.localStream = AgoraRTC.createStream({
            streamID: this.userid,
            audio: true,
            video: true,
            screen: false}
        );
        this.localStream.init(function() {
            $('#local-video').removeClass('none').html('');
            _this.localStream.play('local-video');

            _this.client.publish(_this.localStream, function (err) {
                console.log("Publish local stream error: " + err);
            });
    
            _this.client.on('stream-published', function (evt) {
                console.log("Publish local stream successfully");
            });
          
          }, function (err) {
            console.log("getUserMedia failed", err);
          });
    }

}

//app
let app = {
    init(){
        this.curUser = getQueryString('nickname')
        if(!this.curUser ){
            nickMode.show(function(nickname){
                rtm.init(nickname);
            });
        }
        
        this.initDoms();
        this.initEvts();
        rtm.init();
        rtc.init();
    },
    
    initDoms(){
        this.wrap = $('#app');
        this.sendBtn = this.wrap.find('.send-msg .btn');
        this.sendMsg = this.wrap.find('.send-msg .send-text')
        this.channelBtn = $('#channels .btn');
        this.channelInput = $('#channels input');
        this.operateUp = $(".operate .up")
        this.operateDown = $(".operate .down")
    },
    nickmode(){

    },
    initEvts(){
        this.sendBtn.on('click',()=>{
            let msg = this.sendMsg.text()
            rtm.channel.sendMessage({text:msg}).then(() => {
                talk.msg(msg,this.curUser )
               }).catch(error => {
                 console.log('发送信息失败')
               });
        })
        this.channelBtn.on('click',()=>{
            var channelNum = this.channelInput.val();
            rtm.usechannel(channelNum)
            rtc.joinChannel(channelNum)
        })
        this.operateUp.on('click',function(){
            rtc.publish();
        })
        this.operateDown.on('click',function(){
            rtc.leave();
        })
    }
}
nickMode.init();
app.init()


















