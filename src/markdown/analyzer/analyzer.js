var Sequelize = require('sequelize');
var famRegex = /\"(.+)\"/;
var Logger = require('../../logger/logger.js');
class Analyzer{
  static async run(doc, config){
    Logger.heading("Starting Analysis");
    // returns analysis of document for extraction
    var pages = await doc._doc.getPages();
    var result = {
      spaces: await Analyzer._measureSpace(doc._doc),
      fonts: await Analyzer._rankFonts(doc._doc,config),
      pageInfo: pages.map(p=>p.get({plain: true})),
    };
    Logger.heading("Analysis Complete");
    return result;
  }  
  
  
  static async _measureSpace(doc){ 
    var spaces = {};
    
    var m = await doc.getFonts();
    Logger.info("Performing Character Width Calculations on "+m.length+" fonts");
    
    Logger.log("Creating temporary canvas");
    var Canvas = require('canvas');
    var p = await DB.Page.findById(1);
    var canvas = new Canvas(p.width, p.height);
    var ctx = canvas.getContext('2d');

    Logger.log("Results:");
    for(var i = 0; i < m.length; i++){
      ctx.font = m[i].name;
      var chars = await DB.Character.findAll({
        where:{
          fontName : m[i].name
        },
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('value')), 'value']]
      })
      spaces[m[i].name] = {
        space: ctx.measureText(" "),
        tab: ctx.measureText("\t")
      }
      spaces[m[i].name].space.width *= m[i].spaceWidth;
      spaces[m[i].name].tab.width *= m[i].spaceWidth;      
      
      for(var j = 0; j < chars.length; j++){
        spaces[m[i].name][chars[j].value]=ctx.measureText(chars[j].value)
        spaces[m[i].name][chars[j].value].width *= m[i].spaceWidth;
      }
      Logger.list(["`" + m[i].name + "` - " + chars.length + 2 + " unique chars"]);
    }
    Logger.info("Space/Tab Calculations Complete");
    return spaces;
  }
  static async _rankFonts(doc,config){
    var fonts = await doc.getFonts();
    
    var weightRank = ["bolder","bold", "normal", "lighter"];
    var styleRank = ["oblique","italic","normal"];
    
    var counts = {};
    
    var total = await DB.Character.count();    
    Logger.info("Classifying Fonts for Headings for " + total + " characters");
    
    Logger.log("Calculating Font-Document Percentage");
    for(var i = 0; i < fonts.length; i++){
      var c = await fonts[i].getCharacters({
        where:{
          value: {
            $ne: " "
          }          
        },
        attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'amount']]
      });
      
      fonts[i].percent = c[0].get({plain: true}).amount / total * 100;
      Logger.list([fonts[i].name + " " + fonts[i].percent + "%"]);
    }    
    
    
    //TODO: sort by font size then style, then variant
    // fonts.sort((a,b)=>{
    //   if(a.percent == 0){
    //     return 1
    //   }
    //   if(b.percent == 0){
    //     return -1
    //   }
    //   var h = b.height-a.height;
    //   if(h != 0){
    //     return h;
    //   }
    //   if(a.style != b.style){
    //     return styleRank.indexOf(a.style) - styleRank.indexOf(b.style) 
    //   }
    //   if(a.weight != b.weight){
    //     return weightRank.indexOf(a.weight) - weightRank.indexOf(b.weight) 
    //   }
    //   return a.percent - b.percent;
    // });
    
    // if(config.fontStyle){
    //   for(var i = 0; i < config.fontStyle.length; i++){
    //     var f = fonts.find(f=>f.name == config.fontStyle[i].name);
    //     f.style = config.fontStyle[i].style;
    //   }
    // }
    var tol = (a,b,t)=>{
      return (a-b) <= t && (a-b) >= -t
    }
    var fontRank = {
      '1':[],
      '2':[],
      '3':[],
      '4':[],
      '5':[],
    };
    
    // h1 is   32px   (2em)
    // h2 is   24px (1.5em)
    // h3 is 20px (1.3em)
    // h4 is   16px   (1em)
    // h5 is 12px (0.8em)
    Logger.info("Assigning fonts to Headings");
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
      
    // Too many then clear the heading that had too many
    // var found = false;
    // for(var i = 1; i < 6; i++){
    //   if(fontRank[i].length > 10 || found){
    //     fontRank[i]=[];
    //     found = true;
    //   }
    // }
    // console.log(fontRank);
    // if(config.fontHeadings){
    //   for(var i = 0; i < config.fontHeadings.length; i++){
    //     var f = fonts.find(f=>f.name == config.fontHeadings[i].name);
    //     f.heading = config.fontHeadings[i].heading;
    //   }
    // }
    Analyzer._replaceStyles(fonts,config);
    // fonts = fonts.map(f=>f.get({plain: true}));
    return fontRank;
  }
  static _replaceStyles(fonts,config){
    // if(config.fontStyle){
    //   for(var i = 0; i < config.fontStyle.length; i++){
    //     var f = fonts.find(f=>f.name == config.fontStyle[i].name);
    //     f.style = config.fontStyle[i].style;
    //   }
    // }
  }
  
}

module.exports = Analyzer;