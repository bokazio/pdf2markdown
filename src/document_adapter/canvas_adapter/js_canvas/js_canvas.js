var md5 = require('blueimp-md5');
var Logger = require('../../../logger/logger.js');
// detect font family
var famRegex = /(\".+\".*)/;

/**
 * Generate Canvas Elements for sent to the DB, 
 * Static class to prevent generating new object on each page since this is hot
 */
class JSCanvas{
  /**
   * Add a line to the canvas and queues it for DB insert
   * @param {Array} path Path of all lines drawn to the canvas
   * @param {Object} info Color and width information
   */
  static addLine(path,info){
    // Go through all paths and subpaths and build lines
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
  /**
   * Add an Image to the canvas and queues it for DB insert
   * @param {Object} image  
   * @param {Number} x      
   * @param {Number} y      
   * @param {Number} width  
   * @param {Number} height 
   */
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
  /**
   * Add a Character to the canvas and queue it for DB insert
   * @param {[type]} char [description]
   * @param {[type]} x    [description]
   * @param {[type]} y    [description]
   * @param {[type]} font [description]
   */
  static addCharacter(char,x,y,font){    
    JSCanvas.charQueue.push({
      pageId: JSCanvas.pageId,
      fontName: JSCanvas.getFont(font),
      x: Math.round(x),
      y: Math.round(y),
      value: char,
    })
  }
  /**
   * Get a font or generate one
   * @param  {Object} font 
   * @return {String}      name of the font
   */
  static getFont(font){   
    if(!JSCanvas.fonts.hasOwnProperty(font.name)){
      // get attributes from the font
      var splt = JSCanvas._getFont(font.name);
      // add reference and queue it
      JSCanvas.fonts[font.name] = {
        name: font.name,
        scaleFactorWidth: font.scaleFactorWidth,
        height: font.height,
        style: splt.style,
        weight: splt.weight,
        family: splt.family,
        documentId: JSCanvas.documentId,
      }
      JSCanvas.fontQueue.push(JSCanvas.fonts[font.name]);
    }
    return font.name;
  }
  /**
   * Either queue the image if the image does not exist, use an md5 hash to check for a match
   * @param  {Object} image 
   * @return {String}       hash of the image
   */
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
  
  /**
   * Get properties from the font
   * style | weight | size | family | type
   * @param  {Object} font 
   * @return {Object}      style weight and family of the font
   */
  static _getFont(font){
    var splt = font.split(' ');
    return {
      style: splt[0],
      weight:splt[1],
      family: font.match(famRegex)[1],      
    }
  }
  /**
   * Set the current page
   * @param {Number} id PageId
   */
  static setPage(id){
    JSCanvas.pageId = id;
  }
  /**
   * Set the current document
   * @param {Number} id DocumentId
   */
  static setDocument(id){
    JSCanvas.documentId = id;
  }
  /**
   * Bulk insert characters into the DB and clear queue
   */
  static async done(){    
    await DB.Character.bulkCreate(JSCanvas.charQueue);
    JSCanvas.charQueue = [];    
  }
  /**
   * Bulk insert Lines, font, images, and imageData and clear their queues
   */
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

// Initial queues
JSCanvas.imageQueue = [];
JSCanvas.imageDataQueue = [];
JSCanvas.charQueue = [];
JSCanvas.lineQueue = [];
JSCanvas.images = {};
JSCanvas.fontQueue = [];
JSCanvas.fonts = {};
module.exports = JSCanvas;