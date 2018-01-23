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




////////////////////////////////////////////////////////////////////////////////
//
// Index Face Set
//
////////////////////////////////////////////////////////////////////////////////


class IFS {
  
  constructor(verts, verts_num, faces, faces_num, parent){
    this.verts = verts; // 1D float array, flattened
    this.faces = faces; // 2D int array, nested
    this.verts_num = verts_num;
    this.faces_num = faces_num;
    
    this.parent = parent;
    
    this.createNormals();
    this.createIndexBuffer();
  }
  
 
  
  createIndexBuffer(){
    
    var faces_num = this.faces_num;
    var faces = this.faces;
    
    var triangles_num = 0;
    
    // count number of resulting triangles.
    // this includes degenerated ones for displaying lines and points.
    for(var i = 0; i < faces_num; i++){
      var face = faces[i];
      var num_faceverts = faces[i].length;
      if(num_faceverts){
        triangles_num += Math.max(1, num_faceverts - 2);
      }
    }
    
    var triangles = new Int32Array(triangles_num * 3);
    
    this.triangles_num = triangles_num;
    this.triangles = triangles;
    var ptr = 0;

    for(var i = 0; i < faces_num; i++){
      
      var face = faces[i];
      
      switch(face.length){
        
        case 0 :
          break;
          
        case 1 : 
          triangles[ptr++] = face[0];
          triangles[ptr++] = face[0];
          triangles[ptr++] = face[0];
          break;
          
        case 2 :
          triangles[ptr++] = face[0];
          triangles[ptr++] = face[1];
          triangles[ptr++] = face[0];
          break;
          
        case 3 :
          triangles[ptr++] = face[0];
          triangles[ptr++] = face[1];
          triangles[ptr++] = face[2];
          break;
          
        case 4 :
          triangles[ptr++] = face[0];
          triangles[ptr++] = face[1];
          triangles[ptr++] = face[3];
          
          triangles[ptr++] = face[3];
          triangles[ptr++] = face[1];
          triangles[ptr++] = face[2];
          break;
          
        default:
        
          var ia, ib, i0, i1, i2;
          ia = 0;
          ib = face.length - 1;
          
          while(ia < ib) {
            
            i0 = ia++;
            i1 = ia;
            i2 = ib;
            if(ia === ib) break;
            triangles[ptr++] = face[i0];
            triangles[ptr++] = face[i1];
            triangles[ptr++] = face[i2];

            i0 = ib--;
            i1 = ia;
            i2 = ib;
            if(ia === ib) break;
            triangles[ptr++] = face[i0];
            triangles[ptr++] = face[i1];
            triangles[ptr++] = face[i2];
          }
          break;
      }

    }  
  }
  
  

  createNormals(){
    
    var verts = this.verts;
    var faces = this.faces;
    var verts_num = this.verts_num;
    var faces_num = this.faces_num;
    
    if(this.vnml === undefined || this.vnml.length != verts_num * 3){
      this.vnml = new Float32Array(verts_num * 3);
    }
    
    if(this.fnml === undefined || this.fnml.length != faces_num * 3){
      this.fnml = new Float32Array(faces_num * 3);
    }

    var vnml = this.vnml ;
    var fnml = this.fnml ;  
  
    this.clear(vnml);
    this.clear(fnml);
    
    var normal = [];
    
    for(var i = 0; i < faces_num; i++){
      var if0 = i * 3;
      var face = faces[i];
      var count = face.length;
      for(var j = 0; j < count; j++){
        
        // TODO: if count is 3, only one computation is enough
        
        var j0 = j;
        var j1 = (j + count + 1) % count;
        var j2 = (j + count - 1) % count;

        var iv0 = face[j0] * 3;
        var iv1 = face[j1] * 3;
        var iv2 = face[j2] * 3;
        
        normal = Dw.triangleNormal(verts, iv0, iv1, iv2, normal);

        vnml[iv0+0] += normal[0];
        vnml[iv0+1] += normal[1];
        vnml[iv0+2] += normal[2];
        
        fnml[if0+0] += normal[0];
        fnml[if0+1] += normal[1];
        fnml[if0+2] += normal[2];
      }
    }
    
    this.normalize(vnml, verts_num);
    this.normalize(fnml, faces_num);
    
    return this;
  }
  
  clear(buffer){
    for(var i = 0; i < buffer.length; i++){
      buffer[i] = 0.0;
    }
  }
  
  normalize(normals, count){
    var x, y, z, dd, i, vi;
    
    for(i = 0; i < count; i++){
      vi = i * 3;
      x = normals[vi+0];
      y = normals[vi+1];
      z = normals[vi+2];
      dd = x*x + y*y + z*z;
      if(dd > 0 && dd != 1.0){
        dd = 1.0 / Math.sqrt(dd);
        x *= dd;
        y *= dd;
        z *= dd;
      }
      normals[vi+0] = x;
      normals[vi+1] = y;        
      normals[vi+2] = z;        
    } 
  }
  
};






