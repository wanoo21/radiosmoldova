/* global chrome */
// Default Chrome Extension script
(function(global) {
	// Verify if jQuery is defined
	if(!window.jQuery) throw "jQuery is undefined. Please include jQuery framework.";
    if(!window.Firebase) throw "Firebase is not undefined!";
	
	// Number prototype for adding zero to time
	Number.prototype.pad = function(size) {
		var s = String(this);
		while (s.length < (size || 2)) {
			s = "0" + s;
		}
		return s;
	};
	
	// Default variables
	var $ = global.jQuery,
		self = this,
		panelBody = $('.panel-body'),
		filter = $('input[type=search]'),
		playPauseButton = $('button.play_pause'),
		radioTitle = $('h5 > .radio-title'),
		showTime = $('h5 > small'),
		radioContainer = $('#radio-list'),
        firebase = new Firebase('https://radio-moldova.firebaseio.com/'),
        radioErrors = firebase.child('errors');

    self.listeners = firebase.child('listeners');

    // Window from background.html
    self.background = chrome.extension.getBackgroundPage();
    // Get background video
    self.video = $(self.background.document).find('video')[0];

    // Start listen firebase
    self.startListenForebase = function() {
        self.radioKeys = {};
        self.listeners.on('child_added', function (currentRadio) {
            self.radioKeys[currentRadio.val().nameId] = currentRadio.key();
        });
        self.listeners.on('child_changed', function(changedRadio) {
            return self.addBadgeInfo(changedRadio.val())
        });
        self.getFirebaseData()
    };

    // Get data from firebase and make changes
    self.getFirebaseData = function(obj) {
        self.listeners.once('value', function(snapshot) {
            var currentData = snapshot.val();
            if(obj) {
                var thisRadio = currentData[self.radioKeys[obj.nameId]];

                if (obj.action == 'play' || obj.action == 'choosed')
                    thisRadio.listeners += 1;

                else if(thisRadio.listeners > 0)
                    thisRadio.listeners -= 1;

                self.listeners.child(self.radioKeys[obj.nameId]).update(thisRadio, function(err) {
                    if(err) return self.log(err, 'error');
                })
            } else {
                Object.keys(currentData).forEach(function (key) {
                    self.background.radioKeys = self.radioKeys;
                    return self.addBadgeInfo(currentData[key]);
                })
            }
        });
    };

    // Save errors
    $(window).on('error', function(err){
        radioErrors.push(err);
    });

	// Initial function
	if(!self.background.currentRadio) {
		playPauseButton.prop('disabled', true).text('play_arrow');
		radioTitle.text('Alege un radio din lista');
		showTime.text('')
	}

    // Add info on radio list
    self.addBadgeInfo = function (radio) {
        self.background.currentRadio.listeners = radio.listeners;
        return radioContainer.find('a[data-id=' + radio.id + ']').find('span.badge')[radio.listeners > 0 ? 'fadeIn' : 'fadeOut']().text(radio.listeners)
    };

    // Set stats on firebase
    self.setStat = function(obj) {
        obj = obj || {};
        obj.date = new Date().getTime();
        obj.id = self.background.currentRadio.id || null;
        obj.nameId = (obj.name || self.background.currentRadio.name).replace(' ', '-').toLowerCase();
        return self.getFirebaseData(obj)
    };
    
	// Default play functions
	self.videoPlay = function() {
		panelBody.addClass('playing');
		playPauseButton.text('pause');
		radioTitle.text(self.background.currentRadio.name);
	};
	// Default pause function
	self.videoPause = function() {
		panelBody.removeClass('playing');
		playPauseButton.text('play_arrow');
	};
	// Default loading start function
	self.videoStartLoading = function() {
		panelBody.removeClass('playing');
		radioTitle.text('Se incarca... ' + self.background.currentRadio.name);
		playPauseButton.prop('disabled', true);
		showTime.text('');
		self.background.currentRadio.loading = true;
	};
	// Default loading end function
	self.videoEndLoading = function() {
		playPauseButton.prop('disabled', false);
		self.background.currentRadio.loading = false;
		self.video.play();
	};
	// Default timeupdate function
	self.videoTimeUpdate = function() {
		self.video.minutes = Math.floor(self.video.currentTime / 60).pad();
		self.video.seconds = (Math.floor(self.video.currentTime) - self.video.minutes * 60).pad();
		showTime.text(self.video.minutes + ' : ' + self.video.seconds)
	};
	// Default buffering function
	self.videoBuffering = function() {
		panelBody.removeClass('playing');
		radioTitle.text('Buffering... ' + self.background.currentRadio.name)
	};
	// Operation for video, volume, pause, play, stop, etc.
	self.videoListeners = function() {
		// Alert if isset error
        $(self.video).on('error', function(ev) {
            self.log("Error! Something went wrong", 'error', ev);
            // Load again
            this.load();
        });
		// Start loading video
		$(self.video).on('loadstart', self.videoStartLoading);
		// Start when data is loaded
		$(self.video).on('loadeddata', self.videoEndLoading);
		// Make changes when player begin play
		$(self.video).on('play', self.videoPlay);
		// Make changes when player is paused
		$(self.video).on('pause', self.videoPause);
		// Progress video
		$(self.video).on('timeupdate', self.videoTimeUpdate);
		// Start when video is buffering
		$(self.video).on('waiting', self.videoBuffering)
	};
	// Filter listener
	filter.on('keyup', function(){
		var regex = new RegExp(this.value, 'ig');
		radioContainer.find('a').hide().filter(function() {
			return regex.test(this.text);
		}).show()
	});
	// Basic log message
	self.log = function(txt, type) {
        if(type == 'error')
            radioErrors.push({ radio: self.background.currentRadio || null, error: txt });
		return console[type || 'info'](txt)
	};
	// Change dynamically title of icon
	self.setActionTitle = function(title) {
		chrome.browserAction.setTitle({
			title: title
		});
		return self;
	};
	// Get radio list function
	self.getRadioList = function() {
		return $.getJSON('radiolist.json');
	};

	// Make changes if radio play on loading DOM
	if(!!self.background.currentRadio && !self.video.paused) {
		self.videoPlay()
	}
	
	// Make changes if video is paused on loading DOM
	if(self.video.paused && !!self.background.currentRadio) {
		self.videoPause();
		self.videoTimeUpdate();
		radioTitle.text(self.background.currentRadio.name)
	}
	
	// Disable play/pause button if video is loading, DOM
	if(!!self.background.currentRadio && self.background.currentRadio.loading) {
		self.videoStartLoading()
	}
	
	// Player play/pause actions
	playPauseButton.click(function() {
        var action = self.video.paused ? 'play' : 'pause';
		self.video[action]();
        self.setStat({ name: self.background.currentRadio.name, action: action, timeListen: self.video.currentTime })
	});
	
	// Get all radio and put into document
	self.getRadioList().then(function(radioList) {
		// Put list into global variable
		self.radioList = radioList;
		var list = '';
		// Generate dynamically list on html
		$.when($.each(radioList, function(k, v) {
            self.listeners.push({ id: k, name: v.name, listeners: 0, nameId: v.name.replace(' ', '-').toLowerCase() });
            self.radioList[k].nameId = v.name.replace(' ', '-').toLowerCase();
            self.radioList[k].id = k;
			list += '<a href=# class="list-group-item" data-id=' + k + '>' + v.name + '<span class="badge" style="display: none" title="Ascultatori acum"></span></a>'
		})).then(function(){
			// Put generated html on list container
			radioContainer.html(list).promise().done(function(){
				// Call video listeners
				self.videoListeners();
                // Start listen firebase actions
                self.startListenForebase();
				// Make current radio active
				if(!!self.background.currentRadio) {
					radioContainer.find('a[data-id=' + self.background.currentRadio.id + ']').addClass('active');
				}
				// Change radio
				radioContainer.on('click', 'a', function(e) {
					e.preventDefault();
					// Verify if channel is not the same
					if(!$(this).hasClass('active')) {
                        // Changed event
                        if(!!self.background.currentRadio)
                            self.setStat({ name: self.background.currentRadio.name, action: 'changed' });
						// Make this channel active
						$(this).parent().find('a').removeClass('active');
						$(this).addClass('active');
						// Change background global current radio
						self.background.currentRadio = self.radioList[$(this).data('id')];
						//self.background.currentRadio.id = $(this).data('id');
						// Stop video for change channel
						if(self.video.src) self.video.pause();
						// Make current url in background url
						$(self.video).find('source')[0].src = self.background.currentRadio.url;
						// Load video after src is changed
						self.video.load();
                        // Choosed event
                        self.setStat({ name: self.background.currentRadio.name, action: 'choosed' })
					}
				})
			});
		})
	});
	
	// For reload extension
	self.reload = function() {
		return chrome.runtime.reload();
	}
	
}(window));
