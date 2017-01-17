var Sequelize = require('sequelize');
var Analyzer = require('./analyzer/analyzer.js');
var Extractor = require('./extractor/extractor.js');
class Markdown{
  constructor(config,stream){
    this._readConfig(config);
    this.spaces = {};
    this.document = [];
  }
  async convert(){
    
    this.analysis = await Analyzer.run(1,this.config);
    
    // var pg = 50;
    // // var hInch = 72 * 1.5;
    // await this.measureSpace();
    // for(var i = 1; i<5; i++){
      
      this.document.push(await Extractor.run(1,this.analysis,this.config));
      // console.log("\n\nPage "+i );
      // var page = await DB.Page.findOne({
      //   where:{
      //     number: i
      //   }
      // });
      // await this.getCharacters(page);
      // await this.getImages(page);
      // await this.getHeadersFooters(page);
      
    // }
    
   
    
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
  async getCharacters(page){
    var characters = await page.getCharacters({
      order:" y ASC, x ASC"
    });
    this.lines = this.getLines(characters);
  }
  async getImages(page){
    this.images = await page.getImages({
      order:" y ASC, x ASC"
    });
  }
  async getHeadersFooters(page){
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));

    var headersChars = this.lines.filter(l=>l[0].y <= (this.config.margin.top * diag))

    var footersChars = this.lines.filter(l=>l[0].y >= (page.height - this.config.margin.bottom * diag))
    
    var headerImages = this.images.filter(l=>l.y <= (this.config.margin.top * diag));
    
    if(headerImages.length > 0){
      console.log(headerImages.map(i=>i.get({plain:true})));
      throw "FOUND";
    }
    
    this.headers = [];
    for(var l of headersChars){
      this.headers.push(this.detectMultipleAlignment(l));
      //insert images into headers here if they exist
    }
    
    this.footers = [];
    for(var l of footersChars){
      this.footers.push(this.detectMultipleAlignment(l));
      //insert images into footers here if they exist
    }
    
  }
  detectAlignment(content){
   
  }
  
  detectMultipleAlignment(content){   
    var separations = this.detectLargeSpaces(content);
    var alignments={};
    var current = 'left';
    alignments[current]=[];
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
    
     // var str = alignments["left"] ? alignments["left"].map(l=>l.value).join('')+"|" : "|";
     // str += alignments["center"] ? alignments["center"].map(l=>l.value).join('')+"|" : "|";
     // str += alignments["right"] ? alignments["right"].map(l=>l.value).join('') : "";
     // console.log( str);
     
    return alignments;
  }
  getLines(content){
    var lines = [];
    var current = 0;
    lines[current]=[content[0]];
    for(var i = 1; i< content.length; i++){
      if(content[i].y != content[i-1].y ){
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

