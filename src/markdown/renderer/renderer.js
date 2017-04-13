var Logger = require('../../logger/logger.js');
var TableRenderer = require('./table_renderer/table_renderer.js');

class Renderer{
  /**
   * Generate Markdown from elements
   * TODO: add config to include page numbers etc.
   * @param  {Array} content   Lines of Elements
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   * @return {[type]}          [description]
   */
  static async run(content, page, analysis, config){
    return "\n\n#Page "+page.number +Renderer.renderAll(content);
  }
  /**
   * Render to markdown each element
   * @param  {[type]} content [description]
   * @return {[type]}         [description]
   */
  static renderAll(content){
    var output = content.reduce(Renderer.renderElement,"");
    
    // Handle edge case of bold and italics hitting page end
    if(Renderer.bold){
      output += "**";
      Renderer.bold = false;
    }else if(Renderer.italic){
      output += "_";
      Renderer.italic = false;
    }
    return output;
  }
  /**
   * Render a single element to markdown
   * @param  {String} prev    Current String
   * @param  {Object} element Next element
   * @return {String}         prev + rendered element
   */
  static renderElement(prev,element){
    var gen = "";
    
    //Handle closing bold and italics if when element changes
    if(Renderer.bold && element.type != "BOLD"){
      prev += "**";
      Renderer.bold = false;
    }else if(Renderer.italic && element.type != "ITALIC"){
      prev += "_";
      Renderer.italic = false;
    }
    // Render based on element type
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
      case "LINK": gen += Renderer.renderLink(element); break;
      default: gen+= element.value; break;
    }
    return prev + gen;
  }
  
  // static renderLink(element){
  //   return "["+element.value.reduce((res,v)=>res+=v.value,"")+"]("+
  // }
  
  /**
   * Render a paragraph and nested elements
   * @param  {Array} value All paragraph elements
   * @return {String}       Rendered paragraph
   */
  static renderParagraph(value){
    return "\n\n"+value.reduce((res,v,index,arr)=>{
      
      //Render bold and italics
      
      if(v.type == "BOLD"){
        v.value = Renderer.renderBold(v);
      }else if(v.type == "ITALIC"){
        v.value = Renderer.renderItalic(v);
      }
      // Close the bold and italics when elements change
      //TODO: move this out
      if(Renderer.bold && v.type != "BOLD"){
        res += "**";
        Renderer.bold = false;
      }else if(Renderer.italic && v.type != "ITALIC"){
        res += "_";
        Renderer.italic = false;
      }
      // indent content
      if(v.indent){
        v = Renderer.renderIndent(res,v);        
      }
      
      // if originally a new line occurred make it a space to hold to markdown
      if(index > 0 && v.y != arr[index-1].y){
        return res+" "+v.value;
      } 
      return res + v.value;
    },"");
  }
  
  /**
   * Renders Indents with blockquote
   * @param  {String} text current result
   * @param  {Object} v   current element
   * @return {Object}     current element
   */
  static renderIndent(text,v){
    var ret = "";
    // if the indent level is less than the previous pandoc requires a newline
    if(Renderer.indent && Renderer.indent > v.indent){
      ret += "\n";
    }
    Renderer.indent = v.indent;
    
    // add blockquote to correspond to indent level
    for(var j = 0; j < v.indent; j++){
      ret += ">";
    }
    // edge case to make sure there's at least one newline
    if(text.charAt(text.length - 1) !== '\n'){
      ret = "\n" + ret;
    }
    v.value = ret + " "+v.value;
    return v;
    
  }
  /**
   * Start bold rendering
   * @param  {Object} element 
   * @return {String}         start of bold
   */
  static renderBold(element){
    if(!Renderer.bold){
      Renderer.bold = true;
      return "**"+element.value;
    }else{
      return element.value;
    }
  }
  /**
   * Start italic rendering
   * @param  {Object} element 
   * @return {String}         start of italic
   */
  static renderItalic(element){
    if(!Renderer.italic){
      Renderer.italic = true;
      return "_"+element.value;
    }else{
      return element.value;
    }
  }
  /**
   * Render an UL with '-'
   * TODO: hook in config to change this
   * TODO: doesnt look at nesting right now
   * @param  {Object} element 
   * @return {String}         Markdown UL
   */
  static renderUL(element){
    var extra = element.value.extra;
    
    return "\n\n- "+Renderer.renderAll(element.value.line)+Renderer.renderAll(extra)+"\n";
  }
  
  /**
   * Render an OL with '1. '
   * TODO: hook in config to change this
   * TODO: doesnt look at nesting right now
   * @param  {Object} element 
   * @return {String}         Markdown OL
   */
  static renderOL(element){
    var extra = element.value.extra;
    
    return "\n1. "+Renderer.renderAll(element.value.line)+Renderer.renderAll(extra)+"\n";
  }
  
  /**
   * Render Image to Markdown
   * TODO: allow config of rendering image eg. use width/height etc
   * @param  {Object} element 
   * @return {String}         Image Markdown
   */
  static renderImage(element){
    var img = "![]("+"images/"+element.hash+".png ){ width="+element.width+"px height="+element.height+"px } ";
    
    return img;
  }
  /**
   * Render Headings to markdown
   * TODO: allow different flavors for showing headings
   * @param  {Object} element 
   * @return {String}         Markdown Heading
   */
  static renderHeading(element){
    var ret = "\n\n";
    // each level add '#'
    for(var j = 0; j < element.level; j++){
      ret += "#"
    }
    // Get all Text 
    ret+=" "+element.value.reduce((res,v,index,arr)=>{
      return res + (v.type == "LINE_BREAK" ? "" : v.value);
    },"");
    ret+="\n";
    return ret;
  }  
  
}

module.exports = Renderer;

