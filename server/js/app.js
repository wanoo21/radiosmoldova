// https://github.com/vinaygopinath/ngMeta
class mainCtrl {
  constructor(ngMeta, $location) {
    ngMeta.setTitle('Radio online din Romania si Rep. Moldova', '')
    ngMeta.setTag('description', 'Asculata radio online din Romania, Rusia si Republica Moldova direct din browserul tau chrome, fara intrerupere si absolut gratuit!')

    this.isChrome = !!window.chrome
    this.appInstalled = !!(this.isChrome && chrome.app.isInstalled)

    if ($location.$$search.action) {
      this.trackEvents($location.$$search.action, 'actions')
    }
  }

  installApp() {
    return chrome.webstore.install('https://chrome.google.com/webstore/detail/hhnllbiimihbjlmcfbbddfcmpgpeklfk', this.successInstall.bind(this), this.failureInstall.bind(this))
  }

  successInstall() {
    this.trackEvents('inlineInstall', 'actions')
  }

  failureInstall(e) {
    this.trackEvents('failureInstall', e)
  }

  trackEvents(value, type) {
    if (window._gaq) {
      _gaq.push(['_trackEvent', value, type])
    }
  }

  // gotToFooter(e) {
  //   e.preventDefault()
  //   $('html, body').animate({
  //     scrollTop: $('#footer').offset().top
  //   }, 800)
  // }
}

class uninstallCtrl {
  constructor(ngMeta) {
    ngMeta.setTitle('Ne pare rau pentru asta!')

    this.form = {
      reason: 'others',
      reasonMessage: '',
      submitted: false
    }
  }

  formSubmit(e) {
    e.preventDefault()
    this.trackEvents(this.form.reason == 'others' ? this.form.reasonMessage : this.form.reason, 'uninstallReason')
    this.form.submitted = true;
  }

  trackEvents(value, type) {
    if (window._gaq) {
      _gaq.push(['_trackEvent', value, type])
    }
  }
}

const radio = angular.module('radio', ['ngRoute', 'ngMeta', 'ngAnimate'])
radio.controller('mainCtrl', mainCtrl)
radio.controller('uninstallCtrl', uninstallCtrl)

