// All listeners
// let self = this;
// self._FIREBASE_URL = 'https://radio-moldova.firebaseio.com/';
// self.firebase = new Firebase(self._FIREBASE_URL);
// self.errors = self.firebase.child('errors');
// self.listeners = self.firebase.child('listeners');
// self.feedbacks = self.firebase.child('feedbacks');

// Set uninstall URL
// chrome.runtime.setUninstallURL('https://r.wlocalhost.org/uninstall');

// // Get id when extension is first installed
// chrome.runtime.onInstalled.addListener(() => {
// 	chrome.tabs.create({
// 		url: 'https://r.wlocalhost.org/chat?action=install'
// 	})
// });

// Listen for updates
chrome.runtime.onUpdateAvailable.addListener(() => {
  return chrome.runtime.reload();
});

// chrome.runtime.onInstalled.addListener(details => {
// 	self.installedNow = details
// })

// Default badge color
chrome.browserAction.setBadgeBackgroundColor({
  color: '#fff'
});

this.video = document.createElement('video');
this.video.volume = 0.3;
const info = chrome.runtime.getManifest();

chrome.browserAction.setTitle({
  title: info.name + ' v.' + info.version
});

// Change badge
video.onplay = function() {
  chrome.browserAction.setBadgeText({
    text: '🎧'
  });
};
video.onpause = function() {
  chrome.browserAction.setBadgeText({
    text: ''
  });
};
