// Default Chrome Extension script
(function(global) {
  // Number prototype for adding zero to time
  Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {
      s = '0' + s;
    }
    return s;
  };

  // Default variables
  let $ = global.jQuery,
    self = this,
    panelHeading = $('.panel-heading'),
    panelBody = $('.panel-body'),
    listeners = panelBody.find('span.listeners'),
    posts = panelBody.find('span.posts'),
    filter = $('input[type=search]'),
    feedbackButton = $('button.feedback-btn'),
    feedbackAddButton = $('button.feedback-add-btn'),
    // feedbackAddValue = $('input.feedback-add-value'),
    feedbackContainer = $('.radios-feedbacks'),
    // chatButton = $('button.chat'),
    range = $('ip-slider'),
    playPauseButton = $('button.play_pause'),
    radioTitle = $('h5 > .radio-title'),
    showTime = $('h5 > small'),
    btnRegion = $('.btn-region').find('button'),
    radioContainer = $('#radio-list'),
    feedbackMaxTextLength = 30,
    stationsLength = $('span.stations-length'),
    configs = {
      serverName: './server',
      trackEvents: !!global._gaq
    };

  // Window from background.html
  self.background = chrome.extension.getBackgroundPage();
  self.manifest = chrome.runtime.getManifest();
  // Get background video
  self.video = $(self.background.document).find('video')[0];
  // Default feedbacks array
  self.feedbacks = [];

  // Object.defineProperty(self, 'setTotalListeners', {
  //   set(data) {
  //     listeners.text(data.listeners);
  //     posts.text(data.posts);
  //   }
  // });
  // Start listen firebase
  self.startListenFirebase = function() {
    self.background.radioKeys = {};
    self.background.listeners.on('child_added', function(currentRadio) {
      self.background.radioKeys[currentRadio.val().nameId] = currentRadio.key();
    });
    self.background.listeners.on('child_changed', function(changedRadio) {
      return self.addBadgeInfo(changedRadio.val());
    });
    // Listen added feedbacks
    self.background.feedbacks.on('child_added', function(feedback) {
      if (
        feedback.val().text == '' ||
        self.feedbacks.some(f => f.key === feedback.key())
      )
        return;
      self.feedbacks.push(
        $.extend(true, feedback.val(), {
          key: feedback.key()
        })
      );
      return self.addFeedbacksInHtml();
    });
    // Listen changed feedbacks
    self.background.feedbacks.on('child_changed', function(feedback) {
      if (feedback.val().text == '') return;
      self.feedbacks = self.feedbacks.map(f => {
        if (f.key == feedback.key()) f.likes = feedback.val().likes;
        return f;
      });
      return self.addFeedbacksbadgeInfo(feedback.key());
    });
  };

  // Get data from firebase and make changes
  self.getFirebaseData = function(obj) {
    self.background.listeners.once('value', function(snapshot) {
      let currentData = snapshot.val();
      if (obj) {
        let thisRadio = currentData[self.background.radioKeys[obj.nameId]];
        if (obj.action == 'play' || obj.action == 'choosed') {
          thisRadio.listeners += 1;
        } else if (!obj.action || thisRadio.listeners > 0) {
          thisRadio.listeners -= 1;
        }
        self.background.listeners
          .child(self.background.radioKeys[obj.nameId])
          .update(thisRadio);
        return (
          (obj.action == 'play' || obj.action == 'choosed') &&
          self.background.listeners
            .child(self.background.radioKeys[obj.nameId])
            .onDisconnect()
            .set({
              listeners: --self.currentRadio.listeners
            })
        );
      } else {
        Object.keys(currentData).forEach(function(key) {
          if (!currentData[key].nameId) {
            return self.background.listeners.child(key).remove();
          }
          if (
            currentData[key].nameId.indexOf('-' + self.background.region) == -1
          )
            return;
          return self.addBadgeInfo(currentData[key]);
        });
      }
    });
  };

  // Activate tooltips
  self.activateTooltip = () => $('[title]').tooltip();
  range.attr('value', self.background.video.volume * 100);

  // Initial function
  if (!self.background.currentRadio) {
    playPauseButton
      .prop('disabled', true)
      .find('i')
      .text('play_arrow');
    radioTitle.text('Alege un radio din lista');
    // showTime.text('');
    range.prop('disabled', true);
  }

  // Add info on radio list
  self.addBadgeInfo = radio => {
    if (
      self.background.currentRadio &&
      radio.nameId === self.background.currentRadio.nameId
    )
      self.background.currentRadio.listeners = radio.listeners;
    let badge = radioContainer
      .find(`a[data-name=${radio.nameId}]`)
      .find('span.badge:not(.icon)');
    return (radio.listeners > 0
      ? badge.text(radio.listeners).fadeIn()
      : badge.fadeOut(() => {
          badge.text('');
        })
    )
      .promise()
      .done(() => {
        let badges = radioContainer.find('span.badge:not(:empty)'),
          _totalListeners = 0,
          _totalposts = 0;
        $(badges).each((k, badge) => {
          _totalListeners += Number(badge.innerText);
          _totalposts++;
        });
        self.setTotalListeners = {
          listeners: _totalListeners,
          posts: _totalposts
        };
      });
  };

  self.addFeedbacksbadgeInfo = key => {
    var feedbackBadge = $(`#radio-feedbacks`).find(`button[data-key=${key}]`);
    if (!feedbackBadge.length) return;
    feedbackBadge.find('.badge i.glyphicon-heart').addClass('liked');
    setTimeout(() => {
      feedbackBadge.find('.badge i.glyphicon-heart').removeClass('liked');
    }, 800);
    feedbackBadge
      .find('span.likes-count')
      .text(self.feedbacks.find(f => f.key === key).likes);
  };

  // Set stats on firebase
  self.setStat = obj => {
    obj = obj || {};
    // obj.date = new Date().getTime();
    obj.id = self.background.currentRadio.id || null;
    obj.nameId = self.background.currentRadio.nameId;
    return self.getFirebaseData(obj);
  };

  self.trackEvents = (value, type) => {
    if (configs.trackEvents) {
      _gaq.push(['_trackEvent', value, type]);
    }
  };

  // Default play functions
  self.videoPlay = function() {
    panelBody.addClass('playing');
    panelHeading.addClass('playing');
    playPauseButton.find('i').text('stop');
    radioTitle.text(self.background.currentRadio.name);
    range.prop('disabled', false);
    range.attr('value', self.background.video.volume * 100);
    self.trackEvents(self.background.currentRadio.name, 'played');
  };

  // Default pause function
  self.videoPause = function() {
    panelBody.removeClass('playing');
    panelHeading.removeClass('playing');
    playPauseButton.find('i').text('play_arrow');
  };
  // Default loading start function
  self.videoStartLoading = function() {
    panelBody.removeClass('playing');
    panelHeading.removeClass('playing');
    radioTitle.text(self.background.currentRadio.name);
    playPauseButton.prop('disabled', true);
    playPauseButton
      .find('i')
      .addClass('rotate')
      .text('loop');
    // showTime.text('');
    self.background.currentRadio.loading = true;
  };
  // Default loading end function
  self.videoEndLoading = function() {
    playPauseButton.prop('disabled', false);
    playPauseButton.find('i').removeClass('rotate');
    self.background.currentRadio.loading = false;
    // Clean filter value
    filter.val('');
    radioContainer.find('a').show();
    self.video.play();
  };
  // Default timeupdate function
  self.videoTimeUpdate = function() {
    self.video.hours = Math.floor(self.video.currentTime / 60 / 60).pad();
    self.video.minutes = Math.floor(self.video.currentTime / 60).pad();
    self.video.seconds = Math.floor(
      self.video.currentTime - self.video.minutes * 60
    ).pad();
    const { hours, minutes, seconds } = self.video;
    showTime.text(`${hours}:${(minutes - hours * 60).pad()}:${seconds}`);
  };
  // Default buffering function
  self.videoBuffering = function() {
    panelBody.removeClass('playing');
    panelHeading.removeClass('playing');
    playPauseButton
      .find('i')
      .addClass('rotate')
      .text('loop');
    // radioTitle.text(`Buffering <b>${self.background.currentRadio.name}</b>`);
  };
  // Operation for video, volume, pause, play, stop, etc.
  self.videoListeners = function() {
    // Alert if isset error
    $(self.video).on('error', function(ev) {
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
    $(self.video).on('waiting', self.videoBuffering);
  };
  // Filter listener
  filter
    .on('keyup', function() {
      self.checkAndShowRadioContainer();
      var regex = new RegExp(this.value, 'ig');
      radioContainer
        .find('a')
        .hide()
        .filter(function() {
          return regex.test(this.text);
        })
        .show();
    })
    .dblclick(function() {
      this.select();
    });

  // Listen range and change volume
  range.on('input', function() {
    self.background.video.volume = this.value / 100;
  });

  // Fade in/out function
  self.fadeOutFadeIn = function(fOut, fIn, callback) {
    return fOut
      .fadeOut()
      .promise()
      .done(() => fIn.fadeIn(callback || ''));
  };

  self.checkAndShowRadioContainer = function() {
    if (!radioContainer.is('visible'))
      self.fadeOutFadeIn(feedbackContainer, radioContainer, () =>
        feedbackButton.removeClass('active')
      );
  };

  self.autoScrollToPlayedRadio = () => {
    var radioActive = $('a.list-group-item.active');
    return (
      radioActive.length &&
      radioContainer.animate({
        scrollTop: radioActive.offset().top - (radioContainer.height() + 27)
      })
    );
  };

  self.addFeedbacksInHtml = () => {
    feedbackAddButton.find('span.text-max-length').text(feedbackMaxTextLength);
    return $('#radio-feedbacks')
      .html(() => {
        return self.feedbacks
          .map(feedback => {
            return `<button type="button" data-key="${
              feedback.key
            }" title="Apasa pentru a vota" class="list-group-item feedback-item">${
              feedback.text
            } <span class="badge"><i class="glyphicon glyphicon-heart"></i> <span class="likes-count">${feedback.likes ||
              0}</span></span></button>`;
          })
          .reverse()
          .join('');
      })
      .promise()
      .done(() => {
        $('#radio-feedbacks')
          .find('button.feedback-item')
          .unbind('click')
          .bind('click', e => {
            var $this = $(e.target);
            var key = $this.data('key'),
              likes =
                self.feedbacks.find(feedBack => {
                  return feedBack.key === key;
                }).likes || 0;
            self.background.feedbacks.child(key).update({
              likes: (likes += 1)
            });
            // return self.addFeedbacksbadgeInfo(key);
          });
      });
  };

  // Basic log message
  self.log = function(txt, type) {
    if (type == 'error')
      // self.background.errors.push({
      //   radio: self.background.currentRadio || null,
      //   error: txt
      // });
      return console[type || 'info'](txt);
  };

  // Get radio list function
  self.getRadioList = function(region) {
    self.background.region = region;
    return new Promise(function(resolve, reject) {
      if (!sessionStorage.getItem(`radiolist-${self.background.region}`)) {
        return $.getJSON(
          `${configs.serverName}/radiolist-${self.background.region}.json`
        ).then(function(radiolist) {
          sessionStorage.setItem(
            `radiolist-${self.background.region}`,
            JSON.stringify(radiolist)
          );
          return resolve(radiolist);
        }, reject);
      } else {
        return resolve(
          JSON.parse(
            sessionStorage.getItem(`radiolist-${self.background.region}`)
          )
        );
      }
    });
  };

  self.getNameId = function(name) {
    return (
      name
        .split(' ')
        .join('-')
        .toLowerCase()
        .replace(/\(|\)/gi, '') +
      '-' +
      self.background.region
    );
  };

  // Make changes if radio play on loading DOM
  if (!!self.background.currentRadio && !self.video.paused) {
    self.videoPlay();
  }

  // Make changes if video is paused on loading DOM
  if (self.video.paused && !!self.background.currentRadio) {
    self.videoPause();
    self.videoTimeUpdate();
    radioTitle.text(self.background.currentRadio.name);
  }

  // Disable play/pause button if video is loading, DOM
  if (!!self.background.currentRadio && self.background.currentRadio.loading) {
    self.videoStartLoading();
  }

  // Player play/pause actions
  playPauseButton.click(function() {
    var action = self.video.paused ? 'play' : 'pause';
    self.video[action]();
    self.setStat({
      name: self.background.currentRadio.name,
      action: action,
      timeListen: self.video.currentTime
    });
  });

  // Get all radio and put into document
  self.setRadio = function(region) {
    region = region || self.background.region || 'md';
    btnRegion
      .removeClass('active')
      .filter(function() {
        return $(this).hasClass(region);
      })
      .addClass('active');
    return self.getRadioList(region).then(function(radioList) {
      // Put list into global variable
      self.radioList = radioList;
      var list = '';
      stationsLength.text(`${radioList.length} statii total.`);
      // Generate dynamically list on html
      $.when(
        $.each(radioList, function(k, v) {
          if (v.disable) return;
          // if (!self.background.radioKeys)
          //     self.background.listeners.push({ id: k, name: v.name, listeners: 0, nameId: self.getNameId(v.name) });
          self.radioList[k].nameId = self.getNameId(v.name);
          self.radioList[k].id = k;
          list += `<a href=# class="list-group-item" data-name="${self.getNameId(
            v.name
          )}" data-id=${k}>${
            v.name
          }<i class="material-icons favorite">favorite</i></a>`;
        })
      ).then(function() {
        // Put generated html on list container
        radioContainer
          .html(list)
          .promise()
          .done(function() {
            // Call video listeners
            self.videoListeners();
            // Start listen firebase actions
            self.startListenFirebase();
            // Put firebase data in DOM
            self.getFirebaseData();
            self.trackEvents(region, 'region');
            self.activateTooltip();
            // Make current radio active
            if (!!self.background.currentRadio) {
              var currentRadioList = radioContainer.find(
                'a[data-name=' + self.background.currentRadio.nameId + ']'
              );
              if (currentRadioList.length) {
                currentRadioList.addClass('active');
                self.autoScrollToPlayedRadio();
              }
            }
            // Change radio
            radioContainer.on('click', 'a', function(e) {
              e.preventDefault();
              // Verify if channel is not the same
              if (!$(this).hasClass('active')) {
                // Changed event
                if (!!self.background.currentRadio)
                  self.setStat({
                    name: self.background.currentRadio.name,
                    action: 'changed'
                  });
                // Make this channel active
                $(this)
                  .parent()
                  .find('a')
                  .removeClass('active');
                $(this).addClass('active');
                // Change background global current radio
                self.background.currentRadio =
                  self.radioList[$(this).data('id')];
                //self.background.currentRadio.id = $(this).data('id');
                // Stop video for change channel
                if (self.video.src) self.video.pause();
                // Make current url in background url
                $(self.video).find('source')[0].src =
                  self.background.currentRadio.url;
                // Load video after src is changed
                self.video.load();
                // Choosed event
                self.setStat({
                  name: self.background.currentRadio.name,
                  action: 'choosed'
                });
              }
            });
          });
      });
    });
  };

  self.setRadio();
  btnRegion.on('click', function() {
    self.checkAndShowRadioContainer();
    if ($(this).hasClass('active')) return self.autoScrollToPlayedRadio();
    return self.setRadio($(this).data('region'));
  });

  // For reload extension
  self.reload = function() {
    return chrome.runtime.reload();
  };

  self.refreshListeners = () => {
    return self.radioList.forEach(radio => {
      if (self.background.radioKeys[radio.nameId]) {
        self.background.listeners
          .child(self.background.radioKeys[radio.nameId])
          .update(
            {
              listeners: 0
            },
            err => {
              console.log(err || 'success');
            }
          );
      }
    });
  };
})(window);
