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

// Badge status
document.getElementsByTagName('video')[0].onplay = function() {
	chrome.browserAction.setBadgeText({ text: 'play' })
}
document.getElementsByTagName('video')[0].onpause = function() {
	chrome.browserAction.setBadgeText({ text: 'stop' })
}