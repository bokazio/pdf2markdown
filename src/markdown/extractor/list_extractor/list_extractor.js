var MarkdownTools = require('../../markdown_tools/markdown_tools.js');

var Logger = require('../../../logger/logger.js');


class ListExtractor{
  
  static run(lines, page, config, analysis){
    Logger.debug("Extracting Lists");
    var lists = [];
    var current;
    for(var i = 0; i < lines.length; i++){
      var l = ListExtractor.detectListType(lines[i],page, config, analysis,lines,i);
      if(l != null){
        lines[i]=l;
        current = lines[i];
      }else{
        if(!lines[i][0].type && current){
          current.value.extra = current.value.extra.concat([{value: " "}]).concat(lines[i]);
          if(lines[i][lines[i].length - 1].type == "LINE_BREAK"){
            current = null;
          }
          lines[i] = {remove:true};
        }else{
          current = null;
        }
      }
    }
    
    return lines.filter(l=>!l.remove);    
  }
    
  
  
  static detectListType(line, page, config, analysis,lines){
    
    var ul = config.ul.tokens;
    var ol = config.ol.regex;
    
    var str = "^\\s*(["+ul.map(u=>"\\u{"+u.charCodeAt(0).toString(16)+"}").join('')+"])";
    var ulRegex = new RegExp(str,"u");
    
    var char = line[0];
    var nline = line.reduce((res,l)=>res+l.value,"");
    
    
    var m = ol.exec(nline);
      if(m!= null){          
        return {
          type: 'OL',
          value: {            
            line: line.filter((l,i)=>i>m.index),
            bullet: m[2] ? m[2] : m[4],
            indent: MarkdownTools.detectIndentLevel(char, page, config, analysis),
            extra:[]
          },
          y: char.y
        }
      }
      m = nline.match(ulRegex);
      if(m != null){
        return {
          type: 'UL',
          value: {
            line: line.filter((l,i)=>i>m.index),//line.replace(ulRegex,"- ")+"\n",
            bullet: m[1],
            indent: MarkdownTools.detectIndentLevel(char, page, config, analysis),
            extra:[]
          },
          y: char.y
        }
      }
  } 
 
  
}

module.exports = ListExtractor;