function triangleNormal(verts, v0, v1, v2, normal, normalize = true){
  // verts ... vertex list (flattened), float3
  // v0    ... vertex index 0
  // v1    ... vertex index 1
  // v2    ... vertex index 2
  
  var x0 = verts[v0++];
  var y0 = verts[v0++];
  var z0 = verts[v0++];
  
  // dir a: v0 >- v1
  var ax = verts[v1++] - x0;
  var ay = verts[v1++] - y0;
  var az = verts[v1++] - z0;
  
  // dir b: v0 -> v2
  var bx = verts[v2++] - x0;
  var by = verts[v2++] - y0;
  var bz = verts[v2++] - z0;
  
  // cross a x b
  var nx = ay * bz - az * by;
  var ny = az * bx - ax * bz;
  var nz = ax * by - ay * bx;
  
  // normalize
  if(normalize){
    var dd = nx * nx + ny * ny + nz * nz;
    if(dd > 0 && dd !== 1.0){
      dd = 1.0 / Math.sqrt(dd);
      nx *= dd;
      ny *= dd;
      nz *= dd;
    }
  }
  
  normal[0] = nx;
  normal[1] = ny;
  normal[2] = nz;
  return normal;
}













////////////////////////////////////////////////////////////////////////////////
//
// Plane
//
////////////////////////////////////////////////////////////////////////////////


Dw.createPlane = function(dimx, dimy, resx, resy){
  var primitive = new Plane(dimx, dimy, resx, resy);
  return primitive.ifs;
};


class Plane {
  
  constructor(dimx, dimy, resx, resy){
    
    this.dimx = dimx = dimx === undefined ? 1    : dimx;
    this.dimy = dimy = dimy === undefined ? dimx : dimy;
    this.resx = resx = resx === undefined ? 1    : resx;
    this.resy = resy = resy === undefined ? resx : resy;
 
    this.verts_num = (resx + 1) * (resy + 1);
    this.verts = new Float32Array(this.verts_num * 3);
  
    this.faces_num = resx * resy;
    this.faces = new Array(this.faces_num);
    
    // vertices
    var vptr = 0;
    for(var y = 0; y <= resy; y++){
      for(var x = 0; x <= resx; x++){
        this.verts[vptr++] = ((x / resx) * 2 - 1) * dimx;
        this.verts[vptr++] = ((y / resy) * 2 - 1) * dimy;
        this.verts[vptr++] = 0.0;
      }
    }

    // faces
    var fptr = 0;
    var numx = resx + 1;
    for(var y = 0; y < resy; y++){
      for(var x = 0; x < resx; x++){
        var ia = y * numx + x;
        var ib = ia + 1;
        var ic = ia + 1 + numx;
        var id = ia + numx;
        this.faces[fptr++] = [ia, ib, ic, id];
      }
    }

    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);
    return this;
  }
}






////////////////////////////////////////////////////////////////////////////////
//
// Circle
//
////////////////////////////////////////////////////////////////////////////////


Dw.createCircle = function(radius, res, radial_tess){
  var primitive = new Circle(radius, res, radial_tess);
  return primitive.ifs;
};


class Circle {
  
  constructor(radius, res, radial_tess){
  
    this.radius      = radius = radius === undefined ? 1  : radius;
    this.res         = res    = res    === undefined ? 48 : res;
    this.radial_tess = radial_tess = radial_tess === undefined ? true : radial_tess;

    if(radial_tess)
    {
      
      this.verts_num = res + 1;
      this.verts = new Float32Array(this.verts_num * 3);
    
      this.faces_num = res;
      this.faces = new Array(this.faces_num);
      
      // vertices
      var vptr = 0;
      var step = Math.PI * 2 / res;
      for(var i = 0; i < res; i++){
        this.verts[vptr++] = Math.cos(i * step) * radius;
        this.verts[vptr++] = Math.sin(i * step) * radius;
        this.verts[vptr++] = 0.0;
      }
      
      // center
      this.verts[vptr++] = 0.0;
      this.verts[vptr++] = 0.0;
      this.verts[vptr++] = 0.0;
      
      // faces
      var ia = this.verts_num - 1;
      for(var i = 0; i < res; i++){
        var ib = i;
        var ic = (i + 1) % res;
        
        this.faces[i] = [ia, ib, ic];
      }
      
    } 
    else 
    {
      
      this.verts_num = res;
      this.verts = new Float32Array(this.verts_num * 3);
    
      this.faces_num = 1;
      this.faces = new Array(this.faces_num);
      
      // vertices
      var vptr = 0;
      var step = Math.PI * 2 / res;
      for(var i = 0; i < res; i++){
        this.verts[vptr++] = Math.cos(i * step) * radius;
        this.verts[vptr++] = Math.sin(i * step) * radius;
        this.verts[vptr++] = 0.0;
      }
      
      // faces
      var face = this.faces[0] = []; 
      for(var i = 0; i < res; i++){
        face[i] = i;
      }

    }
    
    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);
    return this;
  }
}



Dw.createTube = function(radius1, radius2, height, res_radius, res_height){
  var primitive = new Tube(radius1, radius2, height, res_radius, res_height);
  return primitive.ifs;
};









////////////////////////////////////////////////////////////////////////////////
//
// Tube
//
////////////////////////////////////////////////////////////////////////////////



class Tube {
  
