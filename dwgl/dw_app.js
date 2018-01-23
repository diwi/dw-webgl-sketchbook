/**
 *
 *  dw-webgl-sketchbook: https://github.com/diwi/dw-webgl-sketchbook
 *
 *  Copyright 2018 by Thomas Diewald, https://www.thomasdiewald.com
 *
 *  MIT License: https://opensource.org/licenses/MIT
 *
 */



var Dw = (function(out) {



class Mouse {
  
  constructor(){
    this.x = 0; this.px = 0;
    this.y = 0; this.py = 0; 
    this.LMB = 0; 
    this.MMB = 0; 
    this.RMB = 0; 
    this.down = 0;
  }

  attach(canvas){
    this.canvas = canvas;
    canvas  .addEventListener('mousedown', this.mousedown.bind(this), false);
    document.addEventListener('mouseup'  , this.mouseup  .bind(this), false);
    document.addEventListener('mousemove', this.mousemove.bind(this), false);
  }
  
  setPos(ev){
    var canvas = this.canvas;
    this.x = ev.clientX - canvas.clientLeft - canvas.offsetLeft;
    this.y = ev.clientY - canvas.clientLeft - canvas.offsetTop;
  }
  
  mousedown(ev){
    this.down = true;
    if(ev.button === 0) this.LMB = true;
    if(ev.button === 1) this.MMB = true;
    if(ev.button === 2) this.RMB = true;
    this.setPos(ev);
  }
  
  mouseup(ev){
    this.down = false;
    if(ev.button === 0) this.LMB = false;
    if(ev.button === 1) this.MMB = false;
    if(ev.button === 2) this.RMB = false;
    this.setPos(ev);
  }
  
  mousemove(ev){
    this.setPos(ev);
  }

};




var requestAnimationFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(callback, element) {
           return window.setTimeout(callback, 1000/60);
         };
})();

var cancelAnimationFrame = (function() {
  return window.cancelAnimationFrame ||
         window.webkitCancelAnimationFrame ||
         window.mozCancelAnimationFrame ||
         window.oCancelAnimationFrame ||
         window.msCancelAnimationFrame ||
         window.clearTimeout;
})();
  
var performance = window.performance || {};
performance.now = (function() {
  const start_time = Date.now();
  return (
    window.performance.now ||
    window.performance.webkitNow ||
    window.performance.mozNow ||
    window.performance.oNow ||
    window.performance.msNow ||
    function() {
      return Date.now() - start_time;
    }
  );
})();












class App {
  
