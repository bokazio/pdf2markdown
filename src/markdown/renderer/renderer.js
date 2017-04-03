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
  // TODO add config to include page numbers etc.
  static async run(content, page, analysis, config){
    // return Renderer.generate(content);
    // return JSON.stringify(content,null,2);
    
    return "\n\n#Page "+page.number +Renderer.renderAll(content);
  }
  static renderAll(content){
    var output = content.reduce(Renderer.renderElement,"");
    if(Renderer.bold){
      output += "**";
      Renderer.bold = false;
    }else if(Renderer.italic){
      output += "_";
      Renderer.italic = false;
    }
    return output;
  }
  static renderElement(prev,element){
    var gen = "";
    if(Renderer.bold && element.type != "BOLD"){
      prev += "**";
      Renderer.bold = false;
    }else if(Renderer.italic && element.type != "ITALIC"){
      prev += "_";
      Renderer.italic = false;
    }
    switch(element.type){
      case "LINE_BREAK": /*gen+="\nLINE_BREAK\n";*/ break;
      case "TABLE": gen+= TableRenderer.render(element.value); break;
      case "PARAGRAPH": gen+= Renderer.renderParagraph(element.value); break;
      case "IMAGE": gen+= Renderer.renderImage(element); break;
      case "UL": gen+= Renderer.renderUL(element); break;
      case "OL": gen+= Renderer.renderOL(element); break;
      case "HEADING": gen += Renderer.renderHeading(element); break;
      case "BOLD": gen += Renderer.renderBold(element); break;
      case "ITALIC": gen += Renderer.renderItalic(element); break;
      default: gen+= element.value; break;
    }
    return prev + gen;
  }
  static renderParagraph(value){
    return "\n\n"+value.reduce((res,v,index,arr)=>{
      if(v.type == "BOLD"){
        v.value = Renderer.renderBold(v);
      }else if(v.type == "ITALIC"){
        v.value = Renderer.renderItalic(v);
      }
      if(Renderer.bold && v.type != "BOLD"){
        res += "**";
        Renderer.bold = false;
      }else if(Renderer.italic && v.type != "ITALIC"){
        res += "_";
        Renderer.italic = false;
      }
      if(v.indent){
        var ret = "";
        for(var j = 0; j < v.indent; j++){
          ret+=">"
        }
        v.value = ret + " "+v.value;

      }
      // if originally a new line occurred make it a space
      if(index > 0 && v.y != arr[index-1].y){
        return res+" "+v.value;
      } 
      return res + v.value;
    },"");
  }
  
  static renderBold(element){
    if(!Renderer.bold){
      Renderer.bold = true;
      return "**"+element.value;
    }else{
      return element.value;
    }
  }
  static renderItalic(element){
    if(!Renderer.italic){
      Renderer.italic = true;
      return "_"+element.value;
    }else{
      return element.value;
    }
  }
  
  static renderUL(element){
    var extra = element.value.extra;//.reduce((res,l)=>res+(l.value ? l.value : "")," ");;
    
    return "\n\n- "+Renderer.renderAll(element.value.line)+Renderer.renderAll(extra)+"\n";
  }
  
  static renderOL(element){
    var extra = element.value.extra;//.reduce((res,l)=>res+(l.value ? l.value : "")," ");;
    
    return "\n1. "+Renderer.renderAll(element.value.line)+Renderer.renderAll(extra)+"\n";
  }
  
  //TODO: allow config of rendering image eg. use width/height etc
  static renderImage(element){
    var img = "![]("+"images/"+element.hash+".png ){ width="+element.width+"px height="+element.height+"px } ";
    //"!["+"images/"+element.hash+"]("+"images/"+element.hash+".png ){ width="+element.width+"px height="+element.height+"px } ";
    
    return "\n\n"+img+"\n\n";
  }
  static renderHeading(element){
    var ret = "\n\n";
    for(var j = 0; j < element.level; j++){
      ret+="#"
    }
    ret+=" "+element.value;
    ret+="\n";
    return ret;
  }  
  
}

module.exports = Renderer;

