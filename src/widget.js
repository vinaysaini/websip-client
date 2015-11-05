var userAgent, callSession;
var deviceStatus = false;
var oSipStack, oSipSessionRegister, oSipSessionCall, oSipSessionTransferCall;
ringtone = document.getElementById('ringtone');

setTimeout(function(){ 
    if(!deviceStatus){
        Widget.register();
    }
}, 5000);

Widget = {
    showWidget: function() {
        if(!deviceStatus){
            Widget.register();
        }
        $('#callStatus').hide();
        $('#widgetCard').show();
        $('#endButton').hide();
        $('#answerButton').hide();
    },

    hideWidget: function(){
        $('#callStatus').hide();
        $('#widgetCard').hide();
    },

    register: function(){
        $.getJSON( "user.json", function( response ) {
            userAgent = response;
            oSipStack = new SIPml.Stack({
                realm: userAgent.realm,
                impi: userAgent.username,
                impu: userAgent.impu,
                password: userAgent.password,
                display_name: userAgent.display_name,
                outbound_proxy_url: userAgent.proxy,
                enable_media_stream_cache: true,
                enable_rtcweb_breaker: true, 
                events_listener: { events: '*', listener: onSipEventStack },
                enable_early_ims: (window.localStorage ? window.localStorage.getItem('org.doubango.expert.disable_early_ims') != "true" : true), // Must be true unless you're using a real IMS network
                enable_media_stream_cache: (window.localStorage ? window.localStorage.getItem('org.doubango.expert.enable_media_caching') == "true" : true),
                sip_headers: [
                    { name: 'User-Agent', value: 'WebSIP-client' },
                    { name: 'Organization', value: 'Viithiisys Technologies' }
                ]
            });
            oSipStack.start();
        });
    },

    dialNum: function(num){
        if($('#number').val()){
            $('#number').val($('#number').val() + num);
        }else{
            $('#number').focus().val($('#number').val() + num);
            $("#number").parent('.mdl-textfield').removeClass('is-invalid').addClass('is-dirty');
        }             
    },

    audioCall: function(){
        $('#callStatus').hide();
        $('#endButton').show();
        $('#audioButton').hide();
        oSipSessionCall= oSipStack.newSession('call-audio', {
            audio_remote: document.getElementById('audio_remote'),
            events_listener: { events: '*', listener: onSipEventSession }
        });
        var number = $('#number').val();
        oSipSessionCall.call(number);
        if (oSipSessionCall.call(number) != 0) {
            oSipSessionCall = null;
            txtCallStatus.value = 'Failed to make call';
            $('#endButton').hide();
            $('#answerButton').hide();
            $('#audioButton').show();
        }
    },

    endCall: function(){
        $('#endButton').hide();
        $('#answerButton').hide();
        $('#audioButton').show();
        //$('#widgetCard').hide();
        Widget.stopRingTone();
        Widget.stopRingbackTone();
        //oSipSessionCall.hangup();
        $('#callStatus').hide();
        if (oSipSessionCall) {
            txtCallStatus.innerHTML = '<i>Terminating the call...</i>';
            oSipSessionCall.hangup({events_listener: { events: '*', listener: onSipEventSession }});
        }
        oSipSessionCall.hangup({events_listener: { events: '*', listener: onSipEventSession }});
         oSipSessionCall = null;
    },

    incomingCall: function(callerNum){
        $('#callerNum').html(callerNum.getRemoteFriendlyName());
        $('#third').show();
        $('#first').hide(); 
        $('#audioButton').hide();
        $('#endButton').show();
        $('#answerButton').show();
        $('#widgetCard').show();   
    },

    answerCall: function(){
        $('#answerButton').hide();
        Widget.stopRingTone();
        
        //txtCallStatus.innerHTML = '<i>Connecting...</i>';
        if (oSipSessionCall) {
            txtCallStatus1.innerHTML = '<i>Connecting...</i>';
            oSipSessionCall.accept(oConfigCall);
        }
        setTimeout(function(){ 
            txtCallStatus1.innerHTML = '<i>Connected...</i>';
        }, 1000);  
        
    },

    sipSendDTMF: function(c){
        if(oSipSessionCall && c){
            if(oSipSessionCall.dtmf(c) == 0){
                try { dtmfTone.play(); } catch(e){ }
            }
        }
    },

    startRingTone: function() {
        console.log("Ringtone----------Rongtone");
        ringtone = document.getElementById('ringtone');
        try { ringtone.play(); }
        catch (e) { }
    },

    stopRingTone: function() {
        try { ringtone.pause(); }
        catch (e) { }
    },

    startRingbackTone: function() {
        try { ringbacktone.play(); }
        catch (e) { }
    },

    stopRingbackTone: function () {
        try { ringbacktone.pause(); }
        catch (e) { }
    }
}

$(function(){
    $('#second').hide();
    $('#third').hide();
    $('#audioButton').click(function(){
        $('#first').hide();
        $('#second').show();
        $('#disp1').html($('#number').val());
    });

    $('#endButton').click(function(){
        setTimeout(function(){ 
            $('#first').show();
            $('#second').hide(); 
            $('#third').hide();
            $('#disp1').html("");
            $('#txtCallStatus').html("");
        }, 1500);   
        
    });
})