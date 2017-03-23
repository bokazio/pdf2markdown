var MarkdownTools = require('../../markdown_tools/markdown_tools.js');

var Logger = require('../../../logger/logger.js');


class ListExtractor{
  
  static run(lines, page, config, analysis){
    Logger.debug("Extracting Lists");
    var lists = [];
    for(var i = 0; i < lines.length; i++){
      var l = ListExtractor.detectListType(lines[i],page, config, analysis);
      if(l != null){
        lines[i]=l;
      }
    }
    
    return lines;    
  }
    
  
  
  static detectListType(line, page, config, analysis){
    
    var ul = config.ul.tokens;
    var ol = config.ol.regex;
    
    var str = "^\\s*(["+ul.map(u=>"\\u{"+u.charCodeAt(0).toString(16)+"}").join('')+"])";
    var ulRegex = new RegExp(str,"u");
    
    var char = line[0];
    line = line.map(l=>l.value).join('');
    
    var m = line.match(ol);
      if(m!= null){
        return {
          type: 'OL',
          value: {            
            line: line.replace(ol,""),
            bullet: m[2] ? m[2] : m[4],
            indent: MarkdownTools.detectIndentLevel(char, page, config, analysis),
          },
          y: char.y
        }
      }
      m = line.match(ulRegex);
      if(m != null){
        return {
          type: 'UL',
          value: {
            line: line.replace(ulRegex,"- ")+"\n",
            bullet: m[1],
            indent: MarkdownTools.detectIndentLevel(char, page, config, analysis),
          },
          y: char.y
        }
      }
  } 
 
  
}

module.exports = ListExtractor;
