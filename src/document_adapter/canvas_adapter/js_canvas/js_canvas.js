//var Character = require('./js_canvas_elements/character.js');
class JSCanvas{
  constructor(){
    this.canvas = {fonts:[]};
  }
  addLine(x1,y1,x2,y2,width){
    
  }
  addImage(image,x,y,width,height){
    var node = {
      image: image,
      x: x,
      width: width,
      height: height
    };
    this._addToCanvas(y,node);
  }
  addCharacter(char,x,y,font){
    
    if(!this.canvas.fonts.includes(font)){
      this.canvas.fonts.push(font);
    }
    var node = {
      char: char,
      x: x,
      font: this.canvas.fonts.indexOf(font)
    };
    this._addToCanvas(y,node);
    
    //this._sort();
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