  constructor(radius1, radius2, height, res_radius, res_height){
  
    this.radius1    = radius1    = radius1    === undefined ? 1       : radius1;
    this.radius2    = radius2    = radius2    === undefined ? radius1 : radius2;
    this.height     = height     = height     === undefined ? radius1 : height;
    this.res_radius = res_radius = res_radius === undefined ? 48      : res_radius;
    this.res_height = res_height = res_height === undefined ? 1       : res_height;
    
    this.verts_num = res_radius * (res_height + 1);
    this.verts = new Float32Array(this.verts_num * 3);
    
    this.faces_num = res_radius * res_height;
    this.faces = new Array(this.faces_num);
    

    // vertices
    var vptr = 0;
    var step = Math.PI * 2 / res_radius;
    for(var i = 0; i < res_radius; i++){
      var x = Math.cos(i * step);
      var y = Math.sin(i * step);
      
      for(var j = 0; j <= res_height; j++){
        var jnorm = j / res_height;
        var radius = radius1 * (1.0-jnorm) + radius2 * jnorm;
        var z = jnorm * 2 - 1;
        this.verts[vptr++] = x * radius;
        this.verts[vptr++] = y * radius;
        this.verts[vptr++] = z * height;
      }
    }

    // faces
    var fptr = 0;
    var numy = res_height + 1;
    for(var i = 0; i < res_radius; i++){
      for(var y = 0; y < res_height; y++){
        var i0 = i;
        var i1 = (i+1) % res_radius;
        var j0 = y;
        var j1 = y+1;
        
        var ia = i0 * numy + j0;
        var ib = i1 * numy + j0;
        var ic = i1 * numy + j1;
        var id = i0 * numy + j1;
        
        this.faces[fptr++] = [ia, ib, ic, id];
      }
    }

    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);
    return this;
  }
}




////////////////////////////////////////////////////////////////////////////////
//
// Cylinder
//
////////////////////////////////////////////////////////////////////////////////


Dw.createCylinder = function(radius1, radius2, height, res_radius, res_height){
  var primitive = new Cylinder(radius1, radius2, height, res_radius, res_height);
  return primitive.ifs;
};



class Cylinder {
  
  constructor(radius1, radius2, height, res_radius, res_height){
  
    this.radius1    = radius1    = radius1    === undefined ? 1       : radius1;
    this.radius2    = radius2    = radius2    === undefined ? radius1 : radius2;
    this.height     = height     = height     === undefined ? radius1 : height;
    this.res_radius = res_radius = res_radius === undefined ? 48      : res_radius;
    this.res_height = res_height = res_height === undefined ? 1       : res_height;
    
    var tube   = Dw.createTube(radius1, radius2, height, res_radius, res_height);
    var circle1 = Dw.createCircle(radius1, res_radius, true);
    var circle2 = Dw.createCircle(radius2, res_radius, true);
    
    this.verts_num = tube.verts_num + circle1.verts_num + circle2.verts_num;
    this.verts = new Float32Array(this.verts_num * 3);
    
    this.faces_num = tube.faces_num + circle1.faces_num + circle2.faces_num;
    this.faces = new Array(this.faces_num);
    
    var vptr = 0;
    
    // verts: side
    for(var i = 0; i < tube.verts_num; i++){
      var ti = i * 3;
      this.verts[vptr++] = tube.verts[ti++];
      this.verts[vptr++] = tube.verts[ti++];
      this.verts[vptr++] = tube.verts[ti++];
    }
    
    // verts: bottom cap
    for(var i = 0; i < circle1.verts_num; i++){
      var ci = i * 3;
      this.verts[vptr++] = circle1.verts[ci++];
      this.verts[vptr++] = circle1.verts[ci++];
      this.verts[vptr++] = -height;
    }
    
    // verts: top cap
    for(var i = 0; i < circle2.verts_num; i++){
      var ci = i * 3;
      this.verts[vptr++] = circle2.verts[ci++];
      this.verts[vptr++] = circle2.verts[ci++];
      this.verts[vptr++] = +height;
    }
    
    var fptr = 0;
    var voff = 0;
    // faces: side
    for(var i = 0; i < tube.faces_num; i++){
      this.faces[fptr++] = tube.faces[i];
    }
    voff += tube.verts_num;
    
    // faces: bottom cap
    for(var i = 0; i < circle1.faces_num; i++){
      var face = circle1.faces[i];
      var ia = face[2] + voff;
      var ib = face[1] + voff;
      var ic = face[0] + voff;
      this.faces[fptr++] = [ia, ib, ic];
    }
    voff += circle1.verts_num;
    
    // faces: top cap
    for(var i = 0; i < circle2.faces_num; i++){
      var face = circle2.faces[i];
      var ia = face[0] + voff;
      var ib = face[1] + voff;
      var ic = face[2] + voff;
      this.faces[fptr++] = [ia, ib, ic];
    }
    voff += circle2.verts_num;
    

    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);
    return this;
  }
}







////////////////////////////////////////////////////////////////////////////////
//
// Box
//
////////////////////////////////////////////////////////////////////////////////


Dw.createBox = function(dimx, dimy, dimz, resx, resy, resz){
  var primitive = new Box(dimx, dimy, dimz, resx, resy, resz);
  return primitive.ifs;
};


class Box {
  
