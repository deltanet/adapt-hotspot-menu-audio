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

      this.startWidth = this.$('.hotspotmenu-container__image').outerWidth();
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
      var menuWidth = this.$('.hotspotmenu-container__image').outerWidth();
      var menuHeight = this.$('.hotspotmenu-container__inner').outerHeight();

      var navigationHeight = $('.nav').outerHeight();
      var headerHeight = this.$('.menu__header').outerHeight();

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
