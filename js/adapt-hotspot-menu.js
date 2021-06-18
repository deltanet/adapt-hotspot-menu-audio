define([
  'core/js/adapt',
  'core/js/views/menuView',
  './adapt-hotspot-hotspotItemView'
], function(Adapt, MenuView, HotspotItemView) {

  var HotspotView = MenuView.extend({

    className: function() {
      return MenuView.prototype.className.apply(this) + ' hotspotmenu';
    },

    attributes: function() {
      return MenuView.prototype.resultExtend('attributes', {
        'role': 'main',
        'aria-labelledby': this.model.get('_id') + '-heading'
      }, this);
    },

    events: {
      'click .js-audio-toggle': 'toggleAudio'
    },

    postRender: function() {
      var nthChild = 0;
      this.model.getChildren().each(function(item) {
        if (item.get('_isAvailable') && !item.get('_isHidden')) {
          item.set('_nthChild', ++nthChild);
          this.$('.js-children').append(new HotspotItemView({
            model: item
          }).$el);
        }

        if (item.get('_isHidden')) {
          item.set('_isReady', true);
        }
      });

      this.listenTo(Adapt, 'device:changed', this.deviceChanged);
      this.listenTo(Adapt, 'menuView:ready device:resize', this.deviceResize);
      this.listenToOnce(Adapt, 'remove', this.removeListeners);

      this.deviceChanged();

      this.$('.hotspotmenu-container__inner').imageready(function() {
        this.deviceResize();
      }.bind(this));

      if (Adapt.audio && this.model.get('_hotspotMenuAudio')._audio && this.model.get('_hotspotMenuAudio')._audio._isEnabled) {
        this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
        this.setupAudio();
      }

      this.startWidth = this.$('.hotspotmenu-container__image').outerWidth();
    },

    setupAudio: function() {
      this.audioChannel = this.model.get('_hotspotMenuAudio')._audio._channel;
      this.elementId = this.model.get('_id');
      this.audioFile = this.model.get('_hotspotMenuAudio')._audio._media.src;
      Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;
      this.audioIcon = Adapt.audio.iconPlay;
      this.pausedTime = '';

      // Autoplay
      if (Adapt.audio.autoPlayGlobal || this.model.get('_hotspotMenuAudio')._audio._autoplay){
        this.canAutoplay = true;
      } else {
        this.canAutoplay = false;
      }

      // Add audio icon
      this.$('.audio__controls-icon').addClass(this.audioIcon);

      // Hide controls if set in JSON or if audio is turned off
      if (this.model.get('_hotspotMenuAudio')._audio._showControls==false || Adapt.audio.audioClip[this.audioChannel].status==0){
        this.$('.audio__controls').addClass('is-hidden');
      }

      // Set listener for when clip ends
      $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));

      // Play audio if autoplay is true
      if (this.canAutoplay) {
        // Check if audio is set to on
        if (Adapt.audio.audioClip[this.audioChannel].status==1){
          Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
        }
      }
    },

    onAudioEnded: function() {
      Adapt.trigger('audio:audioEnded', this.audioChannel);
    },

    toggleAudio: function(event) {
      if (event) event.preventDefault();

      Adapt.audio.audioClip[this.audioChannel].onscreenID = '';

      if ($(event.currentTarget).hasClass('playing')) {
        this.pauseAudio();
      } else {
        this.playAudio();
      }
    },

    playAudio: function () {
      if (Adapt.audio.pauseStopAction == 'pause') {
        Adapt.audio.audioClip[this.audioChannel].play(this.pausedTime);
        this.$('.audio__controls-icon').removeClass(Adapt.audio.iconPlay);
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconPause);
        this.$('.audio__controls').addClass('playing');
      } else {
        Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
      }
    },

    pauseAudio: function () {
      if (Adapt.audio.pauseStopAction == 'pause') {
        this.pausedTime = Adapt.audio.audioClip[this.audioChannel].currentTime;
        Adapt.audio.audioClip[this.audioChannel].pause();
        this.$('.audio__controls-icon').removeClass(Adapt.audio.iconPause);
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconPlay);
        this.$('.audio__controls').removeClass('playing');
      } else {
        Adapt.trigger('audio:pauseAudio', this.audioChannel);
      }
    },

    updateToggle: function(){
      if (Adapt.audio.audioStatus == 1 && this.model.get('_hotspotMenuAudio')._audio._showControls==true){
        this.$('.audio__controls').removeClass('is-hidden');
      } else {
        this.$('.audio__controls').addClass('is-hidden');
      }
    },

    deviceChanged: function() {
      this.$('.menu-item__overlay').css('display', 'none');
      if (Adapt.device.screenSize === 'large') {
        this.$('.menu-item__inner').removeClass('show-item');
        if (this.model.get('_hotspotMenuAudio').instruction !== '') {
          this.$('.menu__instruction-inner').html(this.model.get('_hotspotMenuAudio').instruction);
        }
      } else {
        if (this.model.get('_hotspotMenuAudio').instructionMobile !== '') {
          this.$('.menu__instruction-inner').html(this.model.get('_hotspotMenuAudio').instructionMobile);
        }
      }
    },

    deviceResize: function() {
      var windowHeight = $(window).height();
      var navigationHeight = $('.nav').outerHeight();
      var headerHeight = this.$('.menu__header').outerHeight() ? this.$('.menu__header').outerHeight() : 0;

      var menuWidth = this.$('.hotspotmenu-container').outerWidth();
      var menuHeight = windowHeight - (navigationHeight + headerHeight);

      var decrease = this.startWidth - menuWidth;
      var percentageChanged = Math.round((decrease / this.startWidth) * 100);
      var newSize = 100 - percentageChanged;

      this.$('.hotspotmenu-container__image').css({
        'height': menuHeight,
        'width': menuWidth
      });

      if (Adapt.device.screenSize === 'large') {
        this.$('.js-children').css({
          'height': menuHeight,
          'top': navigationHeight + headerHeight,
          'width': menuWidth
        });
      } else {
        this.$('.js-children').css({
          'height': '',
          'top': '',
          'width': ''
        });
      }

      this.$('.menu-item-graphic-button img').css({
        'max-width': newSize + '%',
        'max-height': newSize + '%'
      });
    },

    removeListeners: function() {
      this.stopListening(Adapt, 'device:changed', this.deviceChanged);
      this.stopListening(Adapt, 'device:resize', this.deviceResize);

      if (Adapt.audio && this.model.get('_hotspotMenuAudio')._audio && this.model.get('_hotspotMenuAudio')._audio._isEnabled) {
        Adapt.trigger('audio:pauseAudio', this.audioChannel);
      }
    }

  }, {
    template: 'hotspotView'
  });

  Adapt.on('router:menu', function(model) {
    $('#wrapper').append(new HotspotView({
      model: model
    }).$el);
  });

});
