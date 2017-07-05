define(function(require) {

    var Backbone = require('backbone');
    var Adapt = require('coreJS/adapt');
    var MenuView = require('coreViews/menuView');

    var HotspotItemView = MenuView.extend({

        events: {
            "click .menu-item-hotspot":"showDetails",
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
            if (!this.model.get('_isVisited')) {
              this.setVisitedIfBlocksComplete();
            }
            this.type = this.model.get('_hotspotMenuAudio')._hotspotMenuItem._type;

            this.disableAnimation = Adapt.config.has('_disableAnimation') ? Adapt.config.get('_disableAnimation') : false;
        },

        postRender: function() {
            this.setReadyStatus();
            this.$el.addClass("hotspot-menu");

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
        },

        setVisitedIfBlocksComplete: function() {
            var completedBlock = this.model.findDescendants('components').findWhere({_isComplete: true, _isOptional: false});
            if (completedBlock != undefined) {
                this.model.set('_isVisited', true);
            }
        },

        showDetails: function(event) {
            if(event) event.preventDefault();
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
        },

        hideDetails: function(event) {
            if(event) event.preventDefault();
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
        },

        checkIfShouldClose: function(id) {
            if(this.model.get("_id") != id) {
                this.hideDetails();
            }
        },

        onClickMenuItemButton: function(event) {
            if(event && event.preventDefault) event.preventDefault();
            if(this.model.get('_isLocked')) return;
            Backbone.history.navigate('#/id/' + this.model.get('_id'), {trigger: true});
        }

    }, {
        template:'hotspot-menu-item'
    });

    return HotspotItemView;

});
