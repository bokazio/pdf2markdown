var Logger = require('../../../logger/logger.js');

/**
 * Extracts Headers and Footers
 */
class HeaderFooterExtractor{  
  
  
  /**
   * Extract Headers and Footers from the page
   * @param  {Page} page   Current page
   * @param  {[type]} lines  [description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  static run(page, lines, config, analysis){
    Logger.debug("Extracting Headers and Footers");
    var headerResult = HeaderFooterExtractor.getHeaders(page,lines,config, analysis);
    lines = headerResult.lines;
    
    var footerResult = HeaderFooterExtractor.getHeaders(page,lines,config, analysis);
    lines = footerResult.lines;
    
    return {
      result: {
        headers: headerResult.result,
        footers: footerResult.result,
      },
      lines: lines
    }
  }
  
  /**
   * Attempts to detect headers that are within the default of user specified margin
   * @param  {Page}   page  current page used for determining margin bounds
   * @param  {Array} lines  all current filtered lines on the page 
   * @param  {Object}  config   of the document
   * @param  {Object}  analysis   of the document
   * @return {Object}       {Result: headers, lines: (filtered lines)}
   */
  static getHeaders(page, lines, config, analysis){
    // determine where the margin base is located;
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));
    var marginBase = config.margin.top * diag;
    
    // Find headers within marginBase to page edge
    var headersChars = lines.filter(l=>l[0].y <= marginBase);
    //filter them from the list
    lines = lines.filter(l=>l[0].y > marginBase);

    var headers = {
      type: "HEADER",
      value: [],
      y: -1,    // Always at top
    }
    // Detect allignment and insert header accordingly
    for(var l of headersChars){
      headers.value.push(HeaderFooterExtractor._detectMultipleAlignment(l, analysis));
    }
    
    return {
      result: headers,
      lines: lines,
    }
  }
  
  /**
   * Attempts to detect footers that are within the default of user specified margin
   * @param  {Page}   page  current page used for determining margin bounds
   * @param  {Array} lines  all current filtered lines on the page 
   * @param  {Object}  config   of the document
   * @param  {Object}  analysis   of the document
   * @return {Object}       {Result: footers, lines: (filtered lines)}
   */
  static getFooters(page, lines, config, analysis){
    // determine where the margin base is located;
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));
    var marginBase = page.height - config.margin.bottom * diag;
    
    // Find footers within marginBase to page edge
    var footerChars = lines.filter(l=>l[0].y >= marginBase)
    // filter them from the list
    lines = lines.filter(l=>l[0].y < marginBase);

    var footers = {
      type: "FOOTER",
      value: [],
      y: Number.POSITIVE_INFINITY // Always at bottom
    }
    // Detect allignment and insert footer accordingly
    for(var l of footerChars){
      footers.value.push(HeaderFooterExtractor._detectMultipleAlignment(l, analysis));
    }
    return {
      result: footers,
      lines: lines,
    }
  }
  
  /**
   * Detects and returns characters that are in different alignments
   * @param  {Array}    line      Array of Db.Character objects corresponding to the current line
   * @param  {Object}  analysis   of the document
   * @return {Object}             Object with keys left, and optional center or right consisting of arrays of Db.Characters in it.
   */
  static _detectMultipleAlignment(line, analysis){   
    // find large spaces
    var separations = HeaderFooterExtractor.detectLargeSpaces(line, analysis);
    // put property on alignments for each spot
    var alignments={};
    
    //start from left and move across
    var current = 'left';
    alignments[current]=[];
    
     for(var i = 0; i< line.length; i++){
      
        // a character is not found in the after part of a large space we push it onto the current alignment
       if(!separations.find(f=>f.after.id==line[i].id)){
         alignments[current].push(line[i]);
       }else{
          // if it was found we change the alignment to the next one. if there was only one separation we will treat it as right aligned
          // potential TODO: look at character position relative to page margins to determine right or center 
          if(separations.length == 1 || current == "center"){
            current = "right";
          }else{
            current = "center";
          }
          // setup the new alignment
          alignments[current]=[];
          alignments[current].push(line[i]);
       }
     }
    
     
    return alignments;
  }
  
  /**
   * Detects whether there is a large space between characters of a certain font. 
   * A large space is anything larger than a tab character width
   * @param  {Array}    line     of characters
   * @param  {Obecjt}  analysis  of the document
   * @return {Array}             Array of objects that where 'before' and 'after' correspond to the character before  and after the large space 
   */
  static detectLargeSpaces(line, analysis){
    var largeSpaces = [];
    for(var i=1; i < line.length; i++){
      // on the same line
      var sameLine = Math.trunc(line[i].y) == Math.trunc(line[i-1].y) ;
      // has the same font otherwise space doesnt mean anything
      var sameFont = line[i].fontName == line[i-1].fontName;
      
      // Check if distance between characters is larger than a tab character, then its a a large space
      // Potential TODO: if different fonts use largest fonts tab character.
      var largerThanSpace = analysis.spaces[line[i].fontName].tab < (line[i].x - line[i-1].x);
      
      if( sameLine && sameFont && largerThanSpace ){
        largeSpaces.push({
          // character before the large space
          before: line[i-1],
          // character after the large space
          after: line[i]
        })
      }
    }
    return largeSpaces;
  }
}

module.exports = HeaderFooterExtractor;
