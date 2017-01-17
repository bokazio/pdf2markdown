//var Character = require('./js_canvas_elements/character.js');
var timer = require('timers');
var md5 = require('blueimp-md5');
var fs = require('fs');
var Logger = require('../../../logger/logger.js');
class JSCanvas{
  static addLine(path,info){
    for(var i = 0; i < path.length; i++){
      for(var j = 1; j < path[i].path.length; j++){
        JSCanvas.lineQueue.push({
          pageId: JSCanvas.pageId,
          x1:Math.round(path[i].path[j-1].x),
          y1:Math.round(path[i].path[j-1].y),
          x2:Math.round(path[i].path[j].x),
          y2:Math.round(path[i].path[j].y),
          r: info.r,
          g: info.g,
          b: info.b,
          lineWidth: info.lineWidth,
          alpha: info.alpha,      
        });
      }
        
    }
  }
  static addImage(image,x,y,width,height){
    image = image.replace(/^data:image\/png;base64,/, "");
    JSCanvas.imageQueue.push({
      pageId: JSCanvas.pageId,
      imagedatumHash: JSCanvas.getImage(image),
      x: Math.round(x),
      y: Math.round(y),
      width: width,
      height: height,
    });
  }
  static addCharacter(char,x,y,font,lineWidth){
    JSCanvas.charQueue.push({
      pageId: JSCanvas.pageId,
      font: font,//JSCanvas.getFont(font),
      x: Math.round(x),
      y: Math.round(y),
      value: char,
    })
  }
  static getImage(image){    
    var name = md5(image);
    if(!JSCanvas.images.hasOwnProperty(name)){
      JSCanvas.images[name] = {
        hash: name,
        value: image
      }
      JSCanvas.imageDataQueue.push(JSCanvas.images[name]);
    }
    return name;
  }
 
  
  static setPage(id){
    JSCanvas.pageId = id;
  }
  
  static async done(){
    await DB.ImageData.bulkCreate(JSCanvas.imageDataQueue);
    await DB.Image.bulkCreate(JSCanvas.imageQueue);
    await DB.Character.bulkCreate(JSCanvas.charQueue);
    await DB.Line.bulkCreate(JSCanvas.lineQueue);
    JSCanvas.charQueue = [];
    JSCanvas.imageQueue = [];
    JSCanvas.imageDataQueue = [];
    JSCanvas.lineQueue = [];
  }
  
}
JSCanvas.imageQueue = [];
JSCanvas.imageDataQueue = [];
JSCanvas.charQueue = [];
JSCanvas.lineQueue = [];
JSCanvas.images = {};
module.exports = JSCanvas;