radio.directive('radioPlayer', (ngMeta) => {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/templates/player.html',
    link(scope, elem, attrs) {
      // Number prototype for adding zero to time
      Number.prototype.pad = function (size) {
        var s = String(this);
        while (s.length < (size || 2)) {
          s = "0" + s;
        }
        return s;
      };

      // Default variables
      let self = this,
        panelBody = $(elem).find('.panel-body'),
        listeners = panelBody.find('span.listeners'),
        posts = panelBody.find('span.posts'),
        filter = panelBody.find('input[type=search]'),
        range = panelBody.find('input[type=range]'),
        playPauseButton = $(elem).find('button.play_pause'),
        radioTitle = $(elem).find('h5 > .radio-title'),
        showTime = $(elem).find('h5 > small'),
        btnRegion = $(elem).find('.btn-region button'),
        radioContainer = $(elem).find('#radio-list'),
        stationsLength = $(elem).find('span.stations-length'),
        configs = {
          serverName: '.',
          trackEvents: !!window._gaq
        }

      self.audio = document.createElement('audio')
      // self.audio.type = "audio/mpeg"

      playPauseButton.prop('disabled', true).text('play_arrow');
      radioTitle.text('Alege un radio din lista');
      showTime.text('');
      self.audio.volume = 0.6;
      range.val(self.audio.volume * 100)
      range.next('.volume').text(`${range.val()}%`);

      self.trackEvents = (value, type) => {
        if (configs.trackEvents) {
          _gaq.push(['_trackEvent', value, type])
        }
      }

      // Default play functions
      self.audioPlay = function () {
        panelBody.addClass('playing');
        playPauseButton.text('pause');
        // scope.$apply(() => ngMeta.setTitle(`Asculta ${self.currentRadio.name} non-stop!`))
        radioTitle.html(`<b>${self.currentRadio.name}</b>`);
        range.val(self.audio.volume * 100);
        range.next('.volume').text(`${range.val()}%`);
        self.trackEvents(self.currentRadio.name, 'played')
      };

      // Default pause function
      self.audioPause = function () {
        panelBody.removeClass('playing');
        playPauseButton.text('play_arrow');
      };

      // Default loading start function
      self.audioStartLoading = function () {
        panelBody.removeClass('playing');
        radioTitle.html(`Se incarca <b>${self.currentRadio.name}</b>`);
        playPauseButton.prop('disabled', true);
        showTime.text('');
        self.currentRadio.loading = true;
      };

      // Default loading end function
      self.audioEndLoading = function () {
        playPauseButton.prop('disabled', false);
        self.currentRadio.loading = false;
        // Clean filter value
        filter.val('');
        radioContainer.find('a').show();
        self.audio.play();
      };

      // Default timeupdate function
      self.audioTimeUpdate = function () {
        self.audio.hours = Math.floor((self.audio.currentTime / 60) / 60).pad();
        self.audio.minutes = Math.floor(self.audio.currentTime / 60).pad();
        self.audio.seconds = Math.floor(self.audio.currentTime - self.audio.minutes * 60).pad();
        showTime.text(`${self.audio.hours} : ${(self.audio.minutes - self.audio.hours * 60).pad()} : ${self.audio.seconds}`)
      };

      // Default buffering function
      self.audioBuffering = function () {
        panelBody.removeClass('playing');
        radioTitle.html(`Buffering <b>${self.currentRadio.name}</b>`)
      };

      // Operation for video, volume, pause, play, stop, etc.
      self.audioListeners = () => {
        // Start loading video
        $(self.audio).on('loadstart', self.audioStartLoading);
        // Start when data is loaded
        $(self.audio).on('loadeddata', self.audioEndLoading);
        // Make changes when player begin play
        $(self.audio).on('play', self.audioPlay);
        // Make changes when player is paused
        $(self.audio).on('pause', self.audioPause);
        // Progress video
        $(self.audio).on('timeupdate', self.audioTimeUpdate);
        // Start when video is buffering
        $(self.audio).on('waiting', self.audioBuffering)
      };

      // Filter listener
      filter.on('keyup', function () {
        var regex = new RegExp(this.value, 'ig');
        radioContainer.find('a').hide().filter(function () {
          return regex.test(this.text)
        }).show()
      }).dblclick(function () {
        this.select()
      });

      // Listen range and change volume
      range.on('input', function () {
        self.audio.volume = this.value / 100;
        $(this).next('.volume').text(`${this.value}%`)
      });

      // Fade in/out function
      self.fadeOutFadeIn = function (fOut, fIn, callback) {
        return fOut.fadeOut().promise().done(() => fIn.fadeIn(callback || ''))
      };

      self.autoScrollToPlayedRadio = () => {
        var radioActive = $("a.list-group-item.active");
        return radioActive.length && radioContainer.animate({
          scrollTop: radioActive.offset().top - (radioContainer.height() + 27)
        });
      };

      // Get radio list function
      self.getRadioList = function (region) {
        self.region = region;
        return $.getJSON(`${configs.serverName}/radiolist-${self.region}.json`);
      };

      self.getNameId = function (name) {
        return name.split(' ').join('-').toLowerCase().replace(/\(|\)/gi, '') + '-' + self.region;
      };

      // Player play/pause actions
      playPauseButton.click(function () {
        return self.audio[self.audio.paused ? 'play' : 'pause']();
      });

      // Get all radio and put into document
      self.setRadio = function (region) {
        region = region || self.region || 'md';
        btnRegion.removeClass('active').filter(function () {
          return $(this).hasClass(region)
        }).addClass('active');
        return self.getRadioList(region).then(function (radioList) {
          // Put list into global variable
          self.radioList = radioList;
          let list = '';
          stationsLength.text(`${radioList.length} statii total.`)
          // Generate dynamically list on html
          $.when($.each(radioList, function (k, v) {
            if (v.disable) return;
            // if (!self.radioKeys)
            //     self.listeners.push({ id: k, name: v.name, listeners: 0, nameId: self.getNameId(v.name) });
            self.radioList[k].nameId = self.getNameId(v.name);
            self.radioList[k].id = k;
            list += `<a href=# class="list-group-item" data-name="${self.getNameId(v.name)}" data-id=${k}>${v.name}<span class="badge" title="Ascultatori momentan" style="display: none"></span></a>`
          })).then(function () {
            // Put generated html on list container
            radioContainer.html(list).promise().done(function () {
              // Call video listeners
              self.audioListeners();
              self.trackEvents(region, 'region')

              // Change radio
              radioContainer.on('click', 'a', function (e) {
                e.preventDefault();
                // Verify if channel is not the same
                if (!$(this).hasClass('active')) {
                  // Make this channel active
                  $(this).parent().find('a').removeClass('active');
                  $(this).addClass('active');
                  // Change background global current radio
                  self.currentRadio = self.radioList[$(this).data('id')];
                  //self.currentRadio.id = $(this).data('id');
                  // Stop video for change channel
                  if (self.audio.src) self.audio.pause();
                  // Make current url in background url
                  self.audio.src = self.currentRadio.url;
                  // Load video after src is changed
                  self.audio.load();
                }
              })
            });
          })
        });
      };

      self.setRadio();
      btnRegion.on('click', function () {
        if ($(this).hasClass('active')) return self.autoScrollToPlayedRadio();
        return self.setRadio($(this).data('region'))
      });

      // Unload on radio play
      window.onbeforeunload = (e) => {
        if (!self.audio.paused) return 'Esti sigur ca vrei sa opresti radioul?'
      }
    }
  }
})

