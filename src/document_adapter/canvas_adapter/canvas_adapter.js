global.Image =  require('canvas').Image;
var Canvas = require('canvas');
var ContextAdapter = require('./context_adapter/context_adapter.js');
class CanvasAdapter{
  constructor(){
    this.width = 200;
    this.height = 200;
  }
  getContext(type){
    this.nodeCanvas = new Canvas(this.width,this.height);
    return new ContextAdapter(this.nodeCanvas);
  }
}

module.exports = CanvasAdapter;