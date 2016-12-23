var Sequelize = require('sequelize');
class Markdown{
  constructor(config,stream){
    this._readConfig(config);
    this.spaces = {};
  }
  async convert(){
    var pg = 50;
    // var hInch = 72 * 1.5;
    await this.measureSpace();
    for(var i = 1; i<50; i++){
      console.log("\n\nPage "+i);
      var page = await DB.Page.findOne({
        where:{
          number: i
        }
      });

      await this.getHeadersFooters(page);
      
    }
    // console.log(page.get({plain: true}));
    
    // var headers = await DB.Character.findAll({
      
    // })
    
    
    // console.log(headers.map(c=>c.value).join(''));
    
    // var footers = await DB.Character.findAll({
    //   where:{
    //     y:{
    //       $gte: page.height - 72
    //     },
    //     pageId: pg,
    //   }
    // })
    
    
    // console.log("footers:\n"+footers.map(c=>c.value).join(''));
  } 
  _render(){
    
  } 
  async getHeadersFooters(page){
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));

    var headersChars = await page.getCharacters({
      where:{
        y:{
          $lte: this.config.margin.top *diag
        },
      },
      order: 'y ASC, x ASC'
    })

    var footersChars = await page.getCharacters({
      where:{
        y:{
          $gte: page.height - (this.config.margin.bottom *diag)
        }
      }
    })
    // console.log(headersChars.map(h=>h.get({plain:true})));
    // if(headersChars.length >0){
      var lines = this.getLines(headersChars);
      for(var l of lines){
        this.detectMultipleAlignment(l);
      }
    // }
    //this.detectMultipleAlignment(headersChars);
  }
  detectAlignment(content){
   
  }
  
  detectMultipleAlignment(content){   
    var separations = this.detectLargeSpaces(content);
    var alignments={};
    var current = 'left';
    alignments[current]=[];
    if(separations.length ==0){
      console.log(content.map(l=>{
        return l ? l.value : ''
      }).join(''));
      return;
    }
     for(var i = 0; i< content.length; i++){
       if(!separations.find(f=>f.after.id==content[i].id)){
         alignments[current].push(content[i]);
       }else{
         if(separations.length == 1 || current == "center"){
           current = "right";
         }else{
           current = "center";
         }
         alignments[current]=[];
         alignments[current].push(content[i]);
       }
     }
    
     var str = alignments["left"] ? alignments["left"].map(l=>l.value).join('')+"|" : "|";
     str += alignments["center"] ? alignments["center"].map(l=>l.value).join('')+"|" : "|";
     str += alignments["right"] ? alignments["right"].map(l=>l.value).join('') : "";
     console.log( str);
     
    return alignments;
  }
  getLines(content){
    var lines = [];
    var current = 0;
    lines[current]=[content[0]];
    for(var i = 1; i< content.length; i++){
      if(Math.trunc(content[i].y) != Math.trunc(content[i-1].y) ){
        current++;
        lines[current]=[];
      }
      lines[current].push(content[i]);
    }
    return lines;
  }
  detectLargeSpaces(content){
    var largeSpaces = [];
    for(var i=1; i < content.length; i++){
      if(Math.trunc(content[i].y) == Math.trunc(content[i-1].y) && content[i].font == content[i-1].font && this.spaces[content[i].font] < (content[i].x - content[i-1].x) ){
        //console.log("big space here: "+content[i].value+", "+content[i-1].value);
        largeSpaces.push({
          before: content[i-1],
          after: content[i]
        })
      }
    }
    return largeSpaces;
  }
  
  async measureSpace(){
    var m = await DB.Character.findAll({
      where:{
        value: 'M'
      },
      attributes: [[Sequelize.literal('DISTINCT font'), 'font']],
    })    
    for(var i = 0; i < m.length; i++){
      var space = await DB.Character.findOne({
        where:{
          font: m[i].font,
          value: 'M'
        },
      })
      var next = await DB.Character.findOne({
        where:{
          font: m[i].font,
          y: space.y,
          x:{
            $gt: space.x
          }
        },
        order: 'x ASC'
      })
     this.spaces[m[i].font] = next.x - space.x + 1;//add a bit of tolerance
    }
    console.log(this.spaces);
    
  }
  _findOneArray(arr,func){
    var find = arr.length > 0 ? arr[0] : undefined;
    func.bind(find);
    arr.forEach(func);
    return find;
  }
  //Currently page dimensions is in inches only, TODO: add other metrics and convert them to inches
  _readConfig(config){
    var diagonal = 13.901438774457844;
    if(config.dimensions.width && config.dimensions.height){
      diagonal = Math.sqrt(Math.pow(config.dimensions.width,2) + Math.pow(config.dimensions.height,2));
    }
    this.config = {
      //Precomputed value, needs * by page diagonal to get # of pixels for margin
      margin:{
        right: (config.margin.right ? config.margin.right : 1) / diagonal,
        left: (config.margin.left ? config.margin.left : 1)/ diagonal,
        top: (config.margin.top ? config.margin.top : 1)/ diagonal,
        bottom: (config.margin.bottom ? config.margin.bottom : 1) / diagonal
      }
    }
  }
}
module.exports = Markdown;

