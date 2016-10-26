
// this.addFontStyle(fontObj);
// this.embeddedFonts[fontObj.loadedName] = fontObj;


require('pdfjs-dist');
require('./util.js')();
global.Image =  require('canvas').Image;
// PDFJS.pdfBug = true;
// PDFJS.disableFontFace =true;
PDFJS.disableWorker = true;
// PDFJS.disableWebGL = true;
PDFJS.renderInteractiveForms = false;
var fs = require('fs');
var data = new Uint8Array(fs.readFileSync('./test/fannie.pdf'));
class HTMLElement{
  
}
global.HTMLElement = HTMLElement;
var Canvas = require('canvas');
var i = 0;
var hashes = [];
var createCanvas = function(width,height){
  console.log("create Canvas()"+Array.prototype.slice.call(arguments).join());
  
  var canvas = new Canvas(200, 200);
  canvas._type = "canvas";
  canvas.prevContext = canvas.getContext.bind(canvas);
  canvas.getContext = function(type){
    console.log("getContext("+type+")"+JSON.stringify(canvas));
    // console.log(canvas.prevContext);
    var ctx = canvas.prevContext(type);   
    ctx._prevFillText = ctx.fillText;
    ctx._prevDrawImage = ctx.drawImage;
    ctx._prevPutImageData = ctx.putImageData;
    
    ctx.fillText = function(){
      
      console.log("fillText("+Array.prototype.slice.call(arguments).join()+")"+ this.font)
      return ctx._prevFillText.apply(ctx,Array.prototype.splice.call(arguments, 0));
    }
    
    ctx.drawImage = function(){
      var args = Array.prototype.splice.call(arguments, 0);
      console.log(args[0]);
      console.log(ctx._prevDrawImage.name+""+(i)+"("+args.join()+")\n")
      var ret = ctx._prevDrawImage.apply(ctx,args);
      if(args[0]._type =="canvas"){
        console.log("Write to File");
        var img = args[0].toDataURL("image/png");//.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync("test/images/temp/temp"+i+".png",img.replace(/^data:image\/png;base64,/, ""), 'base64'); 
        // imagemin(["test/images/temp/temp"+i+".png"], 'test/images/'+i+".png", {
        //     plugins: [
        //         imageminPngquant({quality: '65-80'})
        //     ]
        // }).then(files => {
        //     console.log(files);
        //     //=> [{data: <Buffer 89 50 4e …>, path: 'build/images/foo.jpg'}, …] 
        // });
        // var hash = phash.mh("test/images/temp/temp"+i+".png").then((res,err)=>{
        //   var found;
        //   for(var j = 0; j < hashes.length; j++){
        //     if(hamming(res,hashes[j]) < 200){
        //       found = hashes[j];
        //       console.log("matched"+found.toString('hex'),hamming(res,hashes[j]));
        //       break;              
        //     }
        //   }
        //   if(found){
        //     fs.writeFileSync("test/images/matched"+(i++)+"-"+found.toString('hex')+".png",img.replace(/^data:image\/png;base64,/, ""), 'base64'); 
        //   }else{
        //     fs.writeFileSync("test/images/"+res.toString('hex')+".png",img.replace(/^data:image\/png;base64,/, ""), 'base64'); 
        //   }
        //   if(!hashes.includes(res)){
        //     hashes.push(res);
        //   }
          
        // })
      }
      return ret;
    }
    ctx.putImageData = function(){
      console.log(ctx._prevPutImageData.name+"("+Array.prototype.slice.call(arguments).join()+")\n")
      var ret = ctx._prevPutImageData.apply(ctx,Array.prototype.splice.call(arguments, 0));
      // fs.writeFileSync("test/images/img"+(i++)+".png",ctx.canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64'); 

      return ret;
    }
    return ctx;
  };
  // console.log(JSON.stringify(canvas));
  return canvas;
};
    //   var t= {
    //     save: function(){
    //       console.log("save("+Array.prototype.slice.call(arguments).join()+")\n")
    //     },
    //     fillRect: function(){
    //       console.log("fillRect("+Array.prototype.slice.call(arguments).join()+")")
    //     },
    //     restore: function(){console.log("restore("+Array.prototype.slice.call(arguments).join()+")")},
    //     transform: function(){console.log("transform("+Array.prototype.slice.call(arguments).join()+")")},
    //     translate: function(){console.log("translate("+Array.prototype.slice.call(arguments).join()+")")},
    //     scale: function(){console.log("scale("+Array.prototype.slice.call(arguments).join()+")")},
    //     fillText: function(){console.log("fillText("+Array.prototype.slice.call(arguments).join()+") {font: "+ this.font+"}")},
    //     fillRect: function(){console.log("fillRect("+Array.prototype.slice.call(arguments).join()+")")},
    //     beginPath: function(){console.log("beginPath("+Array.prototype.slice.call(arguments).join()+")")},
    //     moveTo: function(){console.log("moveTo("+Array.prototype.slice.call(arguments).join()+")")},
    //     lineTo: function(){console.log("lineTo("+Array.prototype.slice.call(arguments).join()+")")},
    //     closePath: function(){console.log("closePath("+Array.prototype.slice.call(arguments).join()+")")},
    //     clip: function(){console.log("clip("+Array.prototype.slice.call(arguments).join()+")")},
    //     stroke: function(){console.log("stroke("+Array.prototype.slice.call(arguments).join()+")")},
    //     clearRect: function(){console.log("clearRect("+Array.prototype.slice.call(arguments).join()+")")},
    //     createImageData: function(){console.log("createImageData("+Array.prototype.slice.call(arguments).join()+")");return ctx.createImageData.apply(ctx,Array.prototype.splice.call(arguments, 0));},
    //     putImageData: function(){
    //       console.log("putImageData("+Array.prototype.slice.call(arguments).join()+")");   
    //       fs.writeFileSync("test/images/img.png",can.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64');    
    //         return ctx.putImageData.apply(ctx,Array.prototype.splice.call(arguments, 0));
    //       },
    //     measureText: ctx.measureText.bind(ctx),
    //     drawImage: function(){
    //       console.log((new Error()).stack);
    //       // can.width = this.width;
    //       // can.height = this.height;
    //       //console.log("drawImage("+Array.prototype.slice.call(arguments).join()+")"+JSON.stringify(Array.prototype.splice.call(arguments, 0)[0]));
    //       var args = Array.prototype.splice.call(arguments, 0)
    //       args[0]=can;
    //       ctx.drawImage.apply(ctx,args);
    //       fs.writeFileSync("test/images/img.png",can.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), 'base64');    
    //       // return ctx.drawImage.apply(ctx,Array.prototype.splice.call(arguments, 0))
    //     },
    //     setTransform:function(){console.log("setTransform("+Array.prototype.slice.call(arguments).join()+")")},
    //     quadraticCurveTo:function(){console.log("quadraticCurveTo("+Array.prototype.slice.call(arguments).join()+")")},
    //     fill:function(){console.log("fill("+Array.prototype.slice.call(arguments).join()+")")},
    //     rect:function(){console.log("rect("+Array.prototype.slice.call(arguments).join()+")")},
    //     bezierCurveTo:function(){console.log("bezierCurveTo("+Array.prototype.slice.call(arguments).join()+")")},
    //     canvas:{
    //       width: this.width != NaN ? this.width : 0,
    //       height: this.height != NaN? this.height : 0,
    //       test: "hello"
    //     }
    //   }
    //   return t;
    // }, 
    // width: this.width != NaN ? this.width : 0,
    // height: this.height != NaN? this.height : 0,
    // type: "canvas"


