define([
    'core/js/adapt',
    'core/js/views/menuView'
], function(Adapt, MenuView) {

    var HotspotItemView = MenuView.extend({

        events: {
            "click .menu-item-hotspot":"showDetails",
            "click .menu-item-graphic-button":"showDetails",
            "click .menu-item-done":"hideDetails",
            'click .menu-item-button button' : 'onClickMenuItemButton'
        },

        className: function() {
            return [
                'menu-item',
                'menu-item-' + this.model.get('_id') ,
                this.model.get('_classes'),
                this.model.get('_isVisited') ? 'visited' : '',
                this.model.get('_isComplete') ? 'completed' : '',
                this.model.get('_isLocked') ? 'locked' : ''
            ].join(' ');
        },

        preRender: function() {
          this.listenTo(Adapt, "hotspotMenu:itemOpen", this.checkIfShouldClose);
          this.listenTo(Adapt, "device:changed", this.deviceChanged);

          this.model.checkCompletionStatus();
          this.model.checkInteractionCompletionStatus();

          if (this.model.get('_isComplete')) {
            this.model.set('_isVisited', true);
          } else {
            this.setVisitedIfAnyComponentsComplete();
          }

          this.type = this.model.get('_hotspotMenuAudio')._hotspotMenuItem._type;

          if (this.type == "graphic") {
            this.model.set('_graphicEnabled', true);
          }

          this.disableAnimation = Adapt.config.has('_disableAnimation') ? Adapt.config.get('_disableAnimation') : false;
        },

        postRender: function() {
            this.setReadyStatus();
            this.isPopupOpen = false;

            // Check for button type
            switch (this.type) {
              case "text":
                this.$(".menu-item-hotspot").addClass("title-enabled");
                this.$(".menu-item-hotspot").html(this.model.get('_hotspotMenuAudio')._hotspotMenuItem.text);
                break;
              case "number":
                this.$(".menu-item-hotspot").addClass("number-enabled");
                this.$(".menu-item-hotspot").html(this.model.get('_hotspotMenuAudio')._hotspotMenuItem.number);
                break;
              case "icon":
                this.$(".menu-item-hotspot").addClass("icon-enabled icon "+this.model.get('_hotspotMenuAudio')._hotspotMenuItem._icon);
                break;
              case "custom":
                this.$(".menu-item-hotspot").addClass("icon-enabled icon "+this.model.get('_hotspotMenuAudio')._hotspotMenuItem._custom);
                break;
            }

            this.deviceChanged();
        },

        setVisitedIfAnyComponentsComplete: function() {
          var completedComponents = this.model.findDescendantModels('components', {
            where: {
              _isComplete: true,
              _isOptional: false
            }
          });

          if (completedComponents.length > 0) {
            this.model.set('_isVisited', true);
          }
        },

        showDetails: function(event) {
            if(event) event.preventDefault();

            if(this.model.get('_hotspotMenuAudio')._bypassPopup) {
              this.onClickMenuItemButton();
            } else {
              this.isPopupOpen = true;
              var $element = $(event.currentTarget);

              if (this.disableAnimation) {
                  this.$('.menu-item-overlay').css("display", "block");
                  this.$(".menu-item-inner").addClass("show-item");
              } else {
                  this.$('.menu-item-overlay').velocity({ opacity: 0 }, {duration:0}).velocity({ opacity: 1 }, {duration:400, begin: _.bind(function() {
                    this.$('.menu-item-overlay').css("display", "block");
                  }, this)});
                  this.$('.menu-item-inner').velocity({ opacity: 0 }, {duration:0}).velocity({ opacity: 1 }, {duration:400, begin: _.bind(function() {
                    this.$(".menu-item-inner").addClass("show-item");
                  }, this)});
              }

              Adapt.trigger("hotspotMenu:itemOpen", $element.attr("data-id"));
              // Audio
              if(Adapt.audio.audioClip[this.model.get('_hotspotMenuAudio')._audio._channel].status==1){
                  // Check if audio is set to autoplay
                  if(this.model.get("_hotspotMenuAudio")._audio._isEnabled && this.model.get("_hotspotMenuAudio")._audio._autoplay){
                      Adapt.trigger('audio:playAudio', this.model.get("_hotspotMenuAudio")._audio._media.src, this.model.get("_id"), this.model.get('_hotspotMenuAudio')._audio._channel);
                  }
              }
              Adapt.trigger('popup:opened', this.$('.menu-item-inner'));
              this.$('.menu-item-title-inner').a11y_focus();
              this.$('.menu-item-overlay').on('click', _.bind(this.hideDetails, this));
            }
        },

        hideDetails: function(event) {
            if(event) event.preventDefault();
            this.isPopupOpen = false;
            this.$(".menu-item-inner").removeClass("show-item");
            if(this.model.get("_hotspotMenuAudio")._audio._isEnabled){
                Adapt.trigger('audio:pauseAudio', this.model.get('_hotspotMenuAudio')._audio._channel);
            }
            if (this.disableAnimation) {
                this.$('.menu-item-overlay').css("display", "none");
            } else {
                this.$('.menu-item-overlay').velocity({ opacity: 0 }, {duration:400, complete:_.bind(function() {
                  this.$('.menu-item-overlay').css("display", "none");
                }, this)});
            }
            this.$('.menu-item-overlay').off('click');
            Adapt.trigger('popup:closed', this.$('.menu-item-inner'));
        },

        checkIfShouldClose: function(id) {
            if(this.model.get("_id") != id) {
                this.hideDetails();
            }
        },

        onClickMenuItemButton: function(event) {
            if(event && event.preventDefault) event.preventDefault();
            if(this.model.get('_isLocked')) return;

            this.hideDetails();
            Backbone.history.navigate('#/id/' + this.model.get('_id'), {trigger: true});
        },

        deviceChanged: function() {
          if (Adapt.device.screenSize === 'large') {
            this.$('.menu-item-hotspot').css({
              "top": this.model.get('_hotspotMenuAudio')._hotspotMenuItem._position._top+'%',
              "left": this.model.get('_hotspotMenuAudio')._hotspotMenuItem._position._left+'%'
            });
            this.$('.menu-item-graphic-button').css({
              "top": this.model.get('_hotspotMenuAudio')._hotspotMenuItem._position._top+'%',
              "left": this.model.get('_hotspotMenuAudio')._hotspotMenuItem._position._left+'%'
            });
          } else {
            this.$('.menu-item-hotspot').css({
              "top": "",
              "left": ""
            });
            this.$('.menu-item-graphic-button').css({
              "top": "",
              "left": ""
            });
          }
        }

    }, {
        template:'hotspot-menu-item'
    });

    return HotspotItemView;

});
