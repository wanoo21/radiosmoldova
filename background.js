// All listeners

// Get id when extension is installed, updated, and chrome is updated
chrome.runtime.onInstalled.addListener(function(details) {
	// TODO
})

// Listen on suspend 
chrome.runtime.onSuspend.addListener(function(){
	// TODO
})

// Listen for updates
chrome.runtime.onUpdateAvailable.addListener(function(manifest) {
	// Return auto update
	return chrome.runtime.reload();
})

// Default badge color
chrome.browserAction.setBadgeBackgroundColor({ color: '#337ab7' })

// get Radio
var video = document.getElementsByTagName('video')[0];
// Manifest info
var info = chrome.runtime.getManifest()

chrome.browserAction.setTitle({ title: info.name + ' v.' + info.version })

// Change badge 
video.onplay = function() {
	chrome.browserAction.setBadgeText({ text: 'play' })
}
video.onpause = function() {
	chrome.browserAction.setBadgeText({ text: 'stop' })
}
video.onload = function() {
	chrome.browserAction.setBadgeText({ text: '...' })
}