// Configs
radio.config(['$routeProvider', '$locationProvider', 'ngMetaProvider', ($routeProvider, $locationProvider, ngMetaProvider) => {
  $routeProvider.when('/', {
    templateUrl: './templates/home.html',
    controller: 'mainCtrl',
    controllerAs: 'main'
  // }).when('/install', {
  //   templateUrl: './templates/install.html',
  //   controller: 'installCtrl',
  //   controllerAs: 'install'
  }).when('/uninstall', {
    templateUrl: './templates/uninstall.html',
    controller: 'uninstallCtrl',
    controllerAs: 'uninstall'
  })
  $routeProvider.otherwise('/')
  $locationProvider.html5Mode(true)

  ngMetaProvider.useTitleSuffix(true)
  ngMetaProvider.setDefaultTitleSuffix(' | Radio online')
  // ngMetaProvider.setDefaultTag('author', 'Ion Prodan');
}])

radio.run(['ngMeta', (ngMeta) => {
  ngMeta.init()
  // Start vegas in background
  $("#example, body").vegas({
    slides: [
      {
        src: "/images/slider/bg-1.jpg"
      },
      {
        src: "/images/slider/bg-2.jpg"
      },
      {
        src: "https://images.alphacoders.com/453/thumb-1920-45373.jpg"
      },
      {
        src: "https://images3.alphacoders.com/587/thumb-1920-58757.jpg"
      },
      {
        src: "https://images2.alphacoders.com/222/thumb-1920-22.jpg"
      },
      {
        src: "https://images.alphacoders.com/554/thumb-1920-554935.jpg"
      },
      {
        src: "https://images2.alphacoders.com/701/thumb-1920-70172.jpg"
      },
      {
        src: "https://images.alphacoders.com/314/thumb-1920-31493.jpg"
      },
      {
        src: "https://images7.alphacoders.com/431/thumb-1920-431427.jpg"
      },
      {
        src: "https://images4.alphacoders.com/174/thumb-1920-174928.jpg"
      },
      {
        src: "https://images5.alphacoders.com/332/thumb-1920-332138.jpg"
      },
      {
        src: "https://images2.alphacoders.com/522/thumb-1920-522310.jpg"
      }
    ],
    overlay: '/images/08.png'
  });
}]);