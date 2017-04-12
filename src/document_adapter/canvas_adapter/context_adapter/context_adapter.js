var math = require('mathjs');
var Canvas = require('canvas');
var Image = require('canvas').Image;

// extract rgb values
var rgb = /rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
// detect sizing
var size = /(\d*\.{0,1}\d*)px\s/;

/**
 * Adapts to the 2DContext Interface, uses node canvasand mathjs for heavy lifting on processing
 */
class ContextAdapter {
  /**
   * Setup default values and attach nodeCanvas, JSCanvas 
   * @param  {Object} nodeCanvas 
   * @param  {Object} adapter    
   * @param  {Object} jsCanvas          
   */
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
  /**
   * Scale the current transform by x and y
   * @param  {Number} x 
   * @param  {Number} y 
   */
  scale(x, y) {
    var mult = math.matrix([
      [x, 0, 0],
      [0, y, 0],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
  }
  /**
   * Currently Unimplemented
   * @param  {Number} angle [
   */
  rotate(angle) {
  }
  /**
   * Translate the current transform
   * @param  {Number} x 
   * @param  {Number} y 
   */
  translate(x, y) {
    var mult = math.matrix([
      [1, 0, x],
      [0, 1, y],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
  }
  /**
   * Transform the matrix
   * @param  {Number} a 
   * @param  {Number} b 
   * @param  {Number} c 
   * @param  {Number} d 
   * @param  {Number} e 
   * @param  {Number} f 
   */
  transform(a, b, c, d, e, f) {
    //See https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
    var mult = math.matrix([
      [a, c, e],
      [b, d, f],
      [0, 0, 1]
    ]);
    this.transformMatrix = math.multiply(this.transformMatrix, mult);
  }
  /**
   * Set the matrix
   * @param  {Number} a 
   * @param  {Number} b 
   * @param  {Number} c 
   * @param  {Number} d 
   * @param  {Number} e 
   * @param  {Number} f 
   */
  setTransform(a, b, c, d, e, f) {
    this.transformMatrix = math.matrix([
      [a, c, e],
      [b, d, f],
      [0, 0, 1]
    ]);
  }
  
  /**
   * Unimplemented
   */
  clearRect(x, y, w, h) {
  }
  /**
   * Unimplemented
   */
  fillRect(x, y, w, h) {
  }
  /**
   * Internally acts like a stroke based on path information
   * @return {[type]} [description]
   */
  fill() {
    this.stroke();
  }
  /**
   * Unimplemented
   */
  clip() {
  }
  /**
   * Add text to a screen, almost always a character
   * Very hot need to optimize
   * @param  {String} text     
   * @param  {Number} x        
   * @param  {Number} y        
   * @param  {Number} maxWidth 
   */
  fillText(text, x, y, maxWidth) {
    // get the actual page postiion
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
    
    // get scale of the text
    var scaleFactorHeight = this.transformMatrix.subset(math.index(1,1));
    var scaleFactorWidth = this.transformMatrix.subset(math.index(0,0));
    
    // determine actual height, usually this means its usuing system font
    var height = scaleFactorHeight*Number(this.font.match(size)[1]);
    
    // font info, scaleFactorWidth is to reduce processing of character widths
    // widths will be calculated in analysis phase on all unique characters
    var font = {
      name: this.font.replace(size, ' '+Math.ceil(height)+"px "),
      scaleFactorWidth: scaleFactorWidth,
      height: Math.ceil(height),
    }
    
    // make sure the text wasn't intended to be in an image
    if(this.jsCanvas){
      this.jsCanvas.addCharacter(text, nw.subset(math.index(0)), nw.subset(math.index(1)), font);
    }
  }
  /**
   * Get Text Measurement information to calculate height and widths etc using the node canvas
   * @param  {String} text 
   * @return {TextMetric}      
   */
  measureText(text) {
    this.nodeContext.font = this.font;
    var ret = this.nodeContext.measureText.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));

    return ret;
  }
  /**
   * Unimplemented
   */
  bezierCurveTo() {
  }
  
  /**
   * Draw an Image and appropriately crop it
   * @param  {Object} image 
   */
  drawImage(image) {
    // get all the arguments
    var args = Array.prototype.slice.call(arguments, 0);
    // set all values initially to zero as default
    var x, y, sx, sy, sw, sh, dx, dy, dw, dh;
    x = y = sx = sy = sw = sh = dx = dy = dw = dh = 0;
    var ret;
    // get either the nodecanvas data or an actual image
    var image = image.type === "CanvasAdapter" ? image.nodeCanvas : image
    
    // get the different arguments, ignore dx and dy and store it in x,y
    // we want the image to be positioned at 0,0 on our destination image so it looks right
    // but we need the x,y position on the page for later processing
    // We write to the nodeContext to get the image data URL from it.
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
    
    // make the commands are directed at this not the nodecanvas
    if (this.jsCanvas) {
      // origin of the image      
      var vectorOrigin = math.matrix([x, y, 1]);
      // opposite corner of the origin
      var vectorXYCorner = math.matrix([x + dw, y + dh, 1]);
      
      //transform the positions to get actual page position
      vectorOrigin = math.multiply(this.transformMatrix, vectorOrigin);
      vectorXYCorner = math.multiply(this.transformMatrix, vectorXYCorner);
      
      // get the transformed coordinates and actual width and height
      var nx, ny, width, height;
      nx = vectorOrigin.subset(math.index(0));
      ny = vectorOrigin.subset(math.index(1));
      width = math.abs(vectorXYCorner.subset(math.index(0)) - nx);
      height = math.abs(vectorXYCorner.subset(math.index(1)) - ny);
      
      // if it has a toDataURL function we can immediatly get the image
      if(image.toDataURL){
       this.jsCanvas.addImage(image.toDataURL("image/png"), nx, ny, width, height);           
      }else{
       // create a temporary canvas to get the data url
        var tempContext = (new Canvas(dw,dh)).getContext('2d');
        tempContext.drawImage(image,0,0)        
        this.jsCanvas.addImage(tempContext.canvas.toDataURL("image/png"), nx, ny, width, height);  
      }
       
    }else{
      // return the result of the nodecanvas opperation so that images are properly built
      // many times images and built in chunks for performance reasons
      return ret;
    }
  }
  /**
   * Use node canvas to handle creating images
   * @param  {Number} sw 
   * @param  {Number} sh 
   * @return {Object}    Data return by nodecanvas
   */
  createImageData(sw, sh) {
    var ret = this.nodeContext.createImageData.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));
    return ret;
  }
  /**
   * Use node canvas to handle this
   * @param  {Number} sx 
   * @param  {Number} sy 
   * @param  {Number} sw 
   * @param  {Number} sh 
   * @return {Object}    Data return by nodecanvas
   */
  getImageData(sx, sy, sw, sh) {
    var ret = this.nodeContext.getImageData.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));
    return ret;
  }
  /**
   * Use node canvas to handle this
   * @param  {Object} imageData 
   * @param  {Number} x         
   * @param  {Number} y         
   * @return {Object}    Data return by nodecanvas
   */
  putImageData(imageData, x, y) {
    var ret = this.nodeContext.putImageData.apply(this.nodeContext, Array.prototype.splice.call(arguments, 0));
    return ret;
  }
  /**
   * Close a subpath
   */
  closePath() {
    var subpath = this.path.find(p=>p.open);
    if(subpath){
      subpath.open = false;
    }
  }
  /**
   * Adds a new subpath or creates a path if it doesn't exist
   * @param  {Number} x 
   * @param  {Number} y 
   */
  moveTo(x, y) {
    // Get actual page coordinates
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
    // path doesnt exist, create it
    if(!this.path){
      this.path = [];
    }
    this.path.push(subpath);
  }
  /**
   * Clear the Path
   */
  beginPath() {
    this.path = [];
  }
  /**
   * Add a Line to the current open path
   * @param  {Number} x New Coordinate
   * @param  {Number} y New Coordinate
   */
  lineTo(x, y) {
    // find current subpath
    var subpath = this.path.find(p=>p.open);
    // If no path exists just set inital position at 0,0
    if(this.path.length == 0 || subpath == null){
      this.moveTo(0,0);
      subpath = this.path.find(p=>p.open);
    }
    // find actual page coordinates
    var vector = math.matrix([x, y, 1]);
    var nw = math.multiply(this.transformMatrix, vector);
    
    // Add the line to the subpath  
    var line = {
      x: nw.subset(math.index(0)),
      y: nw.subset(math.index(1))
    };
    subpath.path.push(line);
  }
  /**
   * Unimplemented
   */
  strokeText(){
  }
  /**
   * Draw a line usually and get color information
   * @return {[type]} [description]
   */
  stroke() {
    if(this.jsCanvas){   
      var r=0;
      var g=0;
      var b=0;   
      // Get color information, format sometimes differs
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
      // if its invisible we ignore it
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
  /**
  * Unimplemented
  */
  rect(x, y, w, h) {
    
  }
  /**
   * For Debugging Purposes, prints arguments passed to function
   * @param  {Array} args Arguments array
   */
  _printArgs(args){
    args = Array.prototype.slice.call(args, 0).join(',');
    var stack = new Error().stack,
    caller = stack.split('\n')[2].trim().match(/ContextAdapter\.([a-zA-Z]+)/)[1];
    console.log(caller+"("+args+")");
  }
}
module.exports = ContextAdapter;