class ContextAdapter{
  constructor(nodeCanvas){
    this.canvas = nodeCanvas;
    this.nodeContext = this.canvas.getContext('2d');
  }
  save(){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("save("+args+")");
  }
  restore(){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("restore("+args+")");
  }
  scale(x,y){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("scale("+args+")");
  }
  rotate(angle){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("rotate("+args+")");
  }
  translate(x,y){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("translate("+args+")");
  }
  transform(a,b,c,d,e,f){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("transform("+args+")");
  }
  setTransform(a,b,c,d,e,f){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("setTransform("+args+")");
  }
  clearRect(x,y,w,h){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("clearRect("+args+")");
  }
  fillRect(x,y,w,h){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("fillRect("+args+")");
  }
  beginPath(){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("beginPath("+args+")");
  }
  fill(){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("fill("+args+")");
  }
  stroke(){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("stroke("+args+")");
  }
  clip(){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("clip("+args+")");
  }
  fillText(text, x,y,maxWidth){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("fillText("+args+")");
  }
  measureText(text){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("measureText("+args+")");
    var ret = this.nodeContext.measureText.apply(this.nodeContext,Array.prototype.splice.call(arguments, 0));

    return ret;
  }
  bezierCurveTo(){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("bezierCurveTo("+args+")");
  }
  drawImage(image, dx,dy){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("drawImage("+args+")");
    var CanvasAdapter = require('../canvas_adapter.js');
    var ret = this.nodeContext.drawImage(image instanceof CanvasAdapter ? image.nodeCanvas : image,dx,dy);
    // fs.writeFileSync("test/images/img"+(i++)+".png",ctx.canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64'); 

    return ret;
  }
  // drawImage(image, dx,dy,dw,dh){
  //   var = arguments.callee.toString().substr('function '.length);
  //   = substr(0,indexOf('('));
  //   var args = Array.prototype.slice.call(arguments,1).join(',');
  //   console.log("("+args+")");
  // }
  // drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh){
  //   var = arguments.callee.toString().substr('function '.length);
  //   = substr(0,indexOf('('));
  //   var args = Array.prototype.slice.call(arguments,1).join(',');
  //   console.log("("+args+")");
  // }
  createImageData(sw,sh){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("createImageData("+args+")");
    var ret = this.nodeContext.createImageData.apply(this.nodeContext,Array.prototype.splice.call(arguments, 0));
    // fs.writeFileSync("test/images/img"+(i++)+".png",ctx.canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64'); 

    return ret;
  }
  // createImageData(imageData){
  //   var = arguments.callee.toString().substr('function '.length);
  //   = substr(0,indexOf('('));
  //   var args = Array.prototype.slice.call(arguments,1).join(',');
  //   console.log("("+args+")");
  // }
  getImageData(sx,sy,sw,sh){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("getImageData("+args+")");
  }
  putImageData(imageData,dx,dy){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("putImageData("+args+")");
    var ret = this.nodeContext.putImageData.apply(this.nodeContext,Array.prototype.splice.call(arguments, 0));
    // fs.writeFileSync("test/images/img"+(i++)+".png",ctx.canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64'); 

    return ret;
  }
  // putImageData(imageData,dx,dy,dirtyX,dirtyY,dirtyWidth,dirtyHeight){
  //   var = arguments.callee.toString().substr('function '.length);
  //   = substr(0,indexOf('('));
  //   var args = Array.prototype.slice.call(arguments,1).join(',');
  //   console.log("("+args+")");
  // }
  closePath(){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("closePath("+args+")");
  }
  moveTo(x,y){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("moveTo("+args+")");
  }
  lineTo(x,y){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("lineTo("+args+")");
  }
  rect(x,y,w,h){
    var args = Array.prototype.slice.call(arguments,1).join(',');
    console.log("rect("+args+")");
  }
}
module.exports = ContextAdapter;