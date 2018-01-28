/**
 *
 *  dw-webgl-sketchbook: https://github.com/diwi/dw-webgl-sketchbook
 *
 *  Copyright 2018 by Thomas Diewald, https://www.thomasdiewald.com
 *
 *  MIT License: https://opensource.org/licenses/MIT
 *
 */
 
 
 
 class DepthMap {
  
  constructor(app){
    this.app = app;
    
    var vs, fs;
    
    fs = document.getElementById("webgl2.fs_texdisplay").textContent;
    this.shaderDisplay = new Dw.Shader(gl, {fs:fs});
    
    vs = document.getElementById("webgl2.vs_depthmap").textContent;
    fs = document.getElementById("webgl2.fs_depthmap").textContent;
    this.shader = new Dw.Shader(gl, {vs:vs, fs:fs});
    
    var dim = 1024;
    this.def = {
      target     : gl.TEXTURE_2D,
      iformat    : gl.DEPTH_COMPONENT16,
      format     : gl.DEPTH_COMPONENT,
      attachment : gl.DEPTH_ATTACHMENT,
      type       : gl.UNSIGNED_SHORT,
      wrap       : gl.CLAMP_TO_EDGE,
      comparemode: gl.COMPARE_REF_TO_TEXTURE,
      filter     : [gl.LINEAR, gl.LINEAR],
    };
    
    this.viewdir = new Float32Array(3);
    
    this.orbit = new Dw.EasyCam(app, {distance: 5000});
    // this.orbit.setViewport([10,h-300-10, 300, 300]);

    this.tex = gl.newTexture(dim, dim, this.def);

    this.fbo = gl.newFramebuffer();
    this.fbo.setTexture(this.tex);
    this.fbo.err();
    
    this.fbo.begin();
    this.fbo.end();
    
    this.bias = 10.0 * 1000.0 * 1.0 / dim;
      
    this.mat = {
      modelview  : newMat(mat4),
      projection : newMat(mat4),
    };
  }
  

  enableShadowParam(state){
    var tex = this.tex;
    tex.bind();
    if(state){
      gl.texParameteri(tex.target, gl.TEXTURE_MIN_FILTER, tex.filter[0]);
      gl.texParameterf(tex.target, gl.TEXTURE_MAG_FILTER, tex.filter[1]);
      gl.texParameterf(tex.target, gl.TEXTURE_COMPARE_MODE, tex.comparemode);
    } else {
      gl.texParameteri(tex.target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameterf(tex.target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameterf(tex.target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
    }
    tex.unbind();
  }
  
  release(){
    this.shaderDisplay.release();
    this.shader.release();
    this.tex.release();
    this.fbo.release();
    this.orbit.release();
  }
  
  resize(w, h){
    this.tex.resize(w, h);
  }
  
  setModelview(dir, distance){
    var x = dir[0];
    var y = dir[1];
    var z = dir[2];
    var dd = x*x+y*y+z*z;
    if(dd > 0.0 && dd !== 1.0){
      dd = distance / Math.sqrt(dd);
      x *= dd;
      y *= dd;
      z *= dd;
    }

    this.eye    = [-x,-y,-z];
    this.center = [0,0,0];
    this.up     = [0,0,-1];
    mat4.lookAt(this.mat.modelview,this. eye, this.center, this.up);
  }
  
  setOrtho(w, h, d){
    mat4.ortho(this.mat.projection, -w/2, w/2, -h/2, h/2, 1, d);
  }
  
  setPerspective(fovy, near, far){
    mat4.perspective(this.mat.projection, fovy, this.tex.w/this.tex.h, near, far);
    mat4.scale(this.mat.projection, this.mat.projection, [1,-1,1]);
  }
  
  create(render_cb){
    
    this.orbit.update().apply(this.mat.modelview);
    
    this.viewdir[0] = -depthmap.mat.modelview[ 2];
    this.viewdir[1] = -depthmap.mat.modelview[ 6];
    this.viewdir[2] = -depthmap.mat.modelview[10];
    
    
    var w = this.tex.w;
    var h = this.tex.h;
    
    this.fbo.begin();
    
    gl.viewport(0, 0, w, h);
    gl.colorMask(false, false, false, false);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    // gl.clearDepth(1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT);
   
    this.shader.begin();
    this.shader.pushAttributeLocWarning(false);
    this.shader.pushUniformLocWarning(false);
    render_cb(this.shader, this.mat);
    this.shader.popAttributeLocWarning();
    this.shader.popUniformLocWarning();
    this.shader.end();
    this.fbo.end();
  }
  
  displayTex(){
    this.enableShadowParam(false);
    
    var w_canvas = this.app.canvas.width;
    var h_canvas = this.app.canvas.height;
    
    var viewport = this.orbit.getViewport();
    
    var w = viewport[2];
    var h = viewport[3];
    var x = viewport[0];
    var y = viewport[1]; y = h_canvas - 1 - y - h;
    
    var shader = this.shaderDisplay;
  
    shader.begin();
    gl.viewport(x, y, w, h);
    gl.colorMask(true, true, true, true);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    shader.uniformF('xy_off', [x, y]);
    shader.uniformF('wh_rcp', [1/w, 1/h]);
    shader.uniformT('tex', this.tex);
    shader.quad();
    shader.end();
    
    this.enableShadowParam(true);
  }
  
 

}