  constructor(dimx, dimy, dimz, resx, resy, resz){
    
    this.dimx = dimx = dimx === undefined ? 1    : dimx;
    this.dimy = dimy = dimy === undefined ? dimx : dimy;
    this.dimz = dimz = dimz === undefined ? dimx : dimz;
    this.resx = resx = resx === undefined ? 1    : resx;
    this.resy = resy = resy === undefined ? resx : resy;
    this.resz = resz = resz === undefined ? resx : resz;
    
    var XY = Dw.createPlane(dimx, dimy, resx, resy);
    var XZ = Dw.createPlane(dimx, dimz, resx, resz);
    var YZ = Dw.createPlane(dimy, dimz, resy, resz);
        
    this.verts_num = (XY.verts_num + XZ.verts_num + YZ.verts_num) * 2;
    this.verts = new Float32Array(this.verts_num * 3);
  
    this.faces_num = (XY.faces_num + XZ.faces_num + YZ.faces_num) * 2;
    this.faces = new Array(this.faces_num);
    
    // vertices
    var vptr = 0;
    
    // XY +
    for(var i = 0; i < XY.verts_num; i++){
      var ii = i * 3;
      this.verts[vptr++] = XY.verts[ii + 0];
      this.verts[vptr++] = XY.verts[ii + 1];
      this.verts[vptr++] = +dimz * 1.0;
    }
    
    // XY - 
    for(var i = 0; i < XY.verts_num; i++){
      var ii = i * 3;
      this.verts[vptr++] = XY.verts[ii + 0];
      this.verts[vptr++] = XY.verts[ii + 1];
      this.verts[vptr++] = -dimz * 1.0;
    }
    
    // XZ +
    for(var i = 0; i < XZ.verts_num; i++){
      var ii = i * 3;
      this.verts[vptr++] = XZ.verts[ii + 0];
      this.verts[vptr++] = -dimy * 1.0;
      this.verts[vptr++] = XZ.verts[ii + 1];
    }
    
    // XZ -
    for(var i = 0; i < XZ.verts_num; i++){
      var ii = i * 3;
      this.verts[vptr++] = XZ.verts[ii + 0];
      this.verts[vptr++] = +dimy * 1.0;
      this.verts[vptr++] = XZ.verts[ii + 1];
    }
    
    // YZ +
    for(var i = 0; i < YZ.verts_num; i++){
      var ii = i * 3;
      this.verts[vptr++] = +dimx * 1.0;
      this.verts[vptr++] = YZ.verts[ii + 0];
      this.verts[vptr++] = YZ.verts[ii + 1];
    }
    
    // YZ -
    for(var i = 0; i < YZ.verts_num; i++){
      var ii = i * 3;
      this.verts[vptr++] = -dimx * 1.0;
      this.verts[vptr++] = YZ.verts[ii + 0];
      this.verts[vptr++] = YZ.verts[ii + 1];
    }
    
    
    // faces
    var fptr = 0;
    var voff = 0;
    
    // XY +
    for(var i = 0; i < XY.faces_num; i++){
      var face = XY.faces[i];
      var ia = face[0] + voff;
      var ib = face[1] + voff;
      var ic = face[2] + voff;
      var id = face[3] + voff;
      this.faces[fptr++] = [ia, ib, ic, id];
    }
    voff += XY.verts_num;
    
    // XY - 
    for(var i = 0; i < XY.faces_num; i++){
      var face = XY.faces[i];
      var ia = face[3] + voff;
      var ib = face[2] + voff;
      var ic = face[1] + voff;
      var id = face[0] + voff;
      this.faces[fptr++] = [ia, ib, ic, id];
    }
    voff += XY.verts_num;
    

    // XZ +
    for(var i = 0; i < XZ.faces_num; i++){
      var face = XZ.faces[i];
      var ia = face[0] + voff;
      var ib = face[1] + voff;
      var ic = face[2] + voff;
      var id = face[3] + voff;
      this.faces[fptr++] = [ia, ib, ic, id];
    }
    voff += XZ.verts_num;
    
    // XZ -
    for(var i = 0; i < XZ.faces_num; i++){
      var face = XZ.faces[i];
      var ia = face[3] + voff;
      var ib = face[2] + voff;
      var ic = face[1] + voff;
      var id = face[0] + voff;
      this.faces[fptr++] = [ia, ib, ic, id];
    }
    voff += XZ.verts_num;
    
    
    // YZ +
    for(var i = 0; i < YZ.faces_num; i++){
      var face = YZ.faces[i];
      var ia = face[0] + voff;
      var ib = face[1] + voff;
      var ic = face[2] + voff;
      var id = face[3] + voff;
      this.faces[fptr++] = [ia, ib, ic, id];
    }
    voff += YZ.verts_num;
    
    // YZ -
    for(var i = 0; i < YZ.faces_num; i++){
      var face = YZ.faces[i];
      var ia = face[3] + voff;
      var ib = face[2] + voff;
      var ic = face[1] + voff;
      var id = face[0] + voff;
      this.faces[fptr++] = [ia, ib, ic, id];
    }
    voff += YZ.verts_num;

    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);
    return this;
  }
}









////////////////////////////////////////////////////////////////////////////////
//
// Sphere
//
////////////////////////////////////////////////////////////////////////////////


Dw.createSphere = function(radius, res1, res2){
  var primitive = new Sphere(radius, res1, res2);
  return primitive.ifs;
};


