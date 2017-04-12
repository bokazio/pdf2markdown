global.Image =  require('canvas').Image;
var Canvas = require('canvas');
var ContextAdapter = require('./context_adapter/context_adapter.js');
/**
 * Canvas Adapter
 */
class CanvasAdapter{
  constructor(font){
    this.width = 200;
    this.height = 200;
    this.type = "CanvasAdapter";
    this.font = font;    
  }
  
  
  /**
   * Creates a context
   * If jsCanvas is present it will be managed by pdf2markdown
   * otherwise its created by pdf.js and is probably an image operation
   * that should be managed by the canvas package
   * @param  {String} type     should be 2d
   * @param  {JSCanvas} jsCanvas if managed by pdf2markdown
   * @return {ContextAdapter}          new context
   */
  getContext(type,jsCanvas){
    this.nodeCanvas = new Canvas(this.width,this.height);
    this.canvasAdapter = new ContextAdapter(this.nodeCanvas,this,jsCanvas);
    return this.canvasAdapter;
  }
}

module.exports = CanvasAdapter;