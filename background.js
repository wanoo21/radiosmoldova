// All listeners
var firebase = new Firebase('https://radio-moldova.firebaseio.com/'),
    runtime = firebase.child('runtime'),
    errors = firebase.child('errors'),
    listeners = firebase.child('listeners');


// Get id when extension is installed, updated, and chrome is updated
chrome.runtime.onInstalled.addListener(function(details) {
	// TODO
    runtime.push({ action: 'installed', date: Firebase.ServerValue.TIMESTAMP })
});

// Listen on suspend 
chrome.runtime.onSuspend.addListener(function(){
	// TODO
    runtime.push({ action: 'suspended', date: Firebase.ServerValue.TIMESTAMP })
});

// Listen for updates
chrome.runtime.onUpdateAvailable.addListener(function(manifest) {
    listeners.child(radioKeys[currentRadio.nameId]).update({ listeners: currentRadio.listeners > 0 ? currentRadio.listeners -= 1 : 0 }, function(err) {
        if(err) errors.push(err);
    });
	// Return auto update
	return chrome.runtime.reload();
});

// Default badge color
chrome.browserAction.setBadgeBackgroundColor({ color: '#337ab7' });

// get Radio
var video = document.getElementsByTagName('video')[0];
// Manifest info
var info = chrome.runtime.getManifest();

chrome.browserAction.setTitle({ title: info.name + ' v.' + info.version });

// Change badge 
video.onplay = function() {
	chrome.browserAction.setBadgeText({ text: 'play' });
	if(video.reload) {
		video.load();
		video.reload = false;
		clearTimeout(info.reloadRadio);
	}
};
video.onpause = function() {
	chrome.browserAction.setBadgeText({ text: 'stop' });
	return info.reloadRadio = setTimeout(function(){
		video.reload = true;
	}, 30 * 1000)
};
video.onload = function() {
	chrome.browserAction.setBadgeText({ text: '...' })
};