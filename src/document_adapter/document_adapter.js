var CanvasAdapter = require('./canvas_adapter/canvas_adapter.js');
var jsdom = require('jsdom').jsdom;
var Canvas = require('canvas');
var fs = require('fs');
var tmp = require('tmp');

class DocumentAdapter{
  /**
   * Simple Document-like Adapter that uses jsdom's document object
   */
  constructor(){
    this.DOM = jsdom().defaultView.document;
    this.documentElement = {
      getElementsByTagName: this.getElementsByTagName.bind(this)
    }
    this.canvases = [];
  }
  createElement(element){
    switch(element){
      // have it use our canvas adapter
      case 'canvas':
        return new CanvasAdapter(this.font);
      // Allow it to add styles, currently these are ignored
      case 'style':
        return {
          sheet:{
            // Might be a way to get more font information here
            insertRule: (rule)=>{
            },
            cssRules: []
          }
        };
    }
    return {width:0,height:0}
  }
  /**
   * Not implemented but it is called.
   */
  setAttributeNS(){
    
  }
  /**
   * we dont really care we just want pdf.js to be happy
   */
  getElementsByTagName(n){
    // console.log(n);
    return [{appendChild:function(element){
      // console.log("append ",element);
    }}]
  }
}
/**
 * we dont really care we just want pdf.js to be happy
 */
class HTMLElement{
  
}
global.HTMLElement = HTMLElement;

module.exports = DocumentAdapter;