class Sphere {
  
  constructor(radius, res1, res2){
    
    this.radius = radius = radius === undefined ? 1.0      : radius;
    this.res1   = res1   = res1   === undefined ? 32       : res1;
    this.res2   = res2   = res2   === undefined ? res1 / 2 : res2;
    
    this.verts_num = res1 * res2 + 2;
    this.verts = new Float32Array(this.verts_num * 3);
  
    this.faces_num = res1 * (res2 + 1);
    this.faces = new Array(this.faces_num);
    
    // precompute
    var angle1 = Math.PI * 2 / res1;
    var angle2 = Math.PI * 1 / (res2 + 1);
    
    var cos1 = new Array(res1);
    var sin1 = new Array(res1);
    
    var cos2 = new Array(res2);
    var sin2 = new Array(res2);
    
    for(var i = 0; i < res1; i++){
      var angle = angle1 * i;
      cos1[i] = Math.cos(angle);
      sin1[i] = Math.sin(angle);
    }
    
    for(var j = 0; j < res2; j++){
      var angle = angle2 * (j + 1) - Math.PI/2;
      cos2[j] = Math.cos(angle);
      sin2[j] = Math.sin(angle);
    }
    
    // vertices
    var vptr = 0;
    for(var i = 0; i < res1; i++){
      for(var j = 0; j < res2; j++){
        this.verts[vptr++] = cos1[i] * cos2[j] * radius;
        this.verts[vptr++] = sin1[i] * cos2[j] * radius;
        this.verts[vptr++] =           sin2[j] * radius;
      }
    }
    
    this.verts[vptr++] = 0; this.verts[vptr++] = 0; this.verts[vptr++] = +radius;
    this.verts[vptr++] = 0; this.verts[vptr++] = 0; this.verts[vptr++] = -radius;
    

    // faces
    var fptr = 0;
    for(var i = 0; i < res1; i++){
      for(var j = 0; j < res2-1; j++){
        var i0 = i;
        var i1 = (i+1) % res1;
        var j0 = j;
        var j1 = (j+1) % res2;
        
        var ia = i0 * res2 + j0;
        var ib = i1 * res2 + j0;
        var ic = i1 * res2 + j1;
        var id = i0 * res2 + j1;
        
        this.faces[fptr++] = [ia, ib, ic, id];
      }
    }
    
    // cap top
    for(var i = 0, j = res2-1; i < res1; i++){
      var i0 = i;
      var i1 = (i+1) % res1;
  
      var icap = this.verts_num - 2;
      var ia = i0 * res2 + j;
      var ib = i1 * res2 + j;

      this.faces[fptr++] = [icap , ia, ib];
    }
    
    // cap bot
    for(var i = 0, j = 0; i < res1; i++){
      var i0 = i;
      var i1 = (i+1) % res1;
  
      var icap = this.verts_num - 1;
      var ia = i0 * res2 + j;
      var ib = i1 * res2 + j;

      this.faces[fptr++] = [icap, ib, ia];
    }
    

    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);

    return this;
    
  }
  
}












////////////////////////////////////////////////////////////////////////////////
//
// Torus
//
////////////////////////////////////////////////////////////////////////////////

Dw.createTorus = function(radius1, radius2, res1, res2, torsion){
  var primitive = new Torus(radius1, radius2, res1, res2, torsion);
  return primitive.ifs;
};


class Torus {
  
  constructor(radius1, radius2, res1, res2, torsion = 0){
    
    this.radius1 = radius1 = radius1 === undefined ? 1.00          : radius1;
    this.radius2 = radius2 = radius2 === undefined ? radius1 * 0.4 : radius2;
    this.res1    = res1    = res1    === undefined ? 48            : res1;
    this.res2    = res2    = res2    === undefined ? res1 / 2      : res2;
    
    this.verts_num = res1 * res2;
    this.verts = new Float32Array(this.verts_num * 3);
  
    this.faces_num = this.verts_num;
    this.faces = new Array(this.faces_num);
 
    // precompute
    var angle1 = Math.PI * 2 / res1;
    var angle2 = Math.PI * 2 / res2;
    
    var cos1 = new Array(res1);
    var sin1 = new Array(res1);
    
    var cos2 = new Array(res2);
    var sin2 = new Array(res2);
    
    for(var i = 0; i < res1; i++){
      cos1[i] = Math.cos(i * angle1);
      sin1[i] = Math.sin(i * angle1);
    }
    
    for(var j = 0; j < res2; j++){
      cos2[j] = Math.cos(j * angle2);
      sin2[j] = Math.sin(j * angle2);
    }

    // vertices
    var vptr = 0;
    for(var i = 0; i < res1; i++){
      for(var j = 0; j < res2; j++){
        
        if(torsion){
          cos2[j] = Math.cos(j * angle2 + (torsion * 2 * Math.PI*i) / res1);
          sin2[j] = Math.sin(j * angle2 + (torsion * 2 * Math.PI*i) / res1);
        }
        
        this.verts[vptr++] = cos1[i] * (radius1 + cos2[j] * radius2);
        this.verts[vptr++] = sin1[i] * (radius1 + cos2[j] * radius2);
        this.verts[vptr++] =                      sin2[j] * radius2;
      }
    }
  
    // faces
    for(var i = 0; i < res1; i++){
      for(var j = 0; j < res2; j++){
        var fi = i * res2 + j;
  
        var i0 = i;
        var i1 = (i+1) % res1;
        var j0 = j;
        var j1 = (j+1) % res2;
        
        var ia = i0 * res2 + j0;
        var ib = i1 * res2 + j0;
        var ic = i1 * res2 + j1;
        var id = i0 * res2 + j1;
        
        this.faces[fi] = [ia, ib, ic, id];
      }
    }
    
    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);

