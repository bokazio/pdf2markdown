var MarkdownTools = require('../../markdown_tools/markdown_tools.js');

var Logger = require('../../../logger/logger.js');


class ListExtractor{
  
  /**
   * Extract Unordered and Ordered Lists
   * @param  {Array} lines    all lines on page
   * @param  {Object} page     current page
   * @param  {Object} config   user config
   * @param  {Object} analysis 
   * @return {Array}          lines UL and OL
   */
  static run(lines, page, config, analysis){
    Logger.debug("Extracting Lists");

    var current;
    for(var i = 0; i < lines.length; i++){
      var l = ListExtractor.detectListType(page, config, analysis,lines,i);
      // if theres a list replace the line and set current to it
      if(l != null){
        lines[i]=l;
        current = lines[i];
      }else{
        // if theres a current list, its a line continuation and should be part of the list
        // TODO: just checking for no type can lead to bugs, this needs to check for specific types
        if(!lines[i][0].type && current){
          // add it as extra content
          current.value.extra = current.value.extra.concat([{value: " "}]).concat(lines[i]);
          // clear current if we hit a line break
          if(lines[i][lines[i].length - 1].type == "LINE_BREAK"){
            current = null;
          }
          // mark the line for removal
          lines[i] = {remove:true};
        }else{
          current = null;
        }
      }
    }
    
    return lines.filter(l=>!l.remove);    
  }
    
  
  /**
   * Detect type of list if it exists
   * @param  {[type]} line     [  
   * @param  {Object} page     current page
   * @param  {Object} config   user config
   * @param  {Object} analysis 
   * @param  {Array} lines    all lines on page
   * @return {[type]}          [description]
   */
  static detectListType(page, config, analysis,lines, cur){
    var line = lines[cur];
    // get the config regexs
    var ul = config.ul.tokens;
    var ol = config.ol.regex;
    
    // detects any unicode character specified as configuration for list
    var str = "^\\s*(["+ul.map(u=>"\\u{"+u.charCodeAt(0).toString(16)+"}").join('')+"])";
    var ulRegex = new RegExp(str,"u");
    
    
    var char = line[0];
    // run regex on raw text of line
    var nline = line.reduce((res,l)=>res+l.value,"");
    
    
    // check for OL
    var m = ol.exec(nline);
    if(m){          
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
    
    // Check for UL
    m = nline.match(ulRegex);
    if(m){
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
