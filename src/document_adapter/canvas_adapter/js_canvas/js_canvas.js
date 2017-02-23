//var Character = require('./js_canvas_elements/character.js');
var timer = require('timers');
var md5 = require('blueimp-md5');
var fs = require('fs');
var Logger = require('../../../logger/logger.js');
var famRegex = /(\".+\".*)/;

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
  static addCharacter(char,x,y,font){    
    JSCanvas.charQueue.push({
      pageId: JSCanvas.pageId,
      fontName: JSCanvas.getFont(font),
      x: Math.round(x),
      y: Math.round(y),
      value: char,
    })
  }
  static getFont(font){   
    if(!JSCanvas.fonts.hasOwnProperty(font.name)){
      var splt = JSCanvas._getFont(font.name);
      JSCanvas.fonts[font.name] = {
        name: font.name,
        mWidth: font.mWidth,
        spaceWidth: font.spaceWidth,
        tabWidth: font.tabWidth,
        height: font.height,
        style: splt.style,
        weight: splt.weight,
        family: splt.family
      }
      JSCanvas.fontQueue.push(JSCanvas.fonts[font.name]);
    }
    return font.name;
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
  
  /* style | weight | size | family | type */
  static _getFont(font){
    var splt = font.split(' ');
    return {
      style: splt[0],
      weight:splt[1],
      family: font.match(famRegex)[1]
    }
  }
  
  static setPage(id){
    JSCanvas.pageId = id;
  }
  
  static async done(){
    // if(JSCanvas.imageDataQueue.length > 0){
    //   await DB.ImageData.bulkCreate(JSCanvas.imageDataQueue);
    // }
    // if(JSCanvas.imageQueue.length > 0){
    //   await DB.Image.bulkCreate(JSCanvas.imageQueue);
    // }
    // if(JSCanvas.fontQueue.length > 0){
    //   await DB.Font.bulkCreate(JSCanvas.fontQueue);
    // }
    await DB.Character.bulkCreate(JSCanvas.charQueue);
    // await DB.Line.bulkCreate(JSCanvas.lineQueue);
    JSCanvas.charQueue = [];
    
  }
  static async finish(){

    await DB.Line.bulkCreate(JSCanvas.lineQueue);
    await DB.Font.bulkCreate(JSCanvas.fontQueue);
    await DB.ImageData.bulkCreate(JSCanvas.imageDataQueue);
    await DB.Image.bulkCreate(JSCanvas.imageQueue);
    JSCanvas.imageQueue = [];
    JSCanvas.imageDataQueue = [];
    JSCanvas.lineQueue = [];
    JSCanvas.fontQueue = [];
  }
}
JSCanvas.imageQueue = [];
JSCanvas.imageDataQueue = [];
JSCanvas.charQueue = [];
JSCanvas.lineQueue = [];
JSCanvas.images = {};
JSCanvas.fontQueue = [];
JSCanvas.fonts = {};
module.exports = JSCanvas;