    return this;
    
  }
  
}






////////////////////////////////////////////////////////////////////////////////
//
// Icosahedron
//
////////////////////////////////////////////////////////////////////////////////


var GOLDEN_RATIO = (1.0 + Math.sqrt(5.0)) / 2.0;


Dw.createIcosahedron = function(radius, subdiv){
  var primitive = new Icosahedron(radius, subdiv);
  return primitive.ifs;
};

class Icosahedron {
  
  constructor(radius, subdiv){
    
    radius = (radius === undefined) ? 1 : radius;
    subdiv = (subdiv === undefined) ? 1 : Math.min(subdiv, 7);

    this.radius = radius;
    
    this.verts_num = this.getNumVerts(subdiv);
    this.verts     = new Float32Array(this.verts_num * 3);
    this.vptr      = 0;
    
    this.vertscache = {};
    
    var t = GOLDEN_RATIO;

    // XY plane
    this.addVertex(-1, t, 0); //  0
    this.addVertex( 1, t, 0); //  1
    this.addVertex(-1,-t, 0); //  2
    this.addVertex( 1,-t, 0); //  3       
    
    // YZ plane                
    this.addVertex(0,-1, t); //  4
    this.addVertex(0, 1, t); //  5
    this.addVertex(0,-1,-t); //  6
    this.addVertex(0, 1,-t); //  7
                               
    // ZX plane                
    this.addVertex( t, 0,-1); //  8
    this.addVertex( t, 0, 1); //  9
    this.addVertex(-t, 0,-1); // 10
    this.addVertex(-t, 0, 1); // 11


    // 2) create initial face set
    this.subdiv    = 0; 
    this.faces_num = this.getNumFaces(this.subdiv);
    this.faces     = new Array(this.faces_num);
    this.fptr      = 0;

    // http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
    // 5 faces around point 0
    this.addFace(0, 11,  5);
    this.addFace(0,  5,  1);
    this.addFace(0,  1,  7);
    this.addFace(0,  7, 10);
    this.addFace(0, 10, 11);

    // 5 adjacent faces 
    this.addFace( 1,  5, 9);
    this.addFace( 5, 11, 4);
    this.addFace(11, 10, 2);
    this.addFace(10,  7, 6);
    this.addFace( 7,  1, 8);

    // 5 faces around point 3
    this.addFace(3, 9, 4);
    this.addFace(3, 4, 2);
    this.addFace(3, 2, 6);
    this.addFace(3, 6, 8);
    this.addFace(3, 8, 9);

    // 5 adjacent faces 
    this.addFace(4, 9,  5);
    this.addFace(2, 4, 11);
    this.addFace(6, 2, 10);
    this.addFace(8, 6,  7);
    this.addFace(9, 8,  1);


    // 3) iterative subdivision: triangle -> 4 triangles
    while(this.subdiv < subdiv){
      this.applySubdivision();
    }
    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);
        
    return this;
  }
  
  applySubdivision(){
    //
    //       ia
    //       /\
    //   ica/__\iab
    //     /\  /\ 
    //    /__\/__\
    //  ic   ibc  ib
    //
    
    var faces_old_len = this.faces_num;
    var faces_old     = this.faces;
    
    this.faces_num = this.getNumFaces(++this.subdiv);
    this.faces     = new Array(this.faces_num);
    this.fptr      = 0;
    
    for(var j = 0; j < faces_old_len; j++){
      var ia = faces_old[j][0];
      var ib = faces_old[j][1];
      var ic = faces_old[j][2];
      
      var iab = this.getCenter(ia, ib);
      var ibc = this.getCenter(ib, ic);
      var ica = this.getCenter(ic, ia);
    
      this.addFace(ia , iab, ica);
      this.addFace(ib , ibc, iab);
      this.addFace(ic , ica, ibc);
      this.addFace(iab, ibc, ica);
    }
  }
  
  getNumFaces(subdiv){
    var F = 20 * Math.pow(4, subdiv);
    return F;
  }
  
  getNumVerts(subdiv){
    var F = this.getNumFaces(subdiv);
    var E = 3 * F / 2; // isocahedron
    var V = 2 + E - F;
    return V;
  }
  
  addVertex(x, y, z){
    var mult = 1.0;
    if(this.radius){
      mult = this.radius / Math.sqrt(x*x + y*y + z*z);
    } 
    var vid = this.vptr * 3;
    this.verts[vid++] = x * mult;
    this.verts[vid++] = y * mult;
    this.verts[vid++] = z * mult;
    this.vptr++;
  }
  
  addFace(a, b, c){
    this.faces[this.fptr++] = [a,b,c];
  }
  
  getCenter(ia, ib){
    if(ib<ia){var it=ia;ia=ib;ib=it;}
    
    var key = (ib << 16) | ia;
    var vid = this.vertscache[key]; 
    if (vid === undefined) {
      ia *= 3;
      ib *= 3;
      var mx = (this.verts[ia++] + this.verts[ib++]) * 0.5;
      var my = (this.verts[ia++] + this.verts[ib++]) * 0.5;
      var mz = (this.verts[ia++] + this.verts[ib++]) * 0.5;
      this.vertscache[key] = (vid = this.vptr);
      this.addVertex(mx, my, mz);
    }
    return vid;
  }

  
};






