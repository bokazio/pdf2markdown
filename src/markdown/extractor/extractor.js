const TableExtractor = require('./table_extractor/table_extractor.js');
const HeaderFooterExtractor = require('./header_footer_extractor/header_footer_extractor.js');
const ListExtractor = require('./list_extractor/list_extractor.js');
var Logger = require('../../logger/logger.js');
var MarkdownTools = require('../markdown_tools/markdown_tools.js');
var Preprocessor = require('./preprocessor/preprocessor.js');
var Renderer = require('../renderer/renderer.js');
var fs = require('fs');


class Extractor{
  
  /**
   * Runs the extraction to generate elements
   * TODO: Renderer is called here should be moved out
   * @param  {Array} line   Line of Elements
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   * @return {String}          Renderered Markdown
   */
  static async run(page, analysis, config){

    
    // Generate all character lines on the page
    var lines = await Extractor.generateLines(page);
    // Generate actual line segments
    var lineSegments = await Extractor.generateSegments(page);   
    
    lines = await Preprocessor.run(lines, page, config, analysis);
    
    // get the headers and footers and remove them from the lines
    var headerFooterDetection =  HeaderFooterExtractor.run(page, lines, config, analysis);
    lines = headerFooterDetection.lines;
    
    // get the tables and remove them from the lines
    var tableDetection = TableExtractor.run(lines, lineSegments, config,page);
    lines = tableDetection.lines;

    // add headings
    var headings = Extractor.detectHeading(lines, page, config, analysis);
    
    // generate lists
    var content = ListExtractor.run(lines, page, config, analysis);

    // combine together
    content = content.concat(headings).concat(tableDetection.result.tables);
    
    // sort them by y position
    content.sort((c1,c2)=>{
      var y1 = c1.miny ? c1.miny : c1.y;
      y1 = y1 ? y1 : c1[0].y;
      var y2 = c2.miny ? c2.miny : c2.y;
      y2 = y2 ? y2 : c2[0].y;
      return y1 - y2;
    })
    // flatten it
    content = [].concat.apply([], content);
    
    // detect paragraphs
    // TODO: move this farther up the chain
    content = Extractor.detectParagraphs(content);
    
    // TODO: move this call out somewhere else
    return Renderer.run(content, page, analysis, config);
  }
  
  /**
   * Detect paragraphs by looking at elements that have no type or are bold, italics or an image
   * TODO: make more robust looking at line breaks etc.
   * @param  {Array} content All the lines
   * @return {Array}         All the lines
   */
  static detectParagraphs(content){
    var currentParagraph;
    for(var i = 0; i < content.length; i++){
      var line = content[i];
      // offset of paragraph from i
      var cur = 0;
      // greedy pickup of elements 
      while(content[i+cur] && (!content[i+cur].type || content[i+cur].type == "BOLD" || content[i+cur].type == "ITALIC" || content[i+cur].type == "IMAGE") ){
        // create new paragraph
        if(!currentParagraph){
          currentParagraph = {
            type: "PARAGRAPH",
            y: content[i].y,
            value:[]
          }
        }
        // add on elements to the paragraphs value
        currentParagraph.value = currentParagraph.value.concat(content[i+cur])
        cur++;
      }
      // add paragraph and remove elements from i to cur index
      if(currentParagraph){
        content.splice(i,cur,currentParagraph);
        currentParagraph = null;
      }
    }
    return content;
  }
  
  /**
   * get line segments from page
   * @param  {Page} page current Page
   * @return {Array}      line segments
   */
  static async generateSegments(page){
    return page.getLines();
  }
   
  
  /**
   * Detect what heading level the text is
   * @param  {Array} line   Line of Elements
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   * @return {Object}          Heading object or null if not found
   */
  static _detectLevel(line, page, config, analysis){  
    var char = line[0];
    // get next character if its a not a 'character'
    if(line[0].type && line.length > 1){
      char = line[1];
    }
    // check for the font for each heading level
    // TODO: could simplify and have font hold its on heading level
    for(var i = 1; i< 6; i++){
      var found = analysis.fonts[i].find(t=> t.name == char.fontName);
      if(found){
        return{
          value: line,
          level: i,
          y: char.y
        }   
      }         
    }
    
    return null;
  }
  
  /**
   * Detect Headings
   * @param  {Array} lines    Lines of character Objects
   * @param  {DB.Page} page     DB Page
   * @param  {Object} config   Configuration
   * @param  {Object} analysis Analysis
   * @return {Array}          All Headings on the page
   */
  static detectHeading(lines, page, config, analysis){
    var headings = [];
    var rem = [];
    for(var i = 0; i < lines.length; i++){
      // Check that whole line is same font to eliminate inline
      if(lines[i].length > 0  && lines[i].filter((c,index)=> !c.fontName || c.fontName != lines[i][0].fontName).length <=3 && lines[i].find((c,index)=> c.value != ' ')){
        // Check for line breaks
        // TODO: needs to be more robust
        if( (i>0 && lines[i-1][lines[i-1].length - 1].type == "LINE_BREAK" || lines[i][lines[i].length - 1].type == "LINE_BREAK") || i == 0){
        
          var h = Extractor._detectLevel(lines[i], page, config, analysis);
          // add heading if it exists and remove from lines
          if(h){
            lines.splice(i,1);
            i--;
            h.type = "HEADING";
            headings.push(h);
          }
        }
      }
    }    
    return headings;
    
  }
  
  
  /**
   * Get all the characters for the page sorted by y then x asc
   * @param  {DB.Page} page Current Page
   * @return {Array}      2d array of characters
   */
  static async generateLines(page){
    var characters = await page.getCharacters({
      order:" y ASC, x ASC"
    });
    return Extractor.getLines(characters);
  }
  
  /**
   * Create 2d Array of characters
   * @param  {Array} content characters from DB
   * @return {Array}         2d array of characters
   */
  static getLines(content){
    var lines = [];
    // set inital row
    var current = 0;
    lines[current]=[content[0]];
    //add additional rows
    for(var i = 1; i < content.length; i++){
      // y is different its a different row
      if(content[i].y != content[i-1].y ){
        current++;
        lines[current]=[];
      }
      // add it to the row, just get js object without sequelize overhead to improve performance
      lines[current].push(content[i].get({plain: true}));
    }
    return lines;
  }
}

module.exports = Extractor;

