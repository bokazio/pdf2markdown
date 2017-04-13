var Logger = require('../../../logger/logger.js');
var MarkdownTools = require('../../markdown_tools/markdown_tools.js');


class Preprocessor{
  
  /**
   * Add spaces, linebreaks, indentation and bold/italic
   * @param  {Array} lines    Lines of character Objects
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   * @return {Array}          Processed lines on the page
   */  
  static async run(lines, page, config, analysis){
    
    lines = await Preprocessor.detectLinks(page, lines, analysis, config);
    lines = await Preprocessor.detectImages(page,lines);
    
    for(var i = 0; i < lines.length; i++){
      lines[i] = Preprocessor.addSpaces(lines[i], page, config, analysis);
      Preprocessor.addLineBreaks(lines,i, page, config, analysis);
      Preprocessor.addIndentation(lines[i], page, config, analysis);
      lines = Preprocessor.detectFontStyle(lines, page, config, analysis);
    }
    
    return lines;
  }
  
  /**
   * Attempt a heuristic to detect spaces if no space chars exist
   * !!!BUGGY!!!
   * TODO: current uses hardcoded heuristic, should use config heuristic
   * a more robust solution might be to look at actual char width
   * 
   * @param {Array} line     current Line
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   * * @return {Array}          Line with spaces added
   */
  static addSpaces(line, page, config, analysis){
    // Check for no space characters
    if(!line.find(l=>l.value === " ")){
      for(var i = 0; i < line.length - 1; i++){
        var found = analysis.spaces[line[i].fontName];
        
        // different space tolerances per character
        var wide = "wWMmR:ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var small = "it/j";
        var h = "crspflt1234567890";
        
        // check characters
        var lowTol = (wide.includes(line[i].value) && wide.includes(line[i+1].value)) || (wide.includes(line[i].value) && !wide.includes(line[i+1].value));
        var vLowTol = !lowTol && small.includes(line[i].value);
        var highTol = h.includes(line[i].value) ;
        
        // Determine space factor chunk based on tolerance levels
        var SPACE_FACTOR_CHUNK =  lowTol ? 2.5 : 1.6;
        SPACE_FACTOR_CHUNK = vLowTol ? 2.7 : SPACE_FACTOR_CHUNK ;
        SPACE_FACTOR_CHUNK = highTol ? 1.3 : SPACE_FACTOR_CHUNK ;
        
        // add space it space is within tolerance, TODO: add actual char into line array
        if( line[i].x + found[line[i].value].width + found.space.width * SPACE_FACTOR_CHUNK <= line[i+1].x ){
          line[i].value =  line[i].value +" ";
        }
          
      }
    }
    return line;
  }
  
  /**
   * Add Line Breaks Objects where they occur on the page
   * @param {Array} lines    All lines to check between lines
   * @param {Number} i        current index
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   * * @return {Array}          Line with spaces added
   */
  static addLineBreaks(lines,i, page, config, analysis){
    var line = lines[i];
    // get the current font for the first character for the line
    var font = analysis.fonts.all.find(f=>f.name === line[0].fontName);
    
    // use default eight of 12 if it doesnt exist
    var height;
    if(!font){
      height = 12;
    }else{
      height = font.height;
    }
    
    // calculate whether a line separation between the lines occurred by
    // seeing if the separation of previous line is greater than the first characters height scaled by 1.35 - more or less standard line separation
    // TODO: add configuration for scale factor
    var lineSeparation = i+1 < lines.length && ( lines[i+1][0].y  - lines[i][0].y ) > (height * 1.35) ;
    
    if(lineSeparation){
      // add line break at end or line
      line.push({
        type: "LINE_BREAK",
        x: line[line.length-1].x+1,
        y: line[line.length-1].y
      })
    }
  }

  
  /**
   * Add indentation to lines
   * @param {Array} line     current Line
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   */
  static addIndentation(line, page, config, analysis){
    // find where first occurrence of a non whitespace character occurs
    var index = line.findIndex(l=>l.value !== " " && l.value !== "\t");
    if(index >= 0){
      var char = line[index];   
      // make sure its not an image
      if(char.type !== "IMAGE"){  
        var indent = MarkdownTools.detectIndentLevel(char, page, config, analysis);
        // add the indent level and remove extra whitespace if present
        if(indent){
          char.indent = indent;
          line = line.splice(0,index)
        }
      }
    }
  }
  
