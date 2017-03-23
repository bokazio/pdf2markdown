var math = require('mathjs');
var fs = require('fs');
var rgb = /rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
var size = /(\d*\.{0,1}\d*)px\s/;
var Canvas = require('canvas');
var Image = require('canvas').Image;
class ContextAdapter {
  constructor(nodeCanvas, adapter, jsCanvas) {
    this.canvas = nodeCanvas;
    this.adapter = adapter;
    this.jsCanvas = jsCanvas;
    this.nodeContext = this.canvas.getContext('2d');
    this.transformMatrix = math.eye(3);
    this.transformStack = [];
    this.strokeStyle = "#000000";
    this.fillStyle = "#000000";
    this.globalAlpha = 1;
    this._font = "10px sans-serif";
    this.font = "10px sans-serif";
  }
  /**
   * Push matrix on stack
   */
  save() {
    this.transformStack.push(this.transformMatrix);
  }
  /**
   * Push matrix on stack
   */
  restore() {
    this.transformMatrix = this.transformStack.pop();
  }
  scale(x, y) {
    var mult = math.matrix([
      [x, 0, 0],
      [0, y, 0],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
  }
  rotate(angle) {
  }
  translate(x, y) {
    var mult = math.matrix([
      [1, 0, x],
      [0, 1, y],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
  }
  transform(a, b, c, d, e, f) {
    //See https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations
    var mult = math.matrix([
      [a, c, e],
      [b, d, f],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
  }
  setTransform(a, b, c, d, e, f) {
    this.transformMatrix = math.matrix([
      [a, c, e],
      [b, d, f],
      [0, 0, 1]
    ]);
  }
  clearRect(x, y, w, h) {
  }
  fillRect(x, y, w, h) {
  }
  
  fill() {
    this.stroke();
  }
  
  clip() {
  }
  fillText(text, x, y, maxWidth) {
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
    
    
    var d = this.transformMatrix.subset(math.index(1,1));
    var a = this.transformMatrix.subset(math.index(0,0));
    
    
    var height = d*Number(this.font.match(size)[1]);
    
    var temp = this.font;
    
    this.font = this.font.replace(size, ' '+Math.ceil(height)+"px ");
    
    
    var mTextMetrics = this.measureText("M");
    var spaceTextMetrics = this.measureText(" ");
    
    this.font = temp;
    var f = {
      name: this.font.replace(size, ' '+Math.ceil(height)+"px "),
      spaceWidth: a,
      height: Math.ceil(height),
    }
    
    
    if(this.jsCanvas){
      this.jsCanvas.addCharacter(text, nw.subset(math.index(0)), nw.subset(math.index(1)), f);
    }
  }
  measureText(text) {
    this.nodeContext.font = this.font;
    var ret = this.nodeContext.measureText.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));

    return ret;
  }
  bezierCurveTo() {
  }
  drawImage(image) {
    var args = Array.prototype.slice.call(arguments, 0);
    var x, y, sx, sy, sw, sh, dx, dy, dw, dh;
    x = y = sx = sy = sw = sh = dx = dy = dw = dh = 0;
    var ret;
    var image = image.type === "CanvasAdapter" ? image.nodeCanvas : image
    switch (args.length) {
      case 3:
        x = args[1];
        y = args[2];
        dw = image.width;
        dh = image.height;
        ret = this.nodeContext.drawImage(image, dx, dy);
        
        break;
      case 5:
        x = args[1];
        y = args[2];
        dw = args[3];
        dh = args[4];
        ret = this.nodeContext.drawImage(image, dx, dy, dw, dh);
        break;
      case 9:
        sx = args[1];
        sy = args[2];
        sw = args[3];
        sh = args[4];
        x = args[5];
        y = args[6];
        dw = args[7];
        dh = args[8];
        ret = this.nodeContext.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
        break;
    }
    
    
    if (this.jsCanvas) {
      var vectorOrigin = math.matrix([x, y, 1]);
      var vectorXYCorner = math.matrix([x + dw, y + dh, 1]);
      vectorOrigin = math.multiply(this.transformMatrix, vectorOrigin);
      vectorXYCorner = math.multiply(this.transformMatrix, vectorXYCorner);
      var nx, ny, width, height;
      nx = vectorOrigin.subset(math.index(0));
      ny = vectorOrigin.subset(math.index(1));
      width = math.abs(vectorXYCorner.subset(math.index(0)) - nx);
      height = math.abs(vectorXYCorner.subset(math.index(1)) - ny);
      
       if(image.toDataURL){
        this.jsCanvas.addImage(image.toDataURL("image/png"), nx, ny, width, height);           
       }else{
         var tempContext = (new Canvas(dw,dh)).getContext('2d');
         tempContext.drawImage(image,0,0)// sx, sy, sw, sh, dx, dy, dw, dh);         
         this.jsCanvas.addImage(tempContext.canvas.toDataURL("image/png"), nx, ny, width, height);  
       }
       this._printArgs(arguments);
    }else{
      return ret;
    }
  }
  createImageData(sw, sh) {
    var ret = this.nodeContext.createImageData.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));
    return ret;
  }
  getImageData(sx, sy, sw, sh) {
    var ret = this.nodeContext.getImageData.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));
    return ret;
  }
  putImageData(imageData, x, y) {
    var ret = this.nodeContext.putImageData.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));
    return ret;
  }
    
  closePath() {
    var subpath = this.path.find(p=>p.open);
    if(subpath){
      subpath.open = false;
    }
  }
  moveTo(x, y) {
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
    var subpath = {
      path: [
        {
          x: nw.subset(math.index(0)),
          y: nw.subset(math.index(1))}
      ], 
      open: true
    };
    if(!this.path){
      this.path = [];
    }
    this.path.push(subpath);
  }
  beginPath() {
    this.path = [];
  }
  lineTo(x, y) {
    var subpath = this.path.find(p=>p.open);
    if(this.path.length == 0 || subpath == null){
      this.moveTo(0,0);
      subpath = this.path.find(p=>p.open);
    }
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
      
    var line = {
      x: nw.subset(math.index(0)),
      y: nw.subset(math.index(1))
    };
    subpath.path.push(line);
  }
  strokeText(){
  }
  stroke() {
    if(this.jsCanvas){   
      var r=0;
      var g=0;
      var b=0;   
      var matches = this.strokeStyle.match(rgb);
      if(!matches || matches.length != 4){
        r = parseInt(this.strokeStyle.substr(1,2),16);
        g = parseInt(this.strokeStyle.substr(3,2),16);
        b = parseInt(this.strokeStyle.substr(5,2),16);
      }else{
        r = matches[1];
        g = matches[2];
        b = matches[3];
      }      
      if(r !== "255" || g !== "255" || b !== "255"){      
        this.jsCanvas.addLine(this.path,{
          r:r,
          g:g,
          b:b,
          lineWidth: this.lineWidth,
          alpha: this.globalAlpha
        });
      }
    }
  }
  rect(x, y, w, h) {
    
  }
  getJSONCanvas() {
    return this.JSCanvas;
  }
  _printArgs(args){
    args = Array.prototype.slice.call(args, 0).join(',');
    var stack = new Error().stack,
    caller = stack.split('\n')[2].trim().match(/ContextAdapter\.([a-zA-Z]+)/)[1];
    console.log(caller+"("+args+")");
  }
}
module.exports = ContextAdapter;