var CanvasAdapter = require('./canvas_adapter/canvas_adapter.js');
var jsdom = require('jsdom').jsdom;
var Canvas = require('canvas');
var fs = require('fs');
var tmp = require('tmp');
class DocumentAdapter{
  constructor(){
    this.DOM = jsdom().defaultView.document;
    this.documentElement = {
      getElementsByTagName: this.getElementsByTagName.bind(this)
    }
    this.canvases = [];
  }
  createElement(element){
    switch(element){
      case 'canvas':
        // var canvas = ;;
        // this.canvases.push(canvas);
        return new CanvasAdapter(this.font);
      case 'style':
        return {
          sheet:{
            insertRule: (rule)=>{
              // var args = Array.prototype.slice.call(arguments, 0).join(',');
              // console.log("insertRule(",JSON.stringify(rule));
              // // this.font.push(rule);
              // var index = rule.indexOf("base64,");
              // var r = rule.slice(index+7, -3)
              // console.log(r);
              
              // var tmpFile = tmp.fileSync();
              
              // var writer = fs.createWriteStream(tmpFile.name);
              // writer.write(atob(r));
              // writer.end();
              // var reg = /font-family:\"(.+)\";src:url/
              // var fontFamily = rule.match(reg)[1];
              
              // this.font[fontFamily] = tmpFile.name;
              // this.canvases.forEach(c=>{
              //   c.addFont(fontFamily, tmpFile.name);
              // })
              // tmpFile.removeCallback();
              
              //cssRules.push(arguments[0]);
            },
            cssRules: []
          }
        };
    }
    return {width:0,height:0}
  }
  setAttributeNS(){
    
  }
  getElementsByTagName(n){
    // console.log(n);
    return [{appendChild:function(element){
      // console.log("append ",element);
    }}]
  }
}
class HTMLElement{
  
}
global.HTMLElement = HTMLElement;

module.exports = DocumentAdapter;