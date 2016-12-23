//var Character = require('./js_canvas_elements/character.js');
var timer = require('timers');
var md5 = require('blueimp-md5');
var fs = require('fs');
var Logger = require('../../../logger/logger.js');
class JSCanvas{
  static addLine(path,info){
    for(var i = 1; i < path.length; i++){
      JSCanvas.lineQueue.push({
        x1:path[i-1].x,
        y1:path[i-1].y,
        x2:path[i].x,
        y2:path[i].y,
        r: info.r,
        g: info.g,
        b: info.b,
        lineWidth: info.lineWidth,
        alpha: info.alpha      
      });  
    }
  }
  static addImage(image,x,y,width,height){
    
    JSCanvas.imageQueue.push({
      pageId: JSCanvas.pageId,
      imagedatumHash: JSCanvas.getImage(image),
      x: x,
      y: y,
      width: width,
      height: height,
    });
  }
  static addCharacter(char,x,y,font){
    JSCanvas.charQueue.push({
      pageId: JSCanvas.pageId,
      font: font,//JSCanvas.getFont(font),
      x: x,
      y: y,
      value: char,
    })
    
  }
  static getImage(image){
    image = image.replace(/^data:image\/png;base64,/, "")
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
  /* style | variant | weight | stretch | size/line-height | family */
  static getFont(font){
    var splt = font.split(' ');
    var style,
        variant="normal",
        weight="normal",
        stretch="normal",
        size="medium",
        lineHeight="normal",
        family;
        
    switch(splt.length){
      case 2: 
        size = splt[0];
        family = splt[1];
        break;
      case 4:
        style = splt[0];
        size = splt[1];
        family = splt[2];
        break;
      case 5:
        style = splt[0];
        variant = splt[1];
        weight = splt[2];
        size = splt[3].split('/')[0];
        lineHeight = splt[3].split('/').length > 1 ? splt[3].split('/')[1] : lineHeight;
        family = splt[4];
        break;
      case 6:
        style = splt[0];
        variant = splt[1];
        weight = splt[2];
        stretch = splt[3];
        size = splt[4].split('/')[0];
        lineHeight = splt[4].split('/').length > 1 ? splt[4].split('/')[1] : lineHeight;
        family = splt[5];
        break;
    }
    return style+"|"+variant+"|"+weight+"|"+stretch+"|"+size+"|"+lineHeight+"|"+family;
  
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