////////////////////////////////////////////////////////////////////////////////
//
// Cube
//
////////////////////////////////////////////////////////////////////////////////

Dw.createCube = function(radius, subdiv){
  var primitive = new Cube(radius, subdiv);
  return primitive.ifs;
};


class Cube {
  
   constructor(radius, subdiv){
    
    radius = (radius === undefined) ? 1 : radius;
    subdiv = (subdiv === undefined) ? 1 : Math.min(subdiv, 7);

    this.radius = radius;
    
    this.verts_num = this.getNumVerts(subdiv);
    this.verts     = new Float32Array(this.verts_num * 3);
    this.vptr      = 0;
    
    this.vertscache = {};
    
    var t = 1;

    // XY top plane
    this.addVertex(-t, -t, -t); //  0
    this.addVertex(-t, +t, -t); //  1
    this.addVertex(+t, +t, -t); //  2
    this.addVertex(+t, -t, -t); //  3       
    
    // XY bot plane              
    this.addVertex(-t, -t, +t); //  4
    this.addVertex(-t, +t, +t); //  5
    this.addVertex(+t, +t, +t); //  6
    this.addVertex(+t, -t, +t); //  7


    // 2) create initial face set
    this.subdiv    = 0; 
    this.faces_num = this.getNumFaces(this.subdiv);
    this.faces     = new Array(this.faces_num);
    this.fptr      = 0;

    this.addFace(0, 1, 2, 3); // XYn
    this.addFace(7, 6, 5, 4); // XYp
    this.addFace(0, 3, 7, 4); // YZn
    this.addFace(2, 1, 5, 6); // YZp
    this.addFace(1, 0, 4, 5); // XZn
    this.addFace(3, 2, 6, 7); // XZp
    

    // 3) iterative subdivision: quads -> 4 quads
    while(this.subdiv < subdiv){
      this.applySubdivision();
    }
    
    this.ifs = new Dw.IFS(this.verts, this.verts_num, this.faces, this.faces_num, this);
    
    return this;
  }
  
  applySubdivision(){
    //  ia----iab----ib
    //   |     |     |
    //   |     |     |   
    //  ida----ie----ibc
    //   |     |     |
    //   |     |     |
    //  id----icd----ic
    
    var faces_old_len = this.faces_num;
    var faces_old     = this.faces;

    this.faces_num = this.getNumFaces(++this.subdiv);
    this.faces     = new Array(this.faces_num);
    this.fptr      = 0;
    
    for(var j = 0; j < faces_old_len; j++){
      var ia = faces_old[j][0];
      var ib = faces_old[j][1];
      var ic = faces_old[j][2];
      var id = faces_old[j][3];
      var ie = this.addCenter(ia, ib, ic, id);
      
      var iab = this.getCenter(ia, ib);
      var ibc = this.getCenter(ib, ic);
      var icd = this.getCenter(ic, id);
      var ida = this.getCenter(id, ia);

      this.addFace(ia, iab, ie, ida);
      this.addFace(ib, ibc, ie, iab);
      this.addFace(ic, icd, ie, ibc);
      this.addFace(id, ida, ie, icd);
    }
  }
  
  
  getNumFaces(subdiv){
    var F = 6 * Math.pow(4, subdiv);
    return F;
  }
  
  getNumVerts(subdiv){
    var F = this.getNumFaces(subdiv);
    var E = 4 * F / 2;
    var V = 2 + E - F;
    return V;
  }
  
  addVertex(x, y, z){
    var mult = 1.0;
    if(this.radius){
      mult = this.radius / Math.sqrt(x*x + y*y + z*z);
    } 
    var vid = this.vptr * 3;
    this.verts[vid++] = x * mult;
    this.verts[vid++] = y * mult;
    this.verts[vid++] = z * mult;
    this.vptr++;
  }
  
  addFace(a, b, c, d){
    this.faces[this.fptr++] = [a,b,c,d];
  }
  
  addCenter(ia, ib, ic, id){
    ia *= 3; ib *= 3; ic *= 3; id *= 3;
    var mx = (this.verts[ia++] + this.verts[ib++] + this.verts[ic++] + this.verts[id++]) * 0.25;
    var my = (this.verts[ia++] + this.verts[ib++] + this.verts[ic++] + this.verts[id++]) * 0.25;
    var mz = (this.verts[ia++] + this.verts[ib++] + this.verts[ic++] + this.verts[id++]) * 0.25;
    this.addVertex(mx, my, mz);
    return this.vptr - 1;
  }
  
