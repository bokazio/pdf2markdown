var Sequelize = require('sequelize');
var famRegex = /\"(.+)\"/;
var Logger = require('../../logger/logger.js');
/**
 * Does analysis on the document needed for extracting elements from the page
 * checks spacing widths, fonts and headings and gets page information
 */
class Analyzer{
  /**
   * Run the analysis
   * @param  {Object} doc    
   * @param  {Object} config any user provided overriding options
   * @return {Object}        Analysis
   */
  static async run(doc, config){
    Logger.heading("Starting Analysis");
    var pages = await doc._doc.getPages();
    
    // analysis of the document
    var result = {
      spaces: await Analyzer._measureSpace(doc._doc),
      fonts: await Analyzer._rankFonts(doc._doc,config),
      pageInfo: pages.map(p=>p.get({plain: true})),
    };
    
    Logger.heading("Analysis Complete");
    return result;
  }  
  
  /**
   * Measure Character Width Calculations
   * TODO: Needs renaming as name refers to an older approach
   * @param  {Object} doc Current document
   * @return {Object}     width calculations
   */
  static async _measureSpace(doc){ 
    var spaces = {};
    
    var fonts = await doc.getFonts();
    Logger.info("Performing Character Width Calculations on "+fonts.length+" fonts");    
    
    // use a temporary canvas to measure all unique characters
    Logger.log("Creating temporary canvas");
    var Canvas = require('canvas');
    var p = await DB.Page.findById(1);
    var canvas = new Canvas(p.width, p.height);
    var ctx = canvas.getContext('2d');

    Logger.log("Results:");
    for(var i = 0; i < fonts.length; i++){
      // set the current font
      ctx.font = fonts[i].name;
      
      // get all unique characters of a certain font
      var chars = await DB.Character.findAll({
        where:{
          fontName : fonts[i].name
        },
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('value')), 'value']]
      })
      
      // if tabs and spaces are not present calculate for use with heuristic
      spaces[fonts[i].name] = {
        space: ctx.measureText(" "),
        tab: ctx.measureText("\t")
      }
      // scale the width of the character to the scaleFactorWidth
      spaces[fonts[i].name].space.width *= fonts[i].scaleFactorWidth;
      spaces[fonts[i].name].tab.width *= fonts[i].scaleFactorWidth;      
      
      // Measure all unique characters and scale their widths appropriately
      for(var j = 0; j < chars.length; j++){
        spaces[fonts[i].name][chars[j].value] = ctx.measureText(chars[j].value)
        spaces[fonts[i].name][chars[j].value].width *= fonts[i].scaleFactorWidth;
      }
      // List the number of unique characters in the font + the 2 for space and tab
      Logger.list(["`" + fonts[i].name + "` - " + chars.length + 2 + " unique chars"]);
    }
    Logger.info("Space/Tab Calculations Complete");
    return spaces;
  }
  /**
   * Rank fonts for use with heading detection
   * TODO: use better name as 
   * @param  {Object} doc    Current Document
   * @param  {Object} config User Configuration
   * @return {Object}        Font Analysis
   */
  static async _rankFonts(doc,config){
    var fonts = await doc.getFonts();
    
    
    // Print Number of characters in document, used for determining font use percentage
    var total = await DB.Character.count();    
    Logger.info("Classifying Fonts for Headings for " + total + " characters");
    
    Logger.log("Calculating Font-Document Percentage");
    
    // get count of all fonts but ignore spaces as they could mess up processing
    // TODO: allow for spaces but filter out fonts that only have space chars
    for(var i = 0; i < fonts.length; i++){
      var c = await fonts[i].getCharacters({
        where:{
          value: {
            $ne: " "
          }          
        },
        attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'amount']]
      });
      // Calcuate the percentage and print it
      fonts[i].percent = c[0].get({plain: true}).amount / total * 100;
      Logger.list([fonts[i].name + " " + fonts[i].percent + "%"]);
    }    
    
    // check if t is within a and b
    // TODO: allow for better configuring of heading ranges, example: >=32px instead on hard range 
    var tol = (a,b,t)=>{
      return (a-b) <= t && (a-b) >= -t
    }
    // rankings of font for headings and other extraction
    var fontRank = {
      '1':[],
      '2':[],
      '3':[],
      '4':[],
      '5':[],
      all: fonts
    };
    
    // h1 is   32px   (2em)
    // h2 is   24px (1.5em)
    // h3 is 20px (1.3em)
    // h4 is   16px   (1em)
    // h5 is 12px (0.8em)
    Logger.info("Assigning fonts to Headings");
    // TODO: More robust assigning of fonts to headings, 
    for(var i = 0; i < fonts.length; i++){
      // H1
      if(tol(fonts[i].height, config.headings.h1.size, config.headings.h1.tolerance)){
          fontRank['1'].push(fonts[i].get({plain: true}));
          
      // H2    
      }else if(tol(fonts[i].height, config.headings.h2.size, config.headings.h2.tolerance)){
          fontRank['2'].push(fonts[i].get({plain: true}));
      
      // H3    
      }else if(tol(fonts[i].height, config.headings.h3.size, config.headings.h3.tolerance)){
          fontRank['3'].push(fonts[i].get({plain: true}));
          
      // H4   
      }else if(tol(fonts[i].height, config.headings.h4.size, config.headings.h4.tolerance)){
        if(fonts[i].percent <= config.headings.h4.percent){
          fontRank['4'].push(fonts[i].get({plain: true}));
        }
      }else if(tol(fonts[i].height, config.headings.h5.size, config.headings.h5.tolerance)){
        if(fonts[i].percent <= config.headings.h5.percent){
          fontRank['5'].push(fonts[i].get({plain: true}));
        }        
      }
    }
    // Display the analysis
    Logger.log("Heading 1");
    Logger.list(fontRank['1'].map(f=>f.name));
    Logger.log("Heading 2");
    Logger.list(fontRank['2'].map(f=>f.name));
    Logger.log("Heading 3");
    Logger.list(fontRank['3'].map(f=>f.name));
    Logger.log("Heading 4");
    Logger.list(fontRank['4'].map(f=>f.name));
    Logger.log("Heading 5");
    Logger.list(fontRank['5'].map(f=>f.name));
    
    return fontRank;
  }
  
}

module.exports = Analyzer;