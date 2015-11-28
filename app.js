/* global chrome */
// Default Chrome Extension script
(function(window) {
	// Verify if jQuery is defined
	if(!window.jQuery) throw "jQuery is undefined. Please include jQuery framework.";
	
	// Number prototype for adding zero to time
	Number.prototype.pad = function(size) {
		var s = String(this);
		while (s.length < (size || 2)) {
			s = "0" + s;
		}
		return s;
	}
	
	// Default variables
	var $ = window.jQuery,
		self = this,
		panelBody = $('.panel-body'),
		filter = $('input[type=search]'),
		playPauseButton = $('button.play_pause'),
		radioTitle = $('h5 > .radio-title'),
		showTime = $('h5 > small'),
		radioContainer = $('#radio-list');
	
	// Window from background.html
	self.background = chrome.extension.getBackgroundPage();
	// Get background video
	self.video = $(self.background.document).find('video')[0]
	
	// Initial function
	if(!self.background.currentRadio) {
		playPauseButton.prop('disabled', true).text('play_arrow')
		radioTitle.text('Alege un radio din lista')
		showTime.text('')
	}
	
	// Default play functions
	self.videoPlay = function() {
		panelBody.addClass('playing')
		playPauseButton.text('pause')
		radioTitle.text(self.background.currentRadio.name)
	}
	// Default pause function
	self.videoPause = function() {
		panelBody.removeClass('playing')
		playPauseButton.text('play_arrow')
	} 
	// Default loading start function
	self.videoStartLoading = function() {
		panelBody.removeClass('playing')
		radioTitle.text('Se incarca... ' + self.background.currentRadio.name)
		playPauseButton.prop('disabled', true)
		showTime.text('')
		self.background.currentRadio.loading = true;
	}
	// Default loading end function
	self.videoEndLoading = function() {
		playPauseButton.prop('disabled', false)
		self.log("Browser has loaded the current frame");
		self.background.currentRadio.loading = false;
		self.video.play();
	}
	// Default timeupdate function
	self.videoTimeUpdate = function() {
		self.video.minutes = Math.floor(self.video.currentTime / 60).pad();
		self.video.seconds = (Math.floor(self.video.currentTime) - self.video.minutes * 60).pad();
		showTime.text(self.video.minutes + ' : ' + self.video.seconds)
	}
	// Default buffering function
	self.videoBuffering = function() {
		panelBody.removeClass('playing')
		radioTitle.text('Buffering... ' + self.background.currentRadio.name)
	}
	// Operation for video, volume, pause, play, stop, etc.
	self.videoListeners = function() {
		// Alert if isset error
		self.video.onerror = function() {
			self.log("Error! Something went wrong", 'error');
			// Load again
			this.load();
		};
		// Start loading video
		$(self.video).on('loadstart', self.videoStartLoading)
		// Start when data is loaded
		$(self.video).on('loadeddata', self.videoEndLoading)
		// Make changes when player begin play
		$(self.video).on('play', self.videoPlay);
		// Make changes when player is paused
		$(self.video).on('pause', self.videoPause)
		// Progress video
		$(self.video).on('timeupdate', self.videoTimeUpdate)
		// Start when video is buffering
		$(self.video).on('waiting', self.videoBuffering)
	}
	// Filter listener
	filter.on('keyup', function(){
		var regex = new RegExp(this.value, 'ig');
		radioContainer.find('a').hide()
		radioContainer.find('a').filter(function() {
			return regex.test(this.text);
		}).show()
	})
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
	
	
	// Add class playing if radio is active on document is loaded
	if(!!self.background.currentRadio && !self.video.paused) {
		self.videoPlay()
	}
	
	// Make changes if video is paused on document is loaded
	if(self.video.paused && !!self.background.currentRadio) {
		self.videoPause()
		self.videoTimeUpdate()
		radioTitle.text(self.background.currentRadio.name)
	}
	
	// Disable play/pause button if video is loading
	if(!!self.background.currentRadio && self.background.currentRadio.loading) {
		self.videoStartLoading()
	}
	
	// Player play/pause
	playPauseButton.click(function() {
		self.video[self.video.paused ? 'play' : 'pause']()
		$(this).text(self.video.paused ? 'play_arrow' : 'pause')
	})
	
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
				// Make current radio active
				if(!!self.background.currentRadio) {
					radioContainer.find('a[data-id=' + self.background.currentRadio.id + ']').addClass('active');
				}
				// Change radio
				radioContainer.on('click', 'a', function(e) {
					e.preventDefault();
					// Verify if channel is not the same
					if(!$(this).hasClass('active')) {
						// Make this channel active
						$(this).parent().find('a').removeClass('active');
						$(this).addClass('active');
						// Change background global current radio
						self.background.currentRadio = self.radioList[$(this).data('id')];
						self.background.currentRadio.id = $(this).data('id');
						// Stop video for change channel
						if(self.video.src) self.video.pause()
						// Make current url in background url
						$(self.video).find('source')[0].src = self.background.currentRadio.url;
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
	
}(window))