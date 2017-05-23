// All listeners
let self = this;
self._FIREBASE_URL = 'https://radio-moldova.firebaseio.com/';
self.firebase = new Firebase(self._FIREBASE_URL);
self.errors = self.firebase.child('errors');
self.listeners = self.firebase.child('listeners');
self.feedbacks = self.firebase.child('feedbacks');

// Set uninstall URL
chrome.runtime.setUninstallURL('https://radio-moldova.firebaseapp.com/uninstall');

// // Get id when extension is first installed
chrome.runtime.onInstalled.addListener(() => {
	chrome.tabs.create({
		url: 'https://radio-moldova.firebaseapp.com/?action=install'
	})
});

// Listen for updates
chrome.runtime.onUpdateAvailable.addListener(() => {
	return chrome.runtime.reload();
});

chrome.runtime.onInstalled.addListener(details => {
	self.installedNow = details
})

// Default badge color
chrome.browserAction.setBadgeBackgroundColor({
	color: '#337ab7'
});

// get Radio
var video = document.getElementsByTagName('video')[0];
// Manifest info
var info = chrome.runtime.getManifest();

chrome.browserAction.setTitle({
	title: info.name + ' v.' + info.version
});

// Change badge
video.onplay = function () {
	chrome.browserAction.setBadgeText({
		text: 'play'
	});
	if (video.reload) {
		video.load();
		video.reload = false;
		clearTimeout(info.reloadRadio);
	}
};
video.onpause = function () {
	chrome.browserAction.setBadgeText({
		text: 'stop'
	});
	info.reloadRadio = setTimeout(function () {
		video.reload = true;
		chrome.browserAction.setBadgeText({
			text: ''
		});
	}, 30 * 1000)
};