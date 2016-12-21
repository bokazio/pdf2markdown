var math = require('mathjs');
var fs = require('fs');
var rgb = /rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
class ContextAdapter {
  constructor(nodeCanvas, adapter, jsCanvas) {
    this.canvas = nodeCanvas;
    this.adapter = adapter;
    this.jsCanvas = jsCanvas;
    this.nodeContext = this.canvas.getContext('2d');
    this.transformMatrix = math.eye(3);
    this.transformStack = [];
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
    // console.log("fillRect("+args+")");
  }
  
  fill() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("fill("+args+")");
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
    this.jsCanvas.addCharacter(text, nw.subset(math.index(0)), nw.subset(math.index(1)), this.font);
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
  drawImage(image) {
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
      this.jsCanvas.addImage(image.toDataURL ? image.toDataURL("image/png") : this.nodeContext.canvas.toDataURL("image/png"), x, y, width, height);
    }
    return ret;
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
  }
  moveTo(x, y) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    // console.log("moveTo("+args+")");
  }
  beginPath() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    this.path = [];
    
    var init = math.matrix([0, 0, 1]);
    var nw1 = math.multiply(this.transformMatrix, init);
      
    var line = {x: nw1.subset(math.index(0)), y: nw1.subset(math.index(1))};
    this.path.push(line);

  }
  lineTo(x, y) {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
    // console.log("actual coord: "+ nw);

    if (this.path) {      
      var line = {x: nw.subset(math.index(0)), y: nw.subset(math.index(1))};
      this.path.push(line);
    }
    // console.log("lineTo("+args+")");
  }
  stroke() {
    var args = Array.prototype.slice.call(arguments, 0).join(',');
    
    if(this.jsCanvas && this.fillStyle){
      var matches = this.fillStyle.match(rgb);
      var r=0;
      var g=0;
      var b=0;
      if(matches.length==4){
        r = matches[1];
        g = matches[2];
        b = matches[3];
      }
      if(r !== "255" || g !== "255" || b !== "255"){      
        this.jsCanvas.addLine(this.path,{
          fillStyle: {r:r,g:g,b:b},
          lineWidth: this.lineWidth,
          globalAlpha: this.globalAlpha
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