  getCenter(ia, ib){
    if(ib<ia){var it=ia;ia=ib;ib=it;}
    
    var key = (ib << 16) | ia; 
    var vid = this.vertscache[key]; 
    if (vid === undefined) {
      ia *= 3;
      ib *= 3;
      var mx = (this.verts[ia++] + this.verts[ib++]) * 0.5;
      var my = (this.verts[ia++] + this.verts[ib++]) * 0.5;
      var mz = (this.verts[ia++] + this.verts[ib++]) * 0.5;
      this.vertscache[key] = (vid = this.vptr);
      this.addVertex(mx, my, mz);
    }
    return vid;
  }
  
};

























////////////////////////////////////////////////////////////////////////////////
//
// HalfEdge
//
////////////////////////////////////////////////////////////////////////////////


var He = {
  
  Edge : class Edge {
    constructor(vert){
      this.pair = 0;
      this.next = 0;
      this.vert = vert;
      this.vert.edge = this;
      this.FLAG = 0; // can be used for anything. e.g. bitmask, pointer, boolean etc...
      this.user = 0; // user pointer
    }
    dispose(){
      delete this.pair;
      delete this.next;
      delete this.vert;
      delete this.user;
      delete this.FLAG;
    }
  }, // Edge

  
  Face : class Face {
    constructor(edge){
      this.edge = edge;
      this.FLAG = 0;
    }
    dispose(){
      delete this.edge;
      delete this.FLAG;
    }
  }, // Face

  
  Vert : class Vert {
    constructor(idx){
      this.edge = 0;
      this.FLAG = 0;
      this.idx = idx;  // vertex array index
      this.user = 0;; // user pointer
    }
    dispose(){
      delete this.edge;
      delete this.user;
      delete this.idx;
      delete this.FLAG;
    }
  }, // Vert
  
  
  Edgemap : class {
    constructor(){
      this.map = {};
    }
    putEdge(edge){
      var va = edge.vert;
      var vb = edge.next.vert;
      var ID = (va.idx << 16) | vb.idx; // TODO hash function
      this.map[ID] = edge;
    }
    getPair(edge){
      var va = edge.next.vert;
      var vb = edge.vert;
      var ID = (va.idx << 16) | vb.idx; // TODO hash function
      return this.map[ID];
    }
  }, // Edgemap
  
  
  Mesh : class Mesh {
    
    constructor(ifs){
      
      // members
      this.ifs = ifs;
      this.edges;
      this.verts; // not really needed
      this.faces; // not really needed
      this.verts_per_face = -1; // eg: 3 = triangle, 4 = quad, -1 = any polygon
      
      
   
      // IFS data
      var ifs_faces   = ifs.faces;
      var faces_count = ifs.faces_num;
      var verts_count = ifs.verts_num;
      var edges_count = 0;
      
      // - count number of required edges
      // - check if all faces have the same amount of vertices
      //   e.g. all triangles, quads, or just polygons
      var verts_per_face = ifs_faces[0].length;
      this.verts_per_face = verts_per_face;
      for(var i = 0; i < faces_count; i++){
        verts_per_face = ifs_faces[i].length;
        edges_count += verts_per_face;
        if(this.verts_per_face != verts_per_face) { 
          this.verts_per_face = -1; 
        }
      }

      // allocate
      var edges = this.edges = new Array(edges_count);
      var faces = this.faces = new Array(faces_count);
      var verts = this.verts = new Array(verts_count);
      
      // edgemap, for finding edge-pairs
      this.edgemap = new He.Edgemap();
      
      // init vertices
      for(var i = 0; i < verts_count; i++){
        verts[i] = new He.Vert(i);
      }
      
      // setup edges/faces
      for(var i = 0, edge_id = 0; i < faces_count; i++){
        var num_edges = ifs_faces[i].length;
        
        // create face-edges
        for(var j = 0; j < num_edges; j++){
          edges[edge_id + j] = new He.Edge(verts[ifs_faces[i][j]]); 
        }
        
        // create links + fill edgemap
        for(var j = 0; j < num_edges; j++){
          var j0 = edge_id + (j+0) % num_edges;
          var j1 = edge_id + (j+1) % num_edges;
          edges[j0].next = edges[j1]; // next-link
        }
        
        faces[i] = new He.Face(edges[edge_id]); // face-link
        edge_id += num_edges;
      }
      
      // fill edge map
      for(var i = 0; i < edges_count; i++){
        this.edgemap.putEdge(edges[i]); // pair-link
      }

      // setup edge-pairs
      for(var i = 0; i < edges_count; i++){
        edges[i].pair = this.edgemap.getPair(edges[i]); // pair-link
      }
      
    }
    
    static getVertexEdgeList(vert, edge_list){
      const edge_stop = vert.edge.pair;
      var egde = edge_stop;
      edge_list = edge_list || [];
      var ei = 0;
      do{
        if(!egde) break;
        edge_list[ei++] = egde;
      } while((egde = egde.next.pair) !== edge_stop);

      return edge_list;
    }
    
    
    
  }, // Mesh
  
  
  
};


















out.IFS = IFS;
out.triangleNormal = triangleNormal;
out.He = He;

out.Icosahedron = Icosahedron;
out.Cube = Cube;
out.Torus = Torus;
out.Sphere = Sphere;
out.Box = Box;
out.Plane = Plane;
out.Circle = Circle;
out.Tube = Tube;
out.Cylinder = Cylinder;

return out;

})(Dw);

