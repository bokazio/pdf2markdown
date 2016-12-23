var CanvasAdapter = require('./canvas_adapter/canvas_adapter.js');
var jsdom = require('jsdom').jsdom;
class DocumentAdapter{
  constructor(){
    this.DOM = jsdom().defaultView.document;
    this.font = {};
    this.documentElement = {
      getElementsByTagName: this.getElementsByTagName.bind(this)
    }
  }
  createElement(element){
    switch(element){
      case 'canvas':
        return new CanvasAdapter();
      case 'style':
        return this.DOM.createElement('style');
    }
    return {width:0,height:0}
  }
  setAttributeNS(){
    
  }
  getElementsByTagName(){
    return [{appendChild:function(element){console.log("append "+element);}}]
  }
}
class HTMLElement{
  
}
global.HTMLElement = HTMLElement;

module.exports = DocumentAdapter;