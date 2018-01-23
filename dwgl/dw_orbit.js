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

// simple wraper for damping a value
class Damp {
  
  constructor(val, speed, damp, limit){ 
    this.val_reset = val;
    this.val_start = val;
    this.val_now = val;
    this.val_end = val;
    
    this.limit = limit;

    this.speed = speed;
    this.damp = damp;
    this.state = null;
  }
  
  active(){
    return this.state !== null;
  }
  
  start(state){
    this.state = state;
    this.val_start = this.val_now;
  }
  
  drag(state){
    if(this.active()){
      var delta = this.state - state;
      this.val_end = this.val_start + delta * this.speed;
      if(this.limit){
        this.val_end = Math.min(Math.max(this.val_end, this.limit[0]), this.limit[1]);
      }
    }
  }
  
  end(){
    this.state = null;
  }
  
  update(){
    this.val_now = this.val_end * this.damp + this.val_now * (1.0 - this.damp);
  }
  
  reset(val_new){
    this.val_end = (val_new !== undefined) ? val_new : this.val_reset;
  } 
}




// Most simple camera I could think off.
// Provides some very basic Orbit (rotateX,rotateY) and Zoom (scale).
class OrbitControl {
  
  constructor(parent){
    this.parent = parent;
    this.active = true;
    this.rx     = new Damp(0.0, +0.01, 0.07);
    this.ry     = new Damp(0.0, +0.01, 0.07);
    this.zoom   = new Damp(1000.0, -10, 0.07, [10, 10000]);
    var cam = this;

    parent.canvas.addEventListener('dblclick', function(e){ 
      cam.reset(); 
    });
    parent.canvas.addEventListener('mousedown', function(e){ 
      if(e.button === 0) cam.startOrbit();
      if(e.button === 2) cam.startZoom();
    });
    document.addEventListener('mouseup', function(e){ 
      if(e.button === 0) cam.endOrbit();
      if(e.button === 2) cam.endZoom();
    });
    
    // if(parent.registered && parent.registered.pre){
      // parent.registered.pre.push( function(){ cam.update(); });
    // }
  }
  
  startOrbit(){
    this.rx.start(this.parent.mouse.y);
    this.ry.start(this.parent.mouse.x);
  }
  
  startZoom(){
    this.zoom.start(this.parent.mouse.y);
  }
  
  drag(){
    this.zoom.drag(this.parent.mouse.y);
    this.rx.drag  (this.parent.mouse.y);
    this.ry.drag  (this.parent.mouse.x);
  }
  
  endOrbit(){
    this.rx.end();
    this.ry.end();
  }
  
  endZoom(){
    this.zoom.end();
  }

  activate(active){
    this.active = active;
  }
  
  reset(){
    this.rx.reset();
    this.ry.reset();
    this.zoom.reset();
  }
  
  update(){
    if(this.active) {
      this.drag();
      this.rx.update();
      this.ry.update();
      this.zoom.update();
    }
    return this;
  }
  
  apply(m4){
    mat4.translate(m4, m4, [0,0,-this.zoom.val_now]);
    mat4.rotateX(m4, m4, this.rx.val_now);
    mat4.rotateZ(m4, m4, this.ry.val_now);
    return this;
  }
  
}




out = (out !== undefined) ? out : {};

out.OrbitControl = OrbitControl;
out.Damp = Damp;


return out;
  

})(Dw);

