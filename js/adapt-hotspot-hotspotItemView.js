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
        },

        postRender: function() {
            this.setReadyStatus();
            this.$el.addClass("hotspot-menu");
        },

        showDetails: function(event) {
            if(event) event.preventDefault();
            var $element = $(event.currentTarget);
            this.$(".menu-item-inner").addClass("show-item");
            Adapt.trigger("hotspotMenu:itemOpen", $element.attr("data-id"));
            // Audio
            if(Adapt.audio.audioClip[this.model.get('_audio')._channel].status==1){
                // Check if audio is set to autoplay
                if(this.model.get("_audio")._isEnabled && this.model.get("_audio")._autoplay){
                    Adapt.trigger('audio:playAudio', this.model.get("_audio")._media.src, this.model.get("_id"), this.model.get('_audio')._channel);
                }
            }
        },

        hideDetails: function(event) {
            if(event) event.preventDefault();
            this.$(".menu-item-inner").removeClass("show-item");
            if(this.model.get("_audio")._isEnabled){
                Adapt.trigger('audio:pauseAudio', this.model.get('_audio')._channel);
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
