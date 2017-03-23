
var Logger = require('../../logger/logger.js');


class MarkdownTools{
  
  
  
  static detectIndentLevel(char, page, config, analysis){
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));
    var spaces = 0;
    while((char.x - config.margin.left * diag) > analysis.spaces[char.fontName].tab.width * spaces ){ 
      spaces++;
    }
    return spaces;
  }
 
  
}

module.exports = MarkdownTools;
