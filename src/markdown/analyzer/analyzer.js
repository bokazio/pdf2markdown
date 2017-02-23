var Sequelize = require('sequelize');
var famRegex = /\"(.+)\"/;
class Analyzer{
  static async run(docId, config){
    // console.log("Running Analsis");
    // returns analysis of document for extraction
    return {
      spaces: await Analyzer._measureSpace(docId),
      fonts: await Analyzer._rankFonts(docId,config)
    };
  }  
  //Buggy
  static async _measureSpace(docId){ 
    var spaces = {};
    
    var m = await DB.Font.findAll() 
    
    var Canvas = require('canvas');
    var p = await DB.Page.findById(1);
    var canvas = new Canvas(p.width, p.height);
    var ctx = canvas.getContext('2d');

    
    for(var i = 0; i < m.length; i++){
      ctx.font = m[i].name;
      var chars = await DB.Character.findAll({
        where:{
          fontName : m[i].name
        },
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('value')), 'value']]
      })
      // console.log("Real Width: " +m[i].spaceWidth);
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
      
    }
    
    return spaces;
  }
  static async _rankFonts(docId,config){
    var fonts = await DB.Font.findAll(); 
    
    var weightRank = ["bolder","bold", "normal", "lighter"];
    var styleRank = ["oblique","italic","normal"];
    
    var counts = {};
    var total = await DB.Character.count();
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
    }    
    
    
    //TODO: sort by font size then style, then variant
    fonts.sort((a,b)=>{
      if(a.percent == 0){
        return 1
      }
      if(b.percent == 0){
        return -1
      }
      var h = b.height-a.height;
      if(h != 0){
        return h;
      }
      if(a.style != b.style){
        return styleRank.indexOf(a.style) - styleRank.indexOf(b.style) 
      }
      if(a.weight != b.weight){
        return weightRank.indexOf(a.weight) - weightRank.indexOf(b.weight) 
      }
      return a.percent - b.percent;
    });
    
    if(config.fontStyle){
      for(var i = 0; i < config.fontStyle.length; i++){
        var f = fonts.find(f=>f.name == config.fontStyle[i].name);
        f.style = config.fontStyle[i].style;
      }
    }
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
    for(var i = 0; i < fonts.length; i++){
      // H1
      if(tol(fonts[i].height, config.headings && config.headings.h1 ? config.headings.h1 : 32, 5)){
          fontRank['1'].push(fonts[i].get({plain: true}));
      
      // H2    
      }else if(tol(fonts[i].height, config.headings && config.headings.h2 ? config.headings.h2 : 24, 2)){
          fontRank['2'].push(fonts[i].get({plain: true}));
      
      // H3    
      }else if(tol(fonts[i].height, config.headings && config.headings.h3 ? config.headings.h3 : 20, 2)){
          fontRank['3'].push(fonts[i].get({plain: true}));
          
      // H4   
      }else if(tol(fonts[i].height, config.headings && config.headings.h4 ? config.headings.h4 : 16, 1)){
        if(config.headings && config.headings.percent){
          if(fonts[i].percent <= config.headings.percent){
            fontRank['4'].push(fonts[i].get({plain: true}));
          }
        }else{

          if(fonts[i].percent <= (1 * total/10000)){
            fontRank['4'].push(fonts[i].get({plain: true}));
          }
        }
      }else if(tol(fonts[i].height, config.headings && config.headings.h5 ? config.headings.h5 : 12, 1)){
        if(config.headings && config.headings.percent){
          if(fonts[i].percent <= config.headings.percent){
            fontRank['5'].push(fonts[i].get({plain: true}));
          }
        }else{
          if(fonts[i].percent <= (1 * total/10000)){
            fontRank['5'].push(fonts[i].get({plain: true}));
          }
        }
      }
    }
      
    // Too many then clear the heading that had too many
    var found = false;
    for(var i = 1; i < 6; i++){
      if(fontRank[i].length > 10 || found){
        fontRank[i]=[];
        found = true;
      }
    }
    // console.log(fontRank);
    // if(config.fontHeadings){
    //   for(var i = 0; i < config.fontHeadings.length; i++){
    //     var f = fonts.find(f=>f.name == config.fontHeadings[i].name);
    //     f.heading = config.fontHeadings[i].heading;
    //   }
    // }
    Analyzer._replaceStyles(fonts,config);
    fonts = fonts.map(f=>f.get({plain: true}));
    return fontRank;
  }
  static _replaceStyles(fonts,config){
    if(config.fontStyle){
      for(var i = 0; i < config.fontStyle.length; i++){
        var f = fonts.find(f=>f.name == config.fontStyle[i].name);
        f.style = config.fontStyle[i].style;
      }
    }
  }
  
}

module.exports = Analyzer;