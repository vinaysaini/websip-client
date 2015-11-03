var userAgent, callSession;
var deviceStatus = false;
var oSipStack, oSipSessionRegister, oSipSessionCall, oSipSessionTransferCall;
ringtone = document.getElementById('ringtone');

setTimeout(function(){ 
    if(!deviceStatus){
        register();
    }
}, 5000);

function showWidget(){
    if(!deviceStatus){
        register();
    }
    $('#callStatus').hide();
    $('#widgetCard').show();
    $('#endButton').hide();
}

function hideWidget(){
    $('#callStatus').hide();
    $('#widgetCard').hide();
}

function register(){
    $.getJSON( "user.json", function( response ) {
        userAgent = response;
        oSipStack = new SIPml.Stack({
            realm: userAgent.realm,
            impi: userAgent.username,
            impu: userAgent.impu,
            password: userAgent.password,
            display_name: userAgent.display_name,
            outbound_proxy_url: userAgent.proxy,
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
}

function dialNum(num){
    if($('#number').val()){
        $('#number').val($('#number').val() + num);
    }else{
        $('#number').focus().val($('#number').val() + num);
        $("#number").parent('.mdl-textfield').removeClass('is-invalid').addClass('is-dirty');
    }             
}

function audioCall(){
    $('#callStatus').hide();
    $('#endButton').show();
    $('#audioButton').hide();
    oSipSessionCall= oSipStack.newSession('call-audio', {
        audio_remote: document.getElementById('audio_remote'),
        events_listener: { events: '*', listener: onSipEventSession }
    });
    var number = $('#number').val();
    oSipSessionCall.call(number);
    if (oSipSessionCall.call(txtPhoneNumber.value) != 0) {
        oSipSessionCall = null;
        txtCallStatus.value = 'Failed to make call';
        $('#endButton').hide();
        $('#audioButton').show();
    }
}

function endCall(){
    $('#endButton').hide();
    $('#audioButton').show();
    //$('#widgetCard').hide();
    stopRingbackTone();
    //oSipSessionCall.hangup();
    $('#callStatus').hide();
    if (oSipSessionCall) {
        txtCallStatus.innerHTML = '<i>Terminating the call...</i>';
        oSipSessionCall.hangup({events_listener: { events: '*', listener: onSipEventSession }});
    }
    oSipSessionCall.hangup({events_listener: { events: '*', listener: onSipEventSession }});
     oSipSessionCall = null;
}

function sipSendDTMF(c){
    if(oSipSessionCall && c){
        if(oSipSessionCall.dtmf(c) == 0){
            try { dtmfTone.play(); } catch(e){ }
        }
    }
}

function startRingTone() {
    console.log("Ringtone----------Rongtone");
    ringtone = document.getElementById('ringtone');
    try { ringtone.play(); }
    catch (e) { }
}

function stopRingTone() {
    try { ringtone.pause(); }
    catch (e) { }
}

function startRingbackTone() {
    try { ringbacktone.play(); }
    catch (e) { }
}

function stopRingbackTone() {
    try { ringbacktone.pause(); }
    catch (e) { }
}

$(function(){
    $('#second').hide();
    $('#audioButton').click(function(){
        $('#first').hide();
        $('#second').show();
        $('#disp1').html($('#number').val());
    });

    $('#endButton').click(function(){
        setTimeout(function(){ 
            $('#first').show();
            $('#second').hide(); 
            $('#disp1').html("");
            $('#txtCallStatus').html("");
        }, 1500);   
        
    });
})