  /**
   * Add Bold and Italic styling if it occurs
   * 
   * @param  {Array}   lines     all lines
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   * @return {Array}          all lines with bold/italic added
   */
  static  detectFontStyle(lines, page, config, analysis){
    var fonts = analysis.fonts.all;   
            
    for(var i = 0; i < lines.length; i++){
      var line = lines[i];      
      for(var j = 0; j < line.length; j++){
        // find the font for each character
        var found = fonts.find(f=>f.name == line[j].fontName);
        if(found){
          // Check if weight is not normal or font is found for bold text
          if(found.weight != "normal" || config.font.bold.find(f=>f==found.name) ){
            line[j].type = "BOLD";
          }
          // Check if style is not normal or font is found for italic text
          else if(found.style != "normal" || config.font.italic.find(f=>f==found.name) ){
            line[j].type = "ITALIC";
          }
        }
      }
    }
    return lines;
  }
  
  static async detectLinks(page,lines, analysis, config){
    var annotations = await page.getAnnotations();
    for(var i = 0; i < annotations.length; i++){
      var an = annotations[i];
      
      var index = lines.findIndex(l=> (l[0].y >= an.y1 && l[0].y <= an.y2) || (l[0].y >= an.y2 && l[0].y <= an.y1) );

      if(index >= 0){
        var text = lines[index].filter(l=> (l.x >= an.x1 && l.x <= an.x2) || (l.x >= an.x2 && l.x <= an.x1));
        var first = lines[index].findIndex(l=> (l.x >= an.x1 && l.x <= an.x2) || (l.x >= an.x2 && l.x <= an.x1));
        if(text && text.length > 0 ){
          text[0].value = "["+text[0].value;
          
          try{
            var loc = JSON.parse(an.value)[0];
            
            var pa = analysis.pageInfo.find(p=> p.refNum === loc.num && p.refGen === loc.gen);
            
            text[text.length-1].value = text[text.length-1].value + "]("+'#page-'+pa.number+") ";
          }catch(e){
            text[text.length-1].value = text[text.length-1].value + "](rel"+") ";
          }
        }
        // BUGGY, TODO: replace with link object... having issues nesting in PARAGRAPH and indent issues 
        // if(text && text.length > 0){
        //   var link = {
        //     x: text[0].x,
        //     xMax: text[text.length-1].x, 
        //     fontName: text[0].fontName,
        //     indent: text[0].indent,
        //     y: text[0].y,
        //     value: text,
        //     type: "LINK",
        //   }
          
        //   try{
        //     var loc = JSON.parse(an.value)[0];
            
        //     var pa = analysis.pageInfo.find(p=> p.refNum === loc.num && p.refGen === loc.gen);
            
        //     link.href = '#page-' + pa.number;
        //   }catch(e){
        //     link.href = an.dest;
        //   }
        //   lines[index].splice(first,text.length,link);
          
          
        // }
        
      }
    }
    return lines;
  }
  
  static async detectImages(page,lines){
    var images = await page.getImages();
    for(var i = 0; i < images.length; i++){
      var im = images[i];
      
      var imgdata = await DB.ImageData.findOne({
        where:{
          hash: im.imagedatumHash
        }
      });
      
      var line = lines.find(l=> (l[0].y == im.y + im.height) || l[0].y == im.y );

      var imgText = {
        //value: "!["+"images/"+imgdata.hash+"]("+"images/"+imgdata.hash+".png ="+im.width+"x"+im.height+") ",
        value: "![]("+"images/"+imgdata.hash+".png )",//{ width="+im.width+"px height="+im.height+"px } ",
        hash: imgdata.hash,
        width: im.width,
        height: im.height,
        x: im.x,
        y: im.y,
        type: "IMAGE"
      };
      if(line){
        var index = line.findIndex(l=> l.x > im.x);        
        line.splice(index, 0, imgText);
      }else{
        lines.push([imgText]);
      }
      var fs = require('fs');
      fs.writeFileSync("test/images/"+imgdata.hash+".png", imgdata.value, 'base64'); 
    }
    lines.sort((l1,l2)=>l1[0].y-l2[0].y);
    return lines;
  }
  
}


module.exports = Preprocessor;
