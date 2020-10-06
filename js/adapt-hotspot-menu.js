define([
  'core/js/adapt',
  'core/js/views/menuView',
  './adapt-hotspot-hotspotItemView'
], function(Adapt, MenuView, HotspotItemView) {

  var HotspotView = MenuView.extend({

    className: function() {
      return MenuView.prototype.className.apply(this) + ' hotspot-menu';
    },

    attributes: function() {
      return MenuView.prototype.resultExtend('attributes', {
        'role': 'main',
        'aria-labelledby': this.model.get('_id') + '-heading'
      }, this);
    },

    events: {
      'click .audio-toggle': 'toggleAudio'
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

      this.deviceChanged();

      this.$('.hotspot-container-inner').imageready(function() {
        this.deviceResize();
      }.bind(this));

      if (this.model.get('_hotspotMenuAudio')._audio && this.model.get('_hotspotMenuAudio')._audio._isEnabled) {
        this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
        this.listenToOnce(Adapt, 'remove', this.removeListeners);
        this.setupAudio();
      }

      this.startWidth = this.$('.hotspot-container-image').outerWidth();
    },

    setupAudio: function() {
      this.audioChannel = this.model.get('_hotspotMenuAudio')._audio._channel;
      this.elementId = this.model.get('_id');
      this.audioFile = this.model.get('_hotspotMenuAudio')._audio._media.src;
      Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;
      this.audioIcon = Adapt.audio.iconPlay;
      this.pausedTime = '';

      // Autoplay
      if (Adapt.audio.autoPlayGlobal || this.model.get('_hotspotMenuAudio')._audio._autoplay) {
        this.canAutoplay = true;
      } else {
        this.canAutoplay = false;
      }

      // Add audio icon
      this.$('.audio-toggle').addClass(this.audioIcon);

      // Hide controls if set in JSON or if audio is turned off
      if (this.model.get('_hotspotMenuAudio')._audio._showControls == false || Adapt.audio.audioClip[this.audioChannel].status == 0) {
        this.$('.audio-inner button').hide();
      }

      // Set listener for when clip ends
      $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));

      // Play audio if autoplay is true
      if (this.canAutoplay) {
        // Check if audio is set to on
        if (Adapt.audio.audioClip[this.audioChannel].status == 1) {
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

    playAudio: function() {
      if (Adapt.audio.pauseStopAction == 'pause') {
        Adapt.audio.audioClip[this.audioChannel].play(this.pausedTime);
        this.$('.audio-toggle').removeClass(Adapt.audio.iconPlay);
        this.$('.audio-toggle').addClass(Adapt.audio.iconPause);
        this.$('.audio-toggle').addClass('playing');
      } else {
        Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
      }
    },

    pauseAudio: function() {
      if (Adapt.audio.pauseStopAction == 'pause') {
        this.pausedTime = Adapt.audio.audioClip[this.audioChannel].currentTime;
        Adapt.audio.audioClip[this.audioChannel].pause();
        this.$('.audio-toggle').removeClass(Adapt.audio.iconPause);
        this.$('.audio-toggle').addClass(Adapt.audio.iconPlay);
        this.$('.audio-toggle').removeClass('playing');
      } else {
        Adapt.trigger('audio:pauseAudio', this.audioChannel);
      }
    },

    updateToggle: function() {
      if (Adapt.audio.audioStatus == 1 && this.model.get('_hotspotMenuAudio')._audio._showControls == true) {
        this.$('.audio-toggle').removeClass('hidden');
      } else {
        this.$('.audio-toggle').addClass('hidden');
      }
    },

    deviceChanged: function() {
      this.$('.menu-item-overlay').css('display', 'none');
      if (Adapt.device.screenSize === 'large') {
        this.$('.menu-item-inner').removeClass('show-item');
        if (this.model.get('_hotspotMenuAudio').instruction !== '') {
          this.$('.menu-instruction-inner').html(this.model.get('_hotspotMenuAudio').instruction);
        }
      } else {
        if (this.model.get('_hotspotMenuAudio').instructionMobile !== '') {
          this.$('.menu-instruction-inner').html(this.model.get('_hotspotMenuAudio').instructionMobile);
        }
      }
    },

    deviceResize: function() {
      var menuWidth = this.$('.hotspot-container-image').outerWidth();
      var menuHeight = this.$('.hotspot-container-inner').outerHeight();

      var navigationHeight = $('.nav').outerHeight();
      var headerHeight = this.$('.menu-header').outerHeight();

      var decrease = this.startWidth - menuWidth;
      var percentageChanged = Math.round((decrease / this.startWidth) * 100);
      var newSize = 100 - percentageChanged;

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
      Adapt.trigger('audio:pauseAudio', this.audioChannel);
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
