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
    // Need to add in getting only characters in a certain document
    // var m = await DB.Character.findAll({
    //   where:{
    //     value: 'M'
    //   },
    //   attributes: [[Sequelize.literal('DISTINCT font'), 'font']],
    // })    
    var spaces = {};
    // // This doesnt handle if a font doesnt have an M, well need to do this later, also should check monospaced or not
    // for(var i = 0; i < m.length; i++){
    //   var space = await DB.Character.findOne({
    //     where:{
    //       font: m[i].font,
    //       value: 'M'
    //     },
    //   })
    //   var next = await DB.Character.findOne({
    //     where:{
    //       font: m[i].font,
    //       y: space.y,
    //       x:{
    //         $gt: space.x
    //       }
    //     },
    //     order: 'x ASC'
    //   })
    //  spaces[m[i].font] = next.x - space.x + 1;//add a bit of tolerance
    // }
    
    var Canvas = require('canvas');
    var p = await DB.Page.findById(1);
    var canvas = new Canvas(p.width, p.height);
    var ctx = canvas.getContext('2d');
    var m = await DB.Character.findAll({
      attributes: [[Sequelize.literal('DISTINCT font'), 'font']],
    }) 
    
    for(var i = 0; i < m.length; i++){
      ctx.font = m[i].font;
      spaces[m[i].font] = ctx.measureText("M")
      
    }
    // console.log(spaces);
    // console.log(spaces);
    return spaces;
  }
  static async _rankFonts(docId,config){
    var m = await DB.Character.findAll({
      attributes: [[Sequelize.literal('DISTINCT font'), 'font']],
    }) 
    
    var fonts = m.map(f=>{
        return{
          name: f.font,
          values: Analyzer._getFont(f.font)
        }
    });
    //TODO: sort by font size then style, then variant
    fonts.sort((a,b)=>b.values.size-a.values.size);
    if(config.fontStyle){
      for(var i = 0; i < config.fontStyle.length; i++){
        var f = fonts.find(f=>f.name == config.fontStyle[i].name);
        f.values.style = config.fontStyle[i].style;
      }
    }
    if(config.fontHeadings){
      for(var i = 0; i < config.fontHeadings.length; i++){
        var f = fonts.find(f=>f.name == config.fontHeadings[i].name);
        f.values.heading = config.fontHeadings[i].heading;
      }
    }
    Analyzer._replaceStyles(fonts,config);
    
    // console.log(fonts);
    return fonts;
  }
  /* style | variant | size | family | type */
  static _getFont(font){
    var splt = font.split(' ');
    console.log(splt);
    return {
      style: splt[0],
      variant:splt[1],
      size:Number(splt[2].split('p')[0]),
      family: font.match(famRegex)[1],
      monospaced: splt[4] == "monospace"
    }
  }
  static _replaceStyles(fonts,config){
    if(config.fontStyle){
      for(var i = 0; i < config.fontStyle.length; i++){
        var f = fonts.find(f=>f.name == config.fontStyle[i].name);
        f.values.style = config.fontStyle[i].style;
      }
    }
  }
  
}

module.exports = Analyzer;