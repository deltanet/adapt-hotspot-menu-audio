define([
  'core/js/adapt',
  'core/js/views/menuItemView'
], function(Adapt, MenuItemView) {

  var HotspotItemView = MenuItemView.extend({

    events: {
      'click .js-hotspotmenu-hotspot-btn':'showDetails',
      'click .js-hotspotmenu-close-btn':'hideDetails',
      'click .js-btn-click' : 'onClickMenuItemButton'
    },

    preRender: function() {
      this.listenTo(Adapt, {
        'device:changed': this.deviceChanged,
        'hotspotMenu:itemOpen': this.checkIfShouldClose
      });

      if (!this.model.get('_isVisited')) {
        this.setVisitedIfBlocksComplete();
      }
      this.type = this.model.get('_hotspotMenuAudio')._hotspotMenuItem._type;

      if (this.type == 'graphic') {
        this.model.set('_graphicEnabled', true);
      }

      this.disableAnimation = Adapt.config.has('_disableAnimation') ? Adapt.config.get('_disableAnimation') : false;
    },

    postRender: function() {
      this.setReadyStatus();
      this.isPopupOpen = false;

      // Check for button type
      switch (this.type) {
        case 'text':
          this.$('.hotspotmenu-item__hotspot').addClass('title-enabled');
          this.$('.hotspotmenu-item__hotspot').html(this.model.get('_hotspotMenuAudio')._hotspotMenuItem.text);
          break;
        case 'number':
          this.$('.hotspotmenu-item__hotspot').addClass('number-enabled');
          this.$('.hotspotmenu-item__hotspot').html(this.model.get('_hotspotMenuAudio')._hotspotMenuItem.number);
          break;
        case 'icon':
          this.$('.hotspotmenu-item__hotspot').addClass('icon-enabled icon '+this.model.get('_hotspotMenuAudio')._hotspotMenuItem._icon);
          break;
        case 'custom':
          this.$('.hotspotmenu-item__hotspot').addClass('icon-enabled icon '+this.model.get('_hotspotMenuAudio')._hotspotMenuItem._custom);
          break;
      }

      this.deviceChanged();
    },

    setVisitedIfBlocksComplete: function() {
      var completedBlock = _.findWhere(this.model.findDescendantModels('components'), {_isComplete: true, _isOptional: false});
      if (completedBlock != undefined) {
        this.model.set('_isVisited', true);
      }
    },

    showDetails: function(event) {
      if (event) event.preventDefault();

      if (this.model.get('_hotspotMenuAudio')._bypassPopup) {
        this.onClickMenuItemButton();
      } else {
        this.isPopupOpen = true;
        var $element = $(event.currentTarget);

        if (this.disableAnimation) {
          this.$('.hotspotmenu-item__overlay').css('display', 'block');
          this.$('.hotspotmenu-item__inner').addClass('show-item');
        } else {
          this.$('.hotspotmenu-item__overlay').velocity({ opacity: 0 }, {duration:0}).velocity({ opacity: 1 }, {duration:400, begin: _.bind(function() {
            this.$('.hotspotmenu-item__overlay').css('display', 'block');
          }, this)});

          this.$('.hotspotmenu-item__inner').velocity({ opacity: 0 }, {duration:0}).velocity({ opacity: 1 }, {duration:400, begin: _.bind(function() {
            this.$('.hotspotmenu-item__inner').addClass('show-item');
          }, this)});
        }

        Adapt.trigger('hotspotMenu:itemOpen', $element.attr('data-id'));
        // Audio
        if (Adapt.audio && Adapt.audio.audioClip[this.model.get('_hotspotMenuAudio')._audio._channel].status==1){
          // Check if audio is set to autoplay
          if (this.model.get('_hotspotMenuAudio')._audio._isEnabled && this.model.get('_hotspotMenuAudio')._audio._autoplay){
            Adapt.trigger('audio:playAudio', this.model.get('_hotspotMenuAudio')._audio._media.src, this.model.get('_id'), this.model.get('_hotspotMenuAudio')._audio._channel);
          }
        }

        Adapt.trigger('popup:opened', this.$('.hotspotmenu-item__inner'));
        Adapt.a11y.focusFirst($('.hotspotmenu-item__title-inner'));
        this.$('.hotspotmenu-item__overlay').on('click', _.bind(this.hideDetails, this));
      }
    },

    hideDetails: function(event) {
      if (event) event.preventDefault();

      this.isPopupOpen = false;
      this.$('.hotspotmenu-item__inner').removeClass('show-item');

      if (this.model.get('_hotspotMenuAudio')._audio._isEnabled){
        Adapt.trigger('audio:pauseAudio', this.model.get('_hotspotMenuAudio')._audio._channel);
      }

      if (this.disableAnimation) {
        this.$('.hotspotmenu-item__overlay').css('display', 'none');
      } else {
        this.$('.hotspotmenu-item__overlay').velocity({ opacity: 0 }, {duration:400, complete:_.bind(function() {
          this.$('.hotspotmenu-item__overlay').css('display', 'none');
        }, this)});
      }

      this.$('.hotspotmenu-item__overlay').off('click');
      Adapt.trigger('popup:closed', this.$('.hotspotmenu-item__inner'));
    },

    checkIfShouldClose: function(id) {
      if (this.model.get('_id') != id) {
        this.hideDetails();
      }
    },

    onClickMenuItemButton: function(event) {
      if (event && event.preventDefault) event.preventDefault();
      if (this.model.get('_isLocked')) return;

      this.hideDetails();
      Backbone.history.navigate('#/id/' + this.model.get('_id'), {trigger: true});
    },

    deviceChanged: function() {
      if (Adapt.device.screenSize === 'large') {
        this.$('.hotspotmenu-item__hotspot').css({
          'top': this.model.get('_hotspotMenuAudio')._hotspotMenuItem._position._top+'%',
          'left': this.model.get('_hotspotMenuAudio')._hotspotMenuItem._position._left+'%'
        });

        this.$('.hotspotmenu-item__graphic-button').css({
          'top': this.model.get('_hotspotMenuAudio')._hotspotMenuItem._position._top+'%',
          'left': this.model.get('_hotspotMenuAudio')._hotspotMenuItem._position._left+'%'
        });

      } else {
        this.$('.hotspotmenu-item__hotspot').css({
          'top': '',
          'left': ''
        });

        this.$('.hotspotmenu-item__graphic-button').css({
          'top': '',
          'left': ''
        });
      }
    }

  }, {
    className: 'hotspotmenu-item',
    template:'hotspot-menu-item'
  });

  return HotspotItemView;

});
