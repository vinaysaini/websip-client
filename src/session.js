var oConfigCall = {
    audio_remote: document.getElementById("audio_remote"),
    bandwidth: { audio:undefined, video:undefined },
    events_listener: { events: '*', listener: onSipEventSession },
    sip_caps: [
                    { name: '+g.oma.sip-im' },
                    { name: 'language', value: '\"en,fr\"' }
                ]
};

// Callback function for SIP Stacks
function onSipEventStack(e /*SIPml.Stack.Event*/) {
    tsk_utils_log_info('==stack event = ' + e.type);
    switch (e.type) {
        case 'started':
            {
                // catch exception for IE (DOM not ready)
                try {
                    // LogIn (REGISTER) as soon as the stack finish starting
                    oSipSessionRegister = this.newSession('register', {
                        expires: 200,
                        events_listener: { events: '*', listener: onSipEventSession },
                        sip_caps: [
                                    { name: '+g.oma.sip-im', value: null },
                                    //{ name: '+sip.ice' }, // rfc5768: FIXME doesn't work with Polycom TelePresence
                                    { name: '+audio', value: null },
                                    { name: 'language', value: '\"en,fr\"' }
                            ]
                    });
                    oSipSessionRegister.register();
                }
                catch (e) {
                   // btnRegister.disabled = false;
                   deviceStatus = true;
                }
                break;
            }
        case 'stopping': case 'stopped': case 'failed_to_start': case 'failed_to_stop':
            {
                var bFailure = (e.type == 'failed_to_start') || (e.type == 'failed_to_stop');
                oSipStack = null;
                oSipSessionRegister = null;
                oSipSessionCall = null;

                stopRingbackTone();
                stopRingTone();
                oSipSessionCall = null;
                break;
            }

        case 'i_new_call':
            {
                if (oSipSessionCall) {
                    console.log("----------==============================----------------");
                    console.log(oSipSessionCall);
                    // do not accept the incoming call if we're already 'in call'
                    e.newSession.hangup(); // comment this line for multi-line support
                }
                else {
                    oSipSessionCall = e.newSession;
                    // start listening for events

                    oSipSessionCall.setConfiguration(oConfigCall);
                    startRingTone();
                    console.log("----------==============================----------------");
                    console.log(oSipSessionCall);
                    console.log("----------==============================----------------");
                    var sRemoteNumber = (oSipSessionCall.getRemoteFriendlyName() || 'unknown');
                    
                    
                }
                break;
            }

        case 'm_permission_requested':
            {
                break;
            }
        case 'm_permission_accepted':
        case 'm_permission_refused':
            {
                if(e.type == 'm_permission_refused'){
                    uiCallTerminated('Media stream permission denied');
                }
                break;
            }

        case 'starting': default: break;
    }
}

