(function (factory, window) {

    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);

    // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }

    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.MapCommentTool = factory(L);
    }
}(function (L) {
    var MapCommentTool = {
    };

    MapCommentTool.options = {
        position: 'right',
    }

    // implement your plugin
    MapCommentTool.getMessage = function() {
    	return 'Map Comment Tool';
    }

    MapCommentTool.addTo = function(map) {
        var self = this;

        var visibileClass = (self.ControlBar.isVisible()) ? 'visible' : '';

        // Create sidebar container
        var container = self.ControlBar._container =
            L.DomUtil.create('div', 'leaflet-control-bar-'+self.options.position+' leaflet-control-bar ' + visibileClass);
        var content = self.ControlBar._contentContainer;

        L.DomEvent
            .on(container, 'transitionend',
            self.ControlBar._handleTransitionEvent, self)
            .on(container, 'webkitTransitionEnd',
            self.ControlBar._handleTransitionEvent, self);

        var controlContainer = map._controlContainer;
        controlContainer.insertBefore(container, controlContainer.firstChild);

        self._map = map;

        map.MapCommentTool = MapCommentTool;


    }

    MapCommentTool.ControlBar = {
        visible: false,
        isVisible: function() {
            var self = this;
            return self.visible;
        },
        show: function() {
            var self = this;
            self.visible = true;

            L.DomUtil.addClass(self._container, 'visible');

            var controls = document.getElementsByClassName("leaflet-control leaflet-bar");
            for (var i = 0; i < controls.length; i++) {
                controls[i].style.visibility='hidden';
            }

            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            if (map.tap) map.tap.disable();
            document.getElementById('map').style.cursor='default';
            
            // on success, should return true
            return true;
        },
        hide: function(e) {
            var self = this;
            self.visible = false;
            
            L.DomUtil.removeClass(self._container, 'visible');
            var controls = document.getElementsByClassName("leaflet-control leaflet-bar");
            for (var i = 0; i < controls.length; i++) {
                controls[i].style.visibility='visible';
            }
            if(e) {
                L.DomEvent.stopPropagation(e);
            }
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            if (map.tap) map.tap.enable();
            document.getElementById('map').style.cursor='grab';
            // on success, should return true
            return true;
        },
        toggle: function() {
            var self = this;
            
            var toggleSuccess = self.isVisible() ? self.hide() : self.show();

            return toggleSuccess;
        },

        _handleTransitionEvent: function (e) {
            var self = this;
            //if (e.propertyName == 'left' || e.propertyName == 'right' ||e.propertyName == 'bottom' || e.propertyName == 'top')
                //self.fire(self.ControlBar.isVisible() ? 'shown' : 'hidden');
        }

    }

    // return your plugin when you are done
    return MapCommentTool;
}, window));