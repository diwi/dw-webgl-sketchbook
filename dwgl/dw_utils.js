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


out = (out !== undefined) ? out : {};

out.PI     = Math.PI;
out.PI2    = Math.PI * 2.0;
out.TO_RAD = Math.PI / 180.0;
out.SQRT2  = Math.sqrt(2);
out.GOLDEN_RATIO = (1.0 + Math.sqrt(5.0)) / 2.0;

var random = function(){
  var x = ++random.seed;
  var y = ++random.seed;
  var val = Math.sin(x * 12.9898 + y * 78.233) * 43758.545;
  return (val - Math.floor(val));
}
random.seed = 0;

out.random = random;

out.logNceil = function(val, n){
  return Math.ceil(Math.log(val)/Math.log(n));
}
  
out.log2ceil = function(val){
  return out.logNceil(val, 2.0);
}

out.log4ceil = function(val){
  return out.logNceil(val, 4.0);
}

out.mix = function(a, b, t){
  return a * (1.0-t) + b * (t);
}

out.clamp = function(a, lo, hi){
  if(a < lo) return lo; else if(a > hi)return hi; else return a;
}

out.smoothstepn = function(x){
  return x*x*(3 - 2*x);
}

out.smootherstepn = function(x){
  return x*x*x*(x*(x*6 - 15) + 10);
}

out.smoothstep = function(edge0, edge1, x){
  x = out.clamp((x - edge0)/(edge1 - edge0), 0.0, 1.0); // [0, 1]
  return out.smoothstepn(x);
}

out.smootherstep = function(edge0, edge1, x){
  x = out.clamp((x - edge0)/(edge1 - edge0), 0.0, 1.0); // [0, 1]
  return out.smootherstepn(x);
}

out.map = function(val, a0, a1, b0, b1){
  return b0 + (b1 - b0) * ((val - a0) / (a1 - a0));
}
out.clampedmap = function(val, a0, a1, b0, b1){
  return Dw.clamp(Dw.map(val,a0, a1, b0, b1), b0, b1);
}

return out;
  
})(Dw);