  constructor(opt, user_cb){
    
    if(typeof arguments[0] === 'function' && arguments.length === 1){
      user_cb = arguments[0];
    }
    
    opt = (typeof opt === 'object') ? opt : {};
    opt.title = opt.title || 'Dw-Webgl-Sketchbook';
    
    if(typeof arguments[0] === 'string'){
      opt.title = arguments[0];
    }
    
    var app = this;
    
    this.setTitle(opt.title);
    
    this.webgl_attributes = {
      alpha: true, // canvas contains an alpha buffer.
      depth: true, // drawing buffer has a depth buffer of at least 16 bits.
      stencil: true, // drawing buffer has a stencil buffer of at least 8 bits.
      antialias: true, //  whether or not to perform anti-aliasing.
      premultipliedAlpha: false, // drawing buffer contains colors with pre-multiplied alpha.
      preserveDrawingBuffer: true, // buffers will not be cleared
      preferLowPowerToHighPerformance : false,
      failIfMajorPerformanceCaveat: true
    };
    // this.webgl_names = ['webgl2', 'webgl', 'experimental-webgl'];
    this.webgl_names = ['webgl2']; 

    this.smooth = 0.9;
    this.framecount = 0;
    this.framerate = 60;
    this.frametime = performance.now() - 1000/this.framerate;
   
    this.mouse = new Mouse();

    
    window.addEventListener('resize', function(ev) {
      var w = app.canvas.clientWidth;
      var h = app.canvas.clientHeight;
      app.canvas.resize(w, h);
      if(app.resize) app.resize(w, h);
    }, false);
    
    // TODO
    window.addEventListener('unload', function(){
      if(app.release) app.release();
    }, false);
    
    this.init    = ('undefined' !== typeof init   ) ? init    : null;
    this.setup   = ('undefined' !== typeof setup  ) ? setup   : null;
    this.resize  = ('undefined' !== typeof resize ) ? resize  : null;
    this.draw    = ('undefined' !== typeof draw   ) ? draw    : null;
    this.release = ('undefined' !== typeof release) ? release : null;
    
    // input events
    this.mousedown  = ('undefined' !== typeof mousedown ) ? mousedown  : null;
    this.mouseup    = ('undefined' !== typeof mouseup   ) ? mouseup    : null;
    this.mousemove  = ('undefined' !== typeof mousemove ) ? mousemove  : null;
    this.click      = ('undefined' !== typeof click     ) ? click      : null;
    this.dblclick   = ('undefined' !== typeof dblclick  ) ? dblclick   : null;
    this.touchstart = ('undefined' !== typeof touchstart) ? touchstart : null;
    this.touchend   = ('undefined' !== typeof touchend  ) ? touchend   : null;
    this.touchmove  = ('undefined' !== typeof touchmove ) ? touchmove  : null;
    this.keyup      = ('undefined' !== typeof keyup     ) ? keyup      : null;
    this.keydown    = ('undefined' !== typeof keydown   ) ? keydown    : null;
    // ... tbc ...
    
    this.registered = {
      pre : [], 
      post : [],
    };
 

    // 0)
    if(typeof user_cb === 'function'){
      user_cb(this);
    }
    
    // 1)
    if(app.init) app.init();
    this.createCanvas();
    this.createWebglContext();
    this.mouse.attach(this.canvas);
    
    // input events
    if(this.mousedown ) document.addEventListener('mousedown' , this.mousedown .bind(this), false);
    if(this.mouseup   ) document.addEventListener('mouseup'   , this.mouseup   .bind(this), false);
    if(this.mousemove ) document.addEventListener('mousemove' , this.mousemove .bind(this), false);
    if(this.click     ) document.addEventListener('click'     , this.click     .bind(this), false);
    if(this.dblclick  ) document.addEventListener('dblclick'  , this.dblclick  .bind(this), false);
    if(this.touchstart) document.addEventListener('touchstart', this.touchstart.bind(this), false);
    if(this.touchend  ) document.addEventListener('touchend'  , this.touchend  .bind(this), false);
    if(this.touchmove ) document.addEventListener('touchmove' , this.touchmove .bind(this), false);
    if(this.keyup     ) document.addEventListener('keyup'     , this.keyup     .bind(this), false);
    if(this.keydown   ) document.addEventListener('keydown'   , this.keydown   .bind(this), false);
    // ... tbc ...
    
    if(this.gl){
    
      // 2)
      if(app.setup) app.setup();
      
      // 3)
      if(app.draw){

        var loop;

        (loop = function() {
          
          var pre = this.registered.pre;
          var post = this.registered.post;
          
          for(var i = 0; i < pre.length; i++){
            pre[i]();
          }
          
          this.draw();
          
          for(var i = 0; i < post.length; i++){
            post[i]();
          }

          this.updateFramerate();
          this.updateMouse();
          
          requestAnimationFrame(loop);
          
        }.bind(this))();

      }
    } else {
      this.init    = null;
      this.setup   = null;
      this.resize  = null;
      this.draw    = null;
      this.release = null;
      
      var parent = document.getElementById('sketch-stats');
      parent.innerHTML = ">> Sorry, this Browser does not support <b>"+this.webgl_names.join('|')+"</b> <<";
    }
  }
  
  
  setTitle(title){
    this.title = title;
    // div
    var div_title = document.getElementById('sketch-title');
    if(div_title){
      div_title.textContent = title;
    }
    // tag
    var tag_title = document.getElementsByTagName('title');
    if(tag_title.length){
      tag_title[0].textContent = title;
    } else {
      tag_title = document.createElement('title');
      document.head.appendChild(tag_title);
      tag_title.textContent = title;
    } 
  }
  

  createCanvas(name, w, h){
    if(this.canvas){
      return;
    }
    name = name || 'Dw-Canvas';
    var canvas = document.getElementById(name);
    if(!canvas){
      canvas = document.createElement('canvas');
      canvas.width  = w || window.innerWidth;
      canvas.height = h || window.innerHeight;
      canvas.id     = name;
      document.body.appendChild(canvas);
    } else {
      canvas.width  = w || canvas.clientWidth;
      canvas.height = h || canvas.clientHeight;
    }
    
    canvas.resize = function(w_, h_){
      this.width  = w_ || this.clientWidth;
      this.height = h_ || this.clientHeight;
    };
    
    canvas.resize();
    
    this.canvas = canvas;
    
    return this.canvas;
  }
    
    
  createWebglContext(){
    if(this.gl){
      return;
    }
    var names = this.webgl_names;
    var gl = null;
    for (var i = 0; i < names.length; ++i) {
      try {
        gl = this.canvas.getContext(names[i], this.webgl_attributes);
      } catch(e) {}
      if (gl) {
        break;
      }
    }
    this.gl = gl;

    if(!!!gl){
      console.log('sorry, no webgl available for: ' + names);
    }
    
    return gl;
  }
    
  updateFramerate(){
    var time_now = performance.now();
    this.frameduration = time_now - this.frametime;
    this.frametime = time_now;  
    this.framerate = (this.framerate * this.smooth) + (1-this.smooth)*(1000/this.frameduration);
    this.framecount++;
  }
  
  updateMouse(){
    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
  }
}




out = (out !== undefined) ? out : {};

out.App = App;
out.Mouse = Mouse;

out.start = function(opt, user_cb){
  return new App(opt, user_cb);
}


return out;
  

})(Dw);