// Callback function for SIP sessions (INVITE, REGISTER, MESSAGE...)
function onSipEventSession(e /* SIPml.Session.Event */) {
    tsk_utils_log_info('==session event = ' + e.type);

    switch (e.type) {
        case 'connecting': case 'connected':
            {
                var bConnected = (e.type == 'connected');
                if (e.session == oSipSessionRegister) {
                    txtRegStatus.innerHTML = "<i>" + e.description + "</i>";
                    deviceStatus = true;
                }
                else if (e.session == oSipSessionCall) {
                    if (bConnected) {
                        stopRingbackTone();
                        stopRingTone();
                        oSipSessionCall = null;

                        if (oNotifICall) {
                            oNotifICall.cancel();
                            oNotifICall = null;
                        }
                    }
                    txtCallStatus.innerHTML = "<i>" + e.description + "</i>";
                    divCallOptions.style.opacity = bConnected ? 1 : 0;
                }
                break;
            } // 'connecting' | 'connected'
        case 'terminating': case 'terminated':
            {
                if (e.session == oSipSessionRegister) {
                    oSipSessionCall = null;
                    oSipSessionRegister = null;
                    txtRegStatus.innerHTML = "<i>" + e.description + "</i>";
                }else if (e.session == oSipSessionCall) {
                        $('#txtCallStatus').html("Call Failed..");
                        setTimeout(function(){ 
                            stopRingbackTone();
                            stopRingTone();
                            oSipSessionCall = null;
                            $('#endButton').hide();
                            $('#audioButton').show();
                            $('#first').show();
                            $('#second').hide(); 
                            $('#disp1').html("");
                            $('#txtCallStatus').html("");
                    }, 3000);
                }
                break;
            } // 'terminating' | 'terminated'

        
        case 'm_stream_audio_local_added':
        case 'm_stream_audio_local_removed':
        case 'm_stream_audio_remote_added':
        case 'm_stream_audio_remote_removed':
            {
                break;
            }

        case 'i_ect_new_call':
            {
                oSipSessionTransferCall = e.session;
                break;
            }

        case 'i_ao_request':
            {
                if(e.session == oSipSessionCall){
                    var iSipResponseCode = e.getSipResponseCode();
                    if (iSipResponseCode == 180 || iSipResponseCode == 183) {
                        startRingbackTone();
                        txtCallStatus.innerHTML = '<i>Remote ringing...</i>';
                    }
                }
                break;
            }

        case 'm_early_media':
            {
                if(e.session == oSipSessionCall){
                    stopRingbackTone();
                    stopRingTone();
                    oSipSessionCall = null;
                    txtCallStatus.innerHTML = '<i>Early media started</i>';
                }
                break;
            }

        case 'm_local_hold_ok':
            {
                if(e.session == oSipSessionCall){
                    if (oSipSessionCall.bTransfering) {
                        oSipSessionCall.bTransfering = false;
                        // this.AVSession.TransferCall(this.transferUri);
                    }
                    btnHoldResume.value = 'Resume';
                    btnHoldResume.disabled = false;
                    txtCallStatus.innerHTML = '<i>Call placed on hold</i>';
                    oSipSessionCall.bHeld = true;
                }
                break;
            }
        case 'm_local_hold_nok':
            {
                if(e.session == oSipSessionCall){
                    oSipSessionCall.bTransfering = false;
                    btnHoldResume.value = 'Hold';
                    btnHoldResume.disabled = false;
                    txtCallStatus.innerHTML = '<i>Failed to place remote party on hold</i>';
                }
                break;
            }
        case 'm_local_resume_ok':
            {
                if(e.session == oSipSessionCall){
                    oSipSessionCall.bTransfering = false;
                    btnHoldResume.value = 'Hold';
                    btnHoldResume.disabled = false;
                    txtCallStatus.innerHTML = '<i>Call taken off hold</i>';
                    oSipSessionCall.bHeld = false;

                    if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback yet
                        uiVideoDisplayEvent(false, true);
                        uiVideoDisplayEvent(true, true);
                    }
                }
                break;
            }
        case 'm_local_resume_nok':
            {
                if(e.session == oSipSessionCall){
                    oSipSessionCall.bTransfering = false;
                    btnHoldResume.disabled = false;
                    txtCallStatus.innerHTML = '<i>Failed to unhold call</i>';
                }
                break;
            }
        case 'm_remote_hold':
            {
                if(e.session == oSipSessionCall){
                    txtCallStatus.innerHTML = '<i>Placed on hold by remote party</i>';
                }
                break;
            }
        case 'm_remote_resume':
            {
                if(e.session == oSipSessionCall){
                    txtCallStatus.innerHTML = '<i>Taken off hold by remote party</i>';
                }
                break;
            }
        case 'm_bfcp_info':
            {
                if(e.session == oSipSessionCall){
                    txtCallStatus.innerHTML = 'BFCP Info: <i>'+ e.description +'</i>';
                }
                break;
            }

        case 'o_ect_trying':
            {
                if(e.session == oSipSessionCall){
                    txtCallStatus.innerHTML = '<i>Call transfer in progress...</i>';
                }
                break;
            }
        case 'o_ect_accepted':
            {
                if(e.session == oSipSessionCall){
                    txtCallStatus.innerHTML = '<i>Call transfer accepted</i>';
                }
                break;
            }
        case 'o_ect_completed':
        case 'i_ect_completed':
            {
                if(e.session == oSipSessionCall){
                    txtCallStatus.innerHTML = '<i>Call transfer completed</i>';
                    btnTransfer.disabled = false;
                    if (oSipSessionTransferCall) {
                        oSipSessionCall = oSipSessionTransferCall;
                    }
                    oSipSessionTransferCall = null;
                }
                break;
            }
        case 'o_ect_failed':
        case 'i_ect_failed':
            {
                if(e.session == oSipSessionCall){
                    txtCallStatus.innerHTML = '<i>Call transfer failed</i>';
                    btnTransfer.disabled = false;
                }
                break;
            }
        case 'o_ect_notify':
        case 'i_ect_notify':
            {
                if(e.session == oSipSessionCall){
                    txtCallStatus.innerHTML = "<i>Call Transfer: <b>" + e.getSipResponseCode() + " " + e.description + "</b></i>";
                    if (e.getSipResponseCode() >= 300) {
                        if (oSipSessionCall.bHeld) {
                            oSipSessionCall.resume();
                        }
                        btnTransfer.disabled = false;
                    }
                }
                break;
            }
        case 'i_ect_requested':
            {
                if(e.session == oSipSessionCall){                        
                    var s_message = "Do you accept call transfer to [" + e.getTransferDestinationFriendlyName() + "]?";//FIXME
                    if (confirm(s_message)) {
                        txtCallStatus.innerHTML = "<i>Call transfer in progress...</i>";
                        oSipSessionCall.acceptTransfer();
                        break;
                    }
                    oSipSessionCall.rejectTransfer();
                }
                break;
            }
    }
}
