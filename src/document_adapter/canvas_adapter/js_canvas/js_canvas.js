//var Character = require('./js_canvas_elements/character.js');
var md5 = require('blueimp-md5');
var fs = require('fs');
class JSCanvas{
  constructor(fonts,images){
    this.canvas = {};
  }
  addLine(path,info){
    var node = {
      x: path[0].x,
      y: path[0].y,
      info: info,
      lines: path.splice(0,1),
      line_id: path[0].x+","+path[0].y
    };
    
    //fs.writeFileSync("resources/images/"+name+".png",atob(btoa(image)), 'base64'); 
    this._addToCanvas("lines",node);
  }
  addImage(image,x,y,width,height){
    
    var node = {
      image_id: this.getImage(image),
      x: x,
      width: width,
      height: height
    };
    
    //fs.writeFileSync("resources/images/"+name+".png",atob(btoa(image)), 'base64'); 
    this._addToCanvas(y,node);
  }
  addCharacter(char,x,y,font){
    
    var node = {
      char: char,
      x: x,
      font_id: this.getFont(font)
    };
    // node = "CH:"+char+":"+x+":"+this.getFont(font)
    this._addToCanvas(y,node);
    
    //this._sort();
  }
  getImage(image){
    image = image.replace(/^data:image\/png;base64,/, "")
    var name = md5(image);
    if(!DB.images.by('id', name)){
      DB.images.insert({
        id: name,
        value: image
      });
    }
    return name;
  }
  /* style | variant | weight | stretch | size/line-height | family */
  getFont(font){
    var splt = font.split(' ');
    var name = splt[3].replace(/[\",]/g,"")+"_"+splt[2];
    if(!DB.fonts.by('id', name)){
      DB.fonts.insert({
        id: name,
        value: font
      });
    }
    return name;
  }
  _addToCanvas(y,node){
    if(!this.canvas.hasOwnProperty(y)){
      this.canvas[y]=[node];      
    }else{
      this.canvas[y].push(node);      
    }
  }
  _sort(){
    var keys = Object.keys(this.canvas);
    keys = keys.filter(k=>k=="fonts");
    for(var i = 0; i < keys.length; i++){
      this.canvas[keys[i]] = this.canvas[keys[i]].sort((a,b)=>{
        return a.x - b.x;
      })  
    }
    
  }
  getCanvas(){
    this._sort();
    return this.canvas;
  }
}
module.exports = JSCanvas;