//
//create closure
//
(function($){
  
  var element; //container element (jQuery object), used to append canvas element(s)
  var offset; //set with top_canvas.offset() each time window is resized
  var brush;

  $.fn.sketchyPad = function(options){
      
       //options override defaults
       $.sketchyPad.opts = $.extend({}, $.sketchyPad.defaults, options);       
       //restore or set color, brushsize, opacity 
       $.sketchyPad.initLocalStorage();
       
       element = this;
       //add some stylings required by sketchyPad
       $.sketchyPad.injectCSS();
 
       $.sketchyPad.createCanvas();

       $.sketchyPad.opts.topCanvas = $('#top');
       
       offset = element.offset();
  
       $.sketchyPad.setBrush($.sketchyPad.opts.brushType);

       $.sketchyPad.registerEvents();
             
       return element;

  }; //end fn.sketchyPad function


    //overridable static functions 
  $.sketchyPad = {
    
    //default settings
    defaults : {
       width: 600,
       height: 600,
       styleSheetPath: 'sketchyPad.css',
       brushSize: 1,
       opacity: 0.9,
       color: '#FF00FF',
       brushType: "Simple",
       currentPoint: undefined,
       topCanvas: undefined
    },
    
    //options
    opts: {},

    injectCSS: function() {
        $('head').append('<link rel="stylesheet" href="' + $.sketchyPad.opts.styleSheetPath + '" type="text/css" />');
    },
    
    createCanvas: function() {

       /*
       TODO support multiple layers
        */

       element.append("<canvas id='layer1' class='sketchypad_sketch_layer' width='"+$.sketchyPad.opts.width+"' height='"+$.sketchyPad.opts.height+"'>Your browser does not support canvas</canvas>")

       element.append("<canvas id='top' class='sketchypad_sketch_layer' width='"+$.sketchyPad.opts.width+"' height='"+$.sketchyPad.opts.height+"'>Your browser does not support canvas</canvas>")
     
    
    },
    getRGBA: function() {
        var color = $.sketchyPad.opts.color;
        var opacity = $.sketchyPad.opts.opacity;
        if (color.charAt(0) == '#') {
          color = color.substring(1,7);
        }
        return "rgba("+parseInt(color.substring(0,2),16)+","+parseInt(color.substring(2,4),16)+","+parseInt(color.substring(4,6),16)+","+opacity+")";
    },
    
    setBrush: function(brushType) {
        localStorage.sketchypad_brush_type = brushType;
      //  var context = $.sketchyPad.opts.topCanvas.get(0).getContext("2d");
        brush = eval("new " + brushType + "($.sketchyPad)");    
    },

    getBrushType: function() {
      return localStorage.sketchypad_brush_type;
    },
    setColor: function(color) {
      localStorage.sketchypad_color = color;
      $.sketchyPad.opts.color = color;
    },

    getColor: function() {
       
       var color = $.sketchyPad.opts.color;
       if (color.length == 6) {
           return "#" + color;
        }
        return color;
       //return '#'+$.sketchyPad.toHex(color[0])+$.sketchyPad.toHex(color[1])+$.sketchyPad.toHex(color[2]);
    },
    toString: function(layer) {
      if (typeof(layer)==='undefined') {
        layer = "layer1";
      }

      var canvas = document.getElementById(layer);
      var type = "image/png";
      var data = canvas.toDataURL(type);
      console.log(data);
      return data.replace('data:' + type + ';base64,', '');
     
    },
    toHex: function(n) {
       n = parseInt(n,10);
       if (isNaN(n)) return "00";
       n = Math.max(0,Math.min(n,255));
       return "0123456789ABCDEF".charAt((n-n%16)/16) + "0123456789ABCDEF".charAt(n%16);
    },   
    setBrushSize: function(brushSize) {
      localStorage.sketchypad_brush_size = brushSize;
      $.sketchyPad.opts.brushSize = brushSize;
    },

    getBrushSize: function() {
      return localStorage.sketchypad_brush_size;
    },

    setOpacity: function(opacity) {
        localStorage.sketchypad_opacity = opacity;
        $.sketchyPad.opts.opacity = opacity;
    },

    getOpacity: function() {
      return localStorage.sketchypad_opacity;
    },

    registerEvents: function() {


         $(window).resize(function() { offset = $.sketchyPad.opts.topCanvas.offset();  });
         
         //track mouse movements
         $(window).bind('mousemove', $.sketchyPad.onWindowMouseMove);
         //canvas detect mouse down -- register more events
         $.sketchyPad.opts.topCanvas.bind('mousedown', $.sketchyPad.onCanvasMouseDown);
         $.sketchyPad.opts.topCanvas.bind('mousemove', $.sketchyPad.drawCursor);

    },
    
    onWindowMouseMove: function(event) {

         

      //um.... why do we need currentPoint for?  when we have getBrushPoint?
      //because the funcation cannot be called within brush, it has no event context
         $.sketchyPad.opts.currentPoint = $.sketchyPad.getBrushPoint(event);
        
    },
    drawCursor: function() {
    
      var upper = $.sketchyPad.opts.topCanvas.get(0).getContext('2d');
   
      //draw a circle at mouse position
      upper.clearRect(0, 0, upper.canvas.width, upper.canvas.height);
      //  drawCurveStroke(upper);

      var new_point = $.sketchyPad.opts.currentPoint;
      if (new_point) {
          
        upper.strokeStyle=$.sketchyPad.getColor();
        upper.lineCap = "round";
        upper.lineWidth = 1;

        upper.fillStyle=$.sketchyPad.getRGBA();
        upper.beginPath();
        upper.arc(new_point.x, new_point.y,parseInt($.sketchyPad.getBrushSize())/2, 0, Math.PI * 2, true);
        upper.stroke(); 
        upper.closePath();
        upper.fill();
     
      }
    },
    
    getBrushPoint: function(event) {
       return {x:event.clientX - offset.left + window.pageXOffset, y:event.clientY - offset.top + window.pageYOffset}
    },

    onCanvasMouseDown: function(event) {
      $.sketchyPad.opts.topCanvas.unbind('mousemove', $.sketchyPad.drawCursor);
      //clear cursor
      var topCanvasCanvas = $.sketchyPad.opts.topCanvas.get(0).getContext('2d');
      topCanvasCanvas.clearRect(0,0,topCanvasCanvas.canvas.width, topCanvasCanvas.canvas.height);
    
      //additional handlers bound at window level, that way if pen exits canvas border, we can still receive events
      $(window).bind('mouseup', $.sketchyPad.onWindowMouseUp);
      $(window).bind('mousemove', $.sketchyPad.onCanvasMouseMove);
    
      brush.strokeStart($.sketchyPad);
     // brush.stroke($.sketchyPad);
    },

    onWindowMouseUp: function(event) {
      brush.strokeEnd($.sketchyPad);
      $(window).unbind('mouseup', $.sketchyPad.onWindowMouseUp);
      $(window).unbind('mousemove', $.sketchyPad.onCanvasMouseMove);
      $.sketchyPad.opts.topCanvas.bind('mousemove', $.sketchyPad.drawCursor);      
    },
    
    onCanvasMouseMove: function(event) {
      brush.stroke($.sketchyPad);
    },

    initLocalStorage: function() {
       //if localStorage is empty
       if (localStorage.sketchypad_color === undefined || localStorage.sketchypad_brush_size === undefined || localStorage.sketchypad_opacity === undefined || localStorage.sketchypad_brush_type === undefined) {
           //save first time brush opts into localStorage
           localStorage.sketchypad_brush_size = $.sketchyPad.opts.brushSize;
           localStorage.sketchypad_opacity = $.sketchyPad.opts.opacity;
           localStorage.sketchypad_color = $.sketchyPad.opts.color;
           localStorage.sketchypad_brush_type = $.sketchyPad.opts.brushType;
       } else {
           //else load (override) brush opts from localStorage
           $.sketchyPad.opts.brushSize = localStorage.sketchypad_brush_size;
           $.sketchyPad.opts.opacity = localStorage.sketchypad_opacity;
           $.sketchyPad.opts.color = localStorage.sketchypad_color;
           $.sketchyPad.opts.brushType = localStorage.sketchypad_brush_type;
       }

    }
      
 }; //end overridable functions
   
// end of closure

})(jQuery);

