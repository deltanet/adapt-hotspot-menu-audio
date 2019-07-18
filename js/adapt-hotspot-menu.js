define(function(require) {

    var Backbone = require('backbone');
    var Adapt = require('core/js/adapt');
    var MenuView = require('core/js/views/menuView');
    var HotspotView = require("menu/adapt-hotspot-menu-audio/js/adapt-hotspot-hotspotView");

    Adapt.on('router:menu', function(model) {

        $('#wrapper').append(new HotspotView({model:model}).$el);

    });

});
