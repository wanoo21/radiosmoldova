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
    filter = $('input[type=search]'),
    range = $('ip-slider'),
    playPauseButton = $('button.play_pause'),
    radioTitle = $('h5 > .radio-title'),
    showTime = $('h5 > small'),
    btnRegion = $('.btn-region').find('button'),
    radioContainer = $('#radio-list'),
    configs = {
      serverName: './server',
      trackEvents: !!global._gaq
    };

  // Window from background.html
  self.background = chrome.extension.getBackgroundPage();
  self.manifest = chrome.runtime.getManifest();
  self.video = self.background.video;

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

  self.trackEvents = function(value, type) {
    if (configs.trackEvents) {
      _gaq.push(['_trackEvent', value, type]);
    }
  };

  // Default play functions
  self.videoPlay = function() {
    panelBody.addClass('playing');
    panelHeading.addClass('playing');
    playPauseButton
      .find('i')
      .removeClass('rotate')
      .text('stop');
    radioTitle.text(self.background.currentRadio.name);
    range.prop('disabled', false);
    range.attr('value', self.background.video.volume * 100);
  };

  // Default pause function
  self.videoPause = function() {
    panelBody.removeClass('playing');
    panelHeading.removeClass('playing');
    playPauseButton
      .find('i')
      .removeClass('rotate')
      .text('play_arrow');
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
    filter.val('');
    radioContainer.find('a').show();
    self.background.currentRadio.loading = false;
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
    $(self.video).on('error', function() {
      self.videoPause();
      radioTitle.text('Sorry, acest post nu merge.');
      self.trackEvents(self.background.currentRadio.name, 'error');
    });
    $(self.video).on('loadstart', self.videoStartLoading);
    $(self.video).on('loadeddata', () => {
      self.videoEndLoading();
      self.trackEvents(self.background.currentRadio.name, 'played');
      self.video.play();
    });
    $(self.video).on('play', self.videoPlay);
    $(self.video).on('pause', self.videoPause);
    $(self.video).on('timeupdate', self.videoTimeUpdate);
    $(self.video).on('waiting', self.videoStartLoading);
    $(self.video).on('playing', () => {
      self.videoEndLoading();
      self.videoPlay();
    });
    // $(self.video).on('suspend', self.videoPause);
  };
  // Filter listener
  filter
    .on('keyup', function() {
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

  self.autoScrollToPlayedRadio = function() {
    var radioActive = $('a.list-group-item.active');
    if (radioActive.length) {
      return radioContainer.animate({
        scrollTop: radioActive.offset().top - (radioContainer.height() + 27)
      });
    }
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
    self.video[self.video.paused ? 'play' : 'pause']();
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
    return self.getRadioList(region).then(async function(radioList) {
      // Put list into global variable
      self.radioList = radioList;
      var list = '';
      // Generate dynamically list on html
      await $.when(
        $.each(radioList, function(k, v) {
          if (v.disable) return;
          self.radioList[k].nameId = self.getNameId(v.name);
          self.radioList[k].id = k;
          list += `<a href=# class="list-group-item" data-name="${self.getNameId(
            v.name
          )}" data-id=${k}>${
            v.name
          }<i class="material-icons favorite">favorite</i></a>`;
        })
      );
      // Put generated html on list container
      if (radioContainer.find('a').length) {
        await radioContainer
          .fadeOut(300)
          .promise()
          .done(() => Promise.resolve());
      }

      radioContainer
        .html(list)
        .promise()
        .done(function() {
          radioContainer.fadeIn(300);
          // Call video listeners
          self.videoListeners();
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
              // Make this channel active
              radioContainer.find('a').removeClass('active');
              $(this).addClass('active');
              // Change background global current radio
              self.background.currentRadio = self.radioList[$(this).data('id')];
              // Stop video for change channel
              if (self.video.src) self.video.pause();
              // Make current url in background url
              self.video.src = self.background.currentRadio.url;
              // Load video after src is changed
              self.video.load();
            }
          });
        });
    });
  };

  self.autoScrollToPlayedRadio();
  self.setRadio();
  btnRegion.on('click', function() {
    if ($(this).hasClass('active')) return self.autoScrollToPlayedRadio();
    return self.setRadio($(this).data('region'));
  });

  // For reload extension
  self.reload = function() {
    return chrome.runtime.reload();
  };
})(window);
