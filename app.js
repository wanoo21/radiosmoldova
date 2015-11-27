/* global chrome */
// Default Chrome Extension script
(function(window) {
	// Verify if jQuery is defined
	if(!window.jQuery) throw "jQuery is undefined. Please include jQuery framework."
	
	// Default variables
	var $ = window.jQuery,
		self = this,
		playButton = $('button.play'),
		pauseButton = $('button.pause'),
		muteButton = $('button.mute'),
		radioContainer = $('#radio-list');
	
	// Window from background.html
	self.background = chrome.extension.getBackgroundPage();
	self.video = $(self.background.document).find('video')[0]
	
	// Player listeners
	playButton.click(function(){
		return self.video.play()
	})
	pauseButton.click(function(){
		return self.video.pause()
	})
	
	// Operation for video, volume, pause, play, stop, etc.
	self.videoListeners = function() {
		// Alert if isset error
		self.video.onerror = function() {
			self.log("Error! Something went wrong", 'error');
			this.load();
		};
		
		// Start loading video
		self.video.onloadstart = function() {
			self.log("Starting to load radio " + self.currentRadio.name);
		};
		
		// Start when data is loaded
		self.video.onloadeddata = function() {
			self.log("Browser has loaded the current frame");
			this.play();
		};
		
		// Progress video
		self.video.ontimeupdate = function() {
			this.minutes = Math.floor(this.currentTime / 60).pad();
			this.seconds = (Math.floor(this.currentTime) - this.minutes * 60).pad();
			// console.log(this.minutes + ' : ' + this.seconds)
		}
		
		// Make changes when player begin play
		self.video.onplay = function() {
			playButton.addClass('disabled')
			pauseButton.removeClass('disabled')
			self.setActionTitle('Now playing ' + self.currentRadio.name)
		};
		
		// Make changes when player is paused
		self.video.onpause = function() {
			pauseButton.addClass('disabled')
			playButton.removeClass('disabled')
			self.setActionTitle('Now on pause ' + self.currentRadio.name)
		};
		
		// Start when video is buffering
		self.video.onwaiting = function() {
			self.log("Wait! I need to buffer the next frame");
		};
	}
	
	// Basic log message
	self.log = function(txt, type) {
		return console[type || 'info'](txt)
	}
	
	// Change dynamically title of icon
	self.setActionTitle = function(title) {
		chrome.browserAction.setTitle({
			title: title
		})
		return self;
	}
	
	// Get radio list function
	self.getRadioList = function() {
		return $.getJSON('radiolist.json');
	}
	
	// Get all info from manifest
	self.getManifestInfo = function() {
		return chrome.runtime.getManifest()
	}
	
	// Get all radio and put into document
	self.getRadioList().then(function(list) {
		// Put list into global variable
		self.radioList = list;
		var li = '';
		// Generate dynamically list on html
		$.when($.each(list, function(k, v) {
			li += '<a href=# class="list-group-item" data-id=' + k + '>' + v.name + '</a>'
		})).then(function(){
			// Put generated html on list container
			radioContainer.html(li).promise().done(function(){
				// Call video listeners
				self.videoListeners()
				// Change radio
				radioContainer.on('click', 'a', function(e) {
					e.preventDefault();
					// Verify if channel is not the same
					if(!$(this).hasClass('active')) {
						// Make this channel active
						$(this).parent().find('a').removeClass('active');
						$(this).addClass('active');
						// Change global current radio
						self.currentRadio = self.radioList[$(this).data('id')];
						// Stop video for change channel
						if(self.video.src) self.video.stop()
						// Make current url in background url
						$(self.video).find('source')[0].src = self.currentRadio.url;
						// Load video after src is changed
						self.video.load();	
					}
				})
			});
		})
	})
	
	// For reload extension
	self.reload = function() {
		return chrome.runtime.reload();
	}
	
	// NUmber prototype for adding zero to time
	Number.prototype.pad = function(size) {
		var s = String(this);
		while (s.length < (size || 2)) {
			s = "0" + s;
		}
		return s;
	}
	
}(window))