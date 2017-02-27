var MarkdownTools = require('../../markdown_tools/markdown_tools.js');

var Logger = require('../../logger/logger.js');


class ListExtractor{
  
  static run(page, lines, config, analysis){
    Logger.debug("Extracting Lists");
    var lists = [];
    
    for(var i = 0; i < lines.length; i++){
      var l = Extractor.detectListType(lines[i],page, config, analysis);
      if(l){
        lists.push(l);
      }
    }
    
    return lists;    
  }
    
  
  
  static detectListType(line, page, config, analysis){
    
    var ul = config.ul.tokens;
    var ol = config.ol.regex;
    
    var char = line[0];
    line = line.map(l=>l.value).join('');
    
    var m = line.match(ol);
      if(m){
        return {
          type: 'OL',
          value: {            
            line: line,
            bullet: m[2] ? m[2] : m[4],
            indent: MarkdownTools.detectIndentLevel(char, page, config, analysis),
          },
          y: char.y
        }
      }
      if(ul.includes(line.charAt(0))){
        return {
          type: 'UL',
          value: {
            line: line.substr(1),
            bullet: char.value,
            indent: MarkdownTools.detectIndentLevel(char, page, config, analysis),
          },
          y: char.y
        }
      }
  } 
 
  
}

module.exports = ListExtractor;
