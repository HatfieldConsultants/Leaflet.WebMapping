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
        options: {

        },

        getMessage: function() {
            return 'Map Comment Tool';
        },

        addTo: function(map) {
            var self = this;
            self.currentMode = 'map';
            var customControl = L.Control.extend({

                options: {
                position: 'topleft' 
                //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
                },

                onAdd: function (map) {
                    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

                    container.style.backgroundColor = 'white';
                    container.style.width = '40px';
                    container.style.height = '40px';
                    container.style.cursor = 'pointer';
                    container.innerHTML = '<img src=pencil.png class="panel-control-icon">'; // this is temporary...
                    container.onclick = function(){
                        self.ControlBar.toggle();
                    };

                    return container;
                },
            });
            map.addControl(new customControl());

            var visibileClass = (self.ControlBar.isVisible()) ? 'visible' : '';

            // decide control bar position

            self.ControlBar.options.position = (window.innerHeight < window.innerWidth) ? 'right' : 'bottom';

            // Create sidebar container
            var container = self.ControlBar._container =
                L.DomUtil.create('div', 'leaflet-control-bar-'+self.ControlBar.options.position+' leaflet-control-bar ' 
                    + visibileClass);
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
        },

        startDrawingMode: function(comment) {
            var self = this;
            // spawn a drawing canvas
            self.drawingCanvas = L.canvas({padding: 0});
            self.drawingCanvas.addTo(map);

            // set mode to "drawing"
            self.currentMode = 'drawing';
            // set toolbar view to "drawing"
            self.ControlBar.currentView = self.ControlBar.displayControl('drawing', comment.id);

        },

        stopDrawingMode: function() {
            var self = this;
            self.drawingCanvas.removeFrom(map);
            delete self.drawingCanvas;

            // set mode to "drawing"
            self.currentMode = 'controlBarHome';
            // set toolbar view to "drawing"
            self.ControlBar.currentView = self.ControlBar.displayControl('home');


        }
    };


    MapCommentTool.ControlBar = {

        options: {
            position: 'right',
        },
        
        visible: false,
        currentView: '',

        isVisible: function() {
            var self = this;
            return self.visible;
        },
        show: function() {
            var self = this;

            window.map.MapCommentTool.currentMode = 'controlBarHome';

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
            if (map.tap) {
                map.tap.disable();
            }
            document.getElementById('map').style.cursor='default';

            self.currentView = self.displayControl('home');

            // on success, should return true
            return true;
        },
        hide: function(e) {
            var self = this;

            window.map.MapCommentTool.currentMode = 'map';

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
            if (map.tap) {
                map.tap.enable();
            }
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
        },

        displayControl: function(mode, commentId) {
            var self = this;
            // clear the display
            L.DomUtil.empty(self._container);

            switch (mode) {
                case 'home':
                    self.homeView();
                    break;
                case 'drawing':
                    self.drawingView(commentId);
                    break;
                default:

            }

            return mode;
            //
        },

        homeView: function() {
            var self = this;
            var homeView = L.DomUtil.create('div', 'controlbar-view controlbar-home', self._container);
            var closeButton = L.DomUtil.create('button', 'controlbar-button controlbar-close', homeView);
            closeButton.onclick = function() {
                self.hide();
            };
            var br = L.DomUtil.create('br', '', homeView);
            var newCommentButton = L.DomUtil.create('button', 'controlbar-button controlbar-new', homeView);
            newCommentButton.innerHTML = "New Comment";
            newCommentButton.onclick = function() {
                return self.startNewComment(); 
            };

        },

        drawingView: function(commentId) {
            var self = this;
            var drawingView = L.DomUtil.create('div', 'controlbar-view controlbar-home', self._container);
            var br = L.DomUtil.create('br', '', drawingView);
            var saveDrawingButton = L.DomUtil.create('button', 'controlbar-button controlbar-save', drawingView);
            saveDrawingButton.innerHTML = "Save";
            saveDrawingButton.onclick = function() {
                self.saveDrawing(commentId); 
            };
            var cancelDrawingButton = L.DomUtil.create('button', 'controlbar-button controlbar-cancel', drawingView);
            cancelDrawingButton.innerHTML = "Cancel";
            cancelDrawingButton.onclick = function() {
                self.cancelDrawing(commentId); 
            };

        },

        startNewComment: function() {
            var self = this;

            // create new comment
            var newComment = window.map.MapCommentTool.Comments.newComment();

            // trigger drawing mode
            window.map.MapCommentTool.startDrawingMode(newComment);

            return newComment;
        },

        saveDrawing: function(commentId) {
            var commentIndex = window.map.MapCommentTool.Comments.list.findIndex(function (comment) {
                        return comment.id === commentId;
            });
            window.map.MapCommentTool.Comments.list[commentIndex].saveState = true;

            //... more complicated saving logic ...

            window.map.MapCommentTool.stopDrawingMode();
            return true;
        },

        cancelDrawing: function(commentId) {
            var commentIndex = window.map.MapCommentTool.Comments.list.findIndex(function (comment) {
                        return comment.id === commentId;
            });
            var comment = window.map.MapCommentTool.Comments.list[commentIndex];
            if (!comment.saveState) {
                window.map.MapCommentTool.Comments.list.pop();
            }
            else {
                // throw out changes...
            }
            window.map.MapCommentTool.stopDrawingMode();
            return true;
        }

    };

    
    MapCommentTool.Comments = { 
        
        list: [],

        saved: function(comment) {
            var self = this;
            return comment.saveState;
        },

        newComment: function() {
            var self = this;
            var comment = L.layerGroup();
            comment.saveState = false;

            comment.id = window.map.MapCommentTool.Util.generateGUID();

            self.list.push(comment);
            return comment;
        }

    };

    MapCommentTool.Util = {

        generateGUID: function() {            
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

    };


    // return your plugin when you are done
    return MapCommentTool;
}, window));