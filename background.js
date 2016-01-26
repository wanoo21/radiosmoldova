// All listeners
var firebase = new Firebase('https://radio-moldova.firebaseio.com/');
self.runtime = firebase.child('runtime');
self.errors = firebase.child('errors');
self.listeners = firebase.child('listeners');


// Listen for errors
self.onerror = function(err){
    return self.errors.push(err)
};

// Get id when extension is first installed
chrome.runtime.onStartup.addListener(function() {
    self.runtime.push({ action: 'installed', date: Firebase.ServerValue.TIMESTAMP })
});

// Listen on suspend 
chrome.runtime.onSuspend.addListener(function(){
    // Remove listen from data
    if(self.currentRadio)
        self.listeners.child(self.radioKeys[self.currentRadio.nameId]).update({ listeners: self.currentRadio.listeners > 0 ? self.currentRadio.listeners -= 1 : 0 }, function(err) {
            if(err) errors.push(err);
        });
    self.runtime.push({ action: 'suspended', dateAt: Firebase.ServerValue.TIMESTAMP })
});

// Listen for updates
chrome.runtime.onUpdateAvailable.addListener(function() {
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
    //self.startedAt = Date.now();
	if(video.reload) {
		video.load();
		video.reload = false;
		clearTimeout(info.reloadRadio);
	}
};
video.onpause = function() {
	chrome.browserAction.setBadgeText({ text: 'stop' });
    //self.endAt = Date.now();
	return info.reloadRadio = setTimeout(function(){
		video.reload = true;
        chrome.browserAction.setBadgeText({ text: '' });
	}, 30 * 1000)
};
video.onload = function() {
	chrome.browserAction.setBadgeText({ text: '...' })
};