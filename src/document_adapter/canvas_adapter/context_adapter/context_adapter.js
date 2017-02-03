var math = require('mathjs');
var fs = require('fs');
var rgb = /rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
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
  }
  save() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("save("+args+")");
    this.transformStack.push(this.transformMatrix);
  }
  restore() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("restore("+args+")");
    this.transformMatrix = this.transformStack.pop();
  }
  scale(x, y) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("scale("+args+")");
    var mult = math.matrix([
      [x, 0, 0],
      [0, y, 0],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
    // console.log("transformMatrix: "+ this.transformMatrix);
  }
  rotate(angle) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("rotate("+args+")");
  }
  translate(x, y) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("translate("+args+")");
    var mult = math.matrix([
      [1, 0, x],
      [0, 1, y],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
    // console.log("transformMatrix: "+ this.transformMatrix);
  }
  transform(a, b, c, d, e, f) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("transform("+args+")");
    //See https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations
    var mult = math.matrix([
      [a, c, e],
      [b, d, f],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
    // console.log("transformMatrix: "+ this.transformMatrix);
  }
  setTransform(a, b, c, d, e, f) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("setTransform("+args+")");
  }
  clearRect(x, y, w, h) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("clearRect("+args+")");
  }
  fillRect(x, y, w, h) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.error("fillRect("+args+")");
  }
  
  fill() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("fill("+args+")");
    this.stroke();
  }
  
  clip() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("clip("+args+")");
  }
  fillText(text, x, y, maxWidth) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("fillText("+args+")");
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
    // console.log("actual coord: "+ nw);
    this.jsCanvas.addCharacter(text, nw.subset(math.index(0)), nw.subset(math.index(1)), this.font,this.lineWidth);
    // console.log(this.jsCanvas);
  }
  measureText(text) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("measureText("+args+")");
    var ret = this.nodeContext.measureText.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));

    return ret;
  }
  bezierCurveTo() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("bezierCurveTo("+args+")");
  }
  async drawImage(image) {
    var args = Array.prototype.slice.call(arguments, 0);
    var sx, sy, sw, sh, dx, dy, dw, dh = 0;
    var ret;
    var image = image.type === "CanvasAdapter" ? image.nodeCanvas : image
    switch (args.length) {
      case 3:
        dx = args[1];
        dy = args[2];
        dw = image.width;
        dh = image.height;
        ret = this.nodeContext.drawImage(image, dx, dy);
        break;
      case 5:
        dx = args[1];
        dy = args[2];
        dw = args[3];
        dh = args[4];
        ret = this.nodeContext.drawImage(image, dx, dy, dw, dh);
        break;
      case 9:
        sx = args[1];
        sy = args[2];
        sw = args[3];
        sh = args[4];
        dx = args[5];
        dy = args[6];
        dw = args[7];
        dh = args[8];
        ret = this.nodeContext.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
        break;
    }
    // console.log("drawImage("+args.slice(1).join(',')+")");
    // fs.writeFileSync("test/images/img"+(i++)+".png",ctx.canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64'); 
    if (this.jsCanvas) {
      var vectorOrigin = math.matrix([dx, dy, 1]);
      var vectorXYCorner = math.matrix([dx + dw, dy + dh, 1]);
      vectorOrigin = math.multiply(this.transformMatrix, vectorOrigin);
      vectorXYCorner = math.multiply(this.transformMatrix, vectorXYCorner);
      var x, y, width, height;
      x = vectorOrigin.subset(math.index(0));
      y = vectorOrigin.subset(math.index(1));
      width = math.abs(vectorXYCorner.subset(math.index(0)) - x);
      height = math.abs(vectorXYCorner.subset(math.index(1)) - y);
      var tempContext = new Canvas(width,height);
      var img = image.toDataURL ? image.toDataURL("image/png") : this.nodeContext.canvas.toDataURL("image/png");
      
      
      if(tempContext.toDataURL("image/png") == img || this.isTransparent(img,width,height) ){        
        // console.log("blank!!");
      }else{
        this.jsCanvas.addImage(img, x, y, width, height);  
      }
      
    }
    return ret;
  }
  isTransparent(image,width,height){
    var tempCanvas = new Canvas(width,height);
    var tempContext = tempCanvas.getContext('2d');
    var img = new Image();
    img.src = image;
    tempContext.drawImage(img,0,0);
    var imgData = tempContext.getImageData(0,0,width,height);
    var data=imgData.data;
    for(var i =0; i< data.length; i+=4){
      if(data[i+3] < 255){
        return false;
      }
    }
    // console.log("transparent");
    return true;
  }
  createImageData(sw, sh) {
    var args = Array.prototype.slice.call(arguments, 1).join(',');
    // console.log("createImageData("+args+")");
    var ret = this.nodeContext.createImageData.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));
    // fs.writeFileSync("test/images/img"+(i++)+".png",ctx.canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64'); 

    return ret;
  }
  getImageData(sx, sy, sw, sh) {
    var args = Array.prototype.slice.call(arguments, 1).join(',');
    // console.log("getImageData("+args+")");
  }
  putImageData(imageData, x, y) {
      var args = Array.prototype.slice.call(arguments, 1).join(',');
      // console.log("putImageData("+args+")");
      var ret = this.nodeContext.putImageData.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));
      // fs.writeFileSync("test/images/img"+(i++)+".png",ctx.canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64'); 

      return ret;
    }
    // putImageData(imageData,dx,dy,dirtyX,dirtyY,dirtyWidth,dirtyHeight){
    //   var = arguments.callee.toString().substr('function '.length);
    //   = substr(0,indexOf('('));
    //   var args = Array.prototype.slice.call(arguments,1).join(',');
    // console.log("("+args+")");
    // }
  closePath() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("closePath("+args+")");
    var subpath = this.path.find(p=>p.open);
    if(subpath){
      subpath.open = false;
    }
  }
  moveTo(x, y) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
    // console.log("moveTo("+args+")");
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
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("beginPath("+args+")");
    this.path = [];

  }
  lineTo(x, y) {
    var subpath = this.path.find(p=>p.open);
    if(this.path.length == 0 || subpath == null){
      this.moveTo(0,0);
      subpath = this.path.find(p=>p.open);
    }
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("lineTo("+args+")");
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
      
    var line = {
      x: nw.subset(math.index(0)),
      y: nw.subset(math.index(1))
    };
    subpath.path.push(line);
  }
  strokeText(){
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    console.log("strokeText("+args+")");
  }
  stroke() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("stroke\n\n");
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
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("rect("+args+")");
  }
  getJSONCanvas() {
    return this.JSCanvas;
  }
}
module.exports = ContextAdapter;