
class MarkdownClassifier{
  constructor(config){
    this.textWidth = 80;
  }
  classify(page){
    this.page = page._page;
    var lines = [];
    var keys = Object.keys(page._page.canvas).sort((a,b)=>{return Number(a)-Number(b)});
    for(var i = 0; i < keys.length; i++){
      if(keys[i]!= "lines"){
        console.info(keys[i]);
        this._classifyLine(page._page.canvas[keys[i]]);
        lines.push({y: keys[i],line:page._page.canvas[keys[i]]})
        console.info("\n\n");
      }
    }
    this.buildTable(lines, page._page.canvas["lines"]);
  }
  _classifyLine(line){
    // if(Array.isArray(line)){
      // for(var i = 0; i < line.length; i++){
    this._detectBlocks(line);
    // throw "done";
    // for(var i = 0; i < line.length; i++){
    // }
    //     console.info(line.reduce((a,b)=>{
    //       var c=a;
    //       var d=b;
    //       if(a.hasOwnProperty("char")){
    //         c = a.char; 
    //       }
    //       if(b.hasOwnProperty("char")){
    //         d = b.char; 
    //       }
    //       if(a.hasOwnProperty("image_id")){
    //         c = a.image_id; 
    //       }
    //       if(b.hasOwnProperty("image_id")){
    //         d = b.image_id; 
    //       }
    //       return c+d;
    //     }))
      // }
      // 
    // }
    
  }
  _print(line){
    if(line.char)
      return line.char;
    else if(line.image_id){
      return "<image "+line.image_id+", "+ line.x + ", "+line.width + ", "+line.height+">";
    } else{
      return"<line "+line.line_id+ "\n"+ JSON.stringify(line.lines)+"\n"+ JSON.stringify(line.info)+">\n";
    }
  }      
  _detectBlocks(line){
    var distances = {};
    var st = this._print(line[0]);
    for(var i = 0; i < line.length-1; i++){
      
      
      var temp = Math.trunc(line[i+1].x) - Math.trunc(line[i].x);
      
      // console.info(line[i].char + line[i+1].char +" :"+temp);
      if(distances.hasOwnProperty(temp)){
        distances[temp]++;
      }else{
        distances[temp]=1;
      }      
      
      st += this._print(line[i+1]);
      
    }
    console.info(st);
    console.info(distances);
  } 
  buildTable(page,lines){
    var points = [];
    for(var i = 0; i < lines.length; i++){
      points.forEach(p=>{
        if(p.x == lines[i].x && p.y == lines[i].y){
          
        }
      })
    }
  }
}
module.exports = MarkdownClassifier;