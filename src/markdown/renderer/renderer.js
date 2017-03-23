// const TableExtractor = require('./table_extractor/table_extractor.js');
// const HeaderFooterExtractor = require('./header_footer_extractor/header_footer_extractor.js');
// const ListExtractor = require('./list_extractor/list_extractor.js');
var Logger = require('../../logger/logger.js');
var TableRenderer = require('./table_renderer/table_renderer.js');

/*
* Renderer interface
* ```
* line:{
*   type: "TABLE",
*   value: [table data],
*   y: min y coordinate
* }
* ```
 */

class Renderer{
  static async run(content){
    // return Renderer.generate(content);
    // return JSON.stringify(content,null,2);
    return content.reduce(Renderer.renderElement);
  }
  static renderElement(prev,element){
    var gen = "";
    switch(element.type){
      case "LINE_BREAK": gen+="\n\n"; break;
      case "TABLE": gen+= TableRenderer.render(element.value); break;
      default: console.log("NONE for "+element.type);
    }
    return prev + gen;
  }
  static generate(con){
    var gen = "";
    for(var i = 0; i < con.length; i++){
      var line = con[i];
      if(line.map){
        gen+=line.map(l=>{  
            if(l.type === "LINE_BREAK"){
              l.value="\n\n";
            }
            if(l.indent && l.type !== "OL" && l.type !== "UL"){
              var ret = "";
              for(var j = 0; j < l.indent; j++){
                ret+=">"
              }
              return ret + " "+l.value;
            }          
            return l.value            
          }).join('')
        
      }else{
        var ret = "";
        if(line.level){
          for(var j = 0; j < line.level; j++){
            ret+="#"
          }
          ret+=" "+line.value;
          gen+="\n\n"+ret+"\n";
        }else{
          if(line.type == "TABLE" && line.value.length > 0){
            gen+= TableRenderer.render(line.value); 
            // console.log(line); 
          }
          if(line.type == "OL"){
            gen += "1. "+line.value.line;
          }
          if(line.type == "UL"){
            gen += line.value.line;
          }

          
        }
        
      }
    }
    return gen;
  }
  
  
}

module.exports = Renderer;