var createStyle = function(){
  return {
    sheet:{
      insertRule: function(){
        console.log("insertRule("+Array.prototype.slice.call(arguments).join()+")\n")
      },
      cssRules:{
        length: 0,
      }
    },
  }
}

class Document{
  static createElement(name){
    console.log("createElement("+Array.prototype.slice.call(arguments).join()+")");
    switch(name){
      case "canvas": return createCanvas();
      case "style": return createStyle();
    }
    return {width:0,height:0}
  }
  static setAttributeNS(){
    console.log("setAttributeNS("+Array.prototype.slice.call(arguments).join()+")")
  }
}
Document.documentElement = {
  getElementsByTagName: function(){
    return [{appendChild:function(){}}]
  },
};
Document.font= {};
global.document = Document;
// global.HTMLElement = {};


var processArray = function(maxPages, fn){
    var index = 1;

    return new Promise(function(resolve, reject) {

        function next() {
            if (index < maxPages) {
                fn(index++).then(next, reject);
            } else {
                resolve();
            }
        }
        next();
    })
}
var renderContext;
var margins = {};
PDFJS.getDocument(data).then(function (pdf) {
  pdf.getMetadata().then(meta=>{
    console.log(meta);
    
  })
  // console.log('Number of pages: ' + pdf.numPages);
  // var replacer = function(key,value){
  //   if(typeof value == "function"){
  //     return "function";
  //   }
  //   return value;
  // }
  // console.log(pdf);
  // pdf.getPageIndex([
  //             {
  //               "num":468,
  //               "gen":0
  //             },
  //             {
  //               "name":"FitH"
  //             },
  //             796
  //           ]).then(function(num){
    
    var nextPage = function(num){
      return new Promise(function(res,rej){
        // pdf.getAttachments().then(function(d){
        //   console.log(d);
        // })
        pdf.getPage(num).then(function getPageHelloWorld(page) {
          
          console.log("\n\n\nPAGE: "+num);
          var viewport = page.getViewport(1);
          var canvas = document.createElement('canvas')
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport,
          };
           
          page.render(renderContext).then(()=>{
            res();
          });
        });
      })
    }
    
    processArray(pdf.numPages, nextPage).then(function() {
        // console.log(renderContext);
    }, function(reason) {
        // rejection happened
    });
  // var topMargins = [];
  // for(var i = 1; i <= pdf.numPages; i++){
    
  // }
  // console.log(topMargins);
});
global.sync = require('synchronize');
