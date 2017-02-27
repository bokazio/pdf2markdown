const TableExtractor = require('./table_extractor/table_extractor.js');
const HeaderFooterExtractor = require('./header_footer_extractor/header_footer_extractor.js');

var Logger = require('../../logger/logger.js');


/*
* Renderer interface
* ```
* line:{
*   type: "TABLE",
*   value: [table data],
*   y: min y coordinate
* }
* ```
 */

class Extractor{
  static async run(page, analysis, config){
    Extractor.analysis = analysis;
    Extractor.config = config;
    
    
    // Setup
    Extractor.lines = await Extractor.generateLines(page);
    Extractor.lines = Extractor.createSpaces(Extractor.lines);
    Extractor.segments = await Extractor.generateSegments(page);    
    
    
    // replace 
    await Extractor.detectLinks(page,Extractor.lines);
    await Extractor.detectImages(page,Extractor.lines);
    
    
    var headerFooterResult =  HeaderFooterExtractor.run(page, Extractor.lines, Extractor.config, Extractor.analysis);
    Extractor.lines = headerFooterResult.lines;

    var detection = TableExtractor.run(Extractor.lines, Extractor.segments, config,page);

    Extractor.lines = detection.lines;

    
    
    var headings = Extractor.detectHeading(Extractor.lines);
    var content = await Extractor.detectFontStyle(Extractor.lines);
    
    var list = Extractor.extractList(content,page);
    // for(var i = 0; i < content.length; i++){
    //   content[i] = Extractor.detectListType(content[i],page);
    // }
    // content = ListExtractor.run()
    content = content.concat(headings).concat(detection.result.tables);
    content.sort((c1,c2)=>{
      var y1 = c1.miny ? c1.miny : c1.y;
      y1 = y1 ? y1 : c1[0].y;
      var y2 = c2.miny ? c2.miny : c2.y;
      y2 = y2 ? y2 : c2[0].y;
      return y1 - y2;
    })
    
    // TODO: Refactor into Renderer
    var printContent = (con)=>{
      var gen = "";
      for(var i = 0; i < con.length; i++){
        var line = con[i];
        if(line.map){
          // var list = Extractor.detectListType(line,page)
          // if(list){
          //   console.log(list);
          // }else{
          
            var nw =false;
            var font = Extractor.fonts.find(f=>f.name == line[0].fontName);
            var height;
            if(!font){
              height = 12;
            }else{
              height = font.height;
            }
            if(i+1 < con.length && ( (con[i+1].map ? con[i+1][0].y : con[i+1].y) - con[i][0].y ) > (height * 1.35) ){
              nw = true;
            }
            gen +=line.map(l=>{            
              return l.value            
            }).join('')
            if(nw){
              gen+="\n\n";
            }else{
              if(line[0].value == " " && line.length == 1){
                gen+="\n\n";
                
              }
            }
          // }
          
        }else{
          var ret = "";
          if(line.level){
            for(var j = 0; j < line.level; j++){
              ret+="#"
            }
            ret+=" "+line.value;
            gen+="\n\n"+ret+"\n";
          }else{
            
            if(line.contents.length > 0){
              gen+= "\n\n"+Table.createTable(line.contents, Table.getMaxWidth(line.contents))+"\n\n"; 
              // console.log(line); 
            }

            
          }
          
        }
      }
      return gen;
    }
    // var fs = require('fs');
    // var append = true;
    // if(append){
    //   fs.appendFileSync("test/fannie.md","\n\nPage "+page.number+"\n---\n\n"+printContent(content));
    // }else{
    //   fs.writeFileSync("test/fannie_"+page.number+".md",printContent(content));
    // }
    return printContent(content);
    // var extractedPage = {
    //   headers: headers,
    //   footers: footers,
    //   // content: content
    // };
    
    
    
    
    // for(var i = 0; i < content.length; i++){
    //   if(content[i].)
    // }
    
    // console.log(JSON.stringify(Extractor.analysis.spaces));
    // console.log(Extractor.analysis.fonts)
      
      
    // if(footers){
    //   extractedPage.push(footers);      
    // }
    // console.log(extractedPage);
  }
  
  static async generateSegments(page){
    return page.getLines();
  }
   
  static extractList(lines,page){
    var lists = [];
    for(var i = 0; i < lines.length; i++){
      var l = Extractor.detectListType(lines[i],page);
      if(l){
        lists.push(l);
      }
    }
    return lists;
  }
  
  
  static extractInlineElements(lines){
    // for(var i = 0; i < lines.length; i++){
      Extractor.detectFontStyle(lines);
    // }
  }
  
  static createSpaces(lines){
    lines = lines.sort((l1,l2)=>l1[0].y - l2[0].y);
    for(var i = 0; i < lines.length; i++){
      Extractor.addSpaces(lines[i]);
    }
    return lines;
  }
  
  static addSpaces(line){
    if(!line.find(l=>l.value === " ")){
      for(var i = 0; i < line.length; i++){
        if(i+1 < line.length){
          var found = Extractor.analysis.spaces[line[i].fontName];
          var wide = "wWMmR:ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          var small = "it/j";
          var lowTol = (wide.includes(line[i].value) && wide.includes(line[i+1].value)) || (wide.includes(line[i].value) && !wide.includes(line[i+1].value));
          var vLowTol = !lowTol && small.includes(line[i].value);
          var h = "crspflt1234567890";
          var highTol = h.includes(line[i].value) ;
          
          
          var SPACE_FACTOR_CHUNK =  lowTol ? 2.5 : 1.6;
          SPACE_FACTOR_CHUNK = vLowTol ? 2.7 : SPACE_FACTOR_CHUNK ;
          SPACE_FACTOR_CHUNK = highTol ? 1.3 : SPACE_FACTOR_CHUNK ;
          
          
          if( line[i].x + found[line[i].value].width + found.space.width * SPACE_FACTOR_CHUNK <= line[i+1].x ){
            
            line[i].value =  line[i].value +" ";
          }
          
        }
      }
    }
    // console.log(line.map(l=>l.value).join(''));
  }
  
  static async detectLinks(page,lines){
    var annotations = await page.getAnnotations();
    for(var i = 0; i < annotations.length; i++){
      var an = annotations[i];
      
      var line = lines.find(l=> (l[0].y >= an.y1 && l[0].y <= an.y2) || (l[0].y >= an.y2 && l[0].y <= an.y1) );

      if(line){
        var text = line.filter(l=> (l.x >= an.x1 && l.x <= an.x2) || (l.x >= an.x2 && l.x <= an.x1));
        //TODO: relative link to headings
        if(text && text.length > 0){
          text[0].value = "["+text[0].value;
          text[text.length-1].value = text[text.length-1].value + "]("+'relative'+")";
          
        }else{
          var link = {
            value: "["+an.value+"]("+an.value+")",
            x: an.x1,
            y: an.y1
          };
          line.push(link);
          line.sort((l1,l2)=>l1.x-l2.x);
        }
      }
    }
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
      
      var line = lines.find(l=> l[0].y == im.y );

      var imgText = {
        value: "!["+"images/"+imgdata.hash+"]("+"images/"+imgdata.hash+".png ="+im.width+"x"+im.height+") ",
        x: im.x,
        y: im.y
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
  }
  
  static async detectFontStyle(lines){
    // 
    var fonts = Extractor.fonts != null ? Extractor.fonts : await DB.Font.findAll();    
    Extractor.fonts = fonts;
    Extractor.config.boldFonts = ["\"g_d0_f4\", sans-serif"];
    
    //TODO:
    var start = false;
    var type = null;
    var currentString = "";
    var first=null;
    for(var i = 0; i < lines.length; i++){
      var line = lines[i];
    // console.log(fonts.map(f=>f.get({plain: true})));
      
    // if(line.find((l,i)=>i!=0&&l.fontName!=line[0].fontName)){
      for(var j = 0; j < line.length; j++){
        var found = fonts.find(f=>f.name == line[j].fontName);
        // console.log(line[j].value,found.family);
        if(found){
          if(found.weight != "normal" || Extractor.config.boldFonts.find(f=>f==found.family)){
            if(!start){
              currentString = String(line[j].value);
              line[j].value = line[j].value !== " " ? " **"+line[j].value : " **";
              start = true;
              type = "bold";
              first = {
                j:j,
                i:i
              };
              
            }
          }else if(found.style != "normal"){
            if(!start){
              currentString = line[j].value;
              line[j].value = line[j].value !== " " ? " _"+line[j].value : " _";
              start = true;
              type = "italic";
              first = {
                j:j,
                i:i
              };
            }
          }else if(start){
            // check for only whitespace and remove markup

            if(currentString.trim() == "**" || currentString.trim() == "_"){
              if(type == "bold"){

                lines[first.i][first.j].value = lines[first.i][first.j].value.replace("**","");
              }else{
                lines[first.i][first.j].value = lines[first.i][first.j].value.replace("_","");
              }
              currentString = "";
            }else{
              if(j-1 >= 0 &&line[j-1].value === " "){
                line[j-1].value =  (type == "bold" ? "** " : "_ ") + line[j-1].value;
              }else{
                line[j].value =  (type == "bold" ? "** " : "_ ") + line[j].value;
              }
            }
            start = false;
          }
        }
        currentString+=line[j].value;
      }
    }
    // for(var i = 0; i < lines.length; i++){
    //   console.log(lines[i].map(l=>l.value).join(''));      
    // }
    return lines;
  }
  
  
  static detectListType(line,page){
    var ul = ['\u25A0','-','*','+','•'];
    var ol = /(^\s*(\d+|\w)\s*\.*\s+)|(^\s*\(\s*(\d?|\w+)\s*\)\s+)/;
    var char = line[0];
    line = line.map(l=>l.value).join('');
    
    var m = line.match(ol);
      if(m){
        return {
          type: 'OL',
          line: line,
          bullet: m[2] ? m[2] : m[4],
          indent: Extractor.detectIndentLevel(char,page),
          y: char.y
        }
      }
      if(ul.includes(line.charAt(0))){
        return {
          type: 'UL',
          line: line.substr(1),
          bullet: char.value,
          indent: Extractor.detectIndentLevel(char,page),
          y: char.y
        }
      }
  }
  
  
  
  static detectIndentLevel(char,page){
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));
    var spaces = 0;
    while((char.x - Extractor.config.margin.left * diag) > Extractor.analysis.spaces[char.fontName].tab * spaces ){ 
      spaces++;
    }
    return spaces;
  }
  static _detectLevel(line){  

    for(var i = 1; i< 6; i++){
      var found = Extractor.analysis.fonts[i].find(t=> t.name == line[0].fontName);
      if(found){
        return{
          value: line.map(l=>l.value).join(''),
          level: i,
          y: line[0].y
        }   
      }         
    }
    
    return null;
  }
  static detectHeading(lines){
    var headings = [];
    var rem = [];
    for(var i = 0; i < lines.length; i++){
      // console.log(lines[i].value,lines[i].fontName);
      // Check that whole line is same font to eliminate inline
      if(lines[i].length > 0  && lines[i].filter((c,index)=> c.fontName != lines[i][0].fontName).length <=3 && lines[i].find((c,index)=> c.value != ' ')){
        
          var h = Extractor._detectLevel(lines[i]);
          if(h){
            lines.splice(i,1);
            i--;
            headings.push(h);
          }
        // }
      }
    }    
    // console.log("Headings:");
    // console.log(headings);
    return headings;
    
  }
  
  
  
  static async generateLines(page){
    var characters = await page.getCharacters({
      order:" y ASC, x ASC"
    });
    return Extractor.getLines(characters);
  }
  static getLines(content){
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
}

module.exports = Extractor;


class Table {
  //Remove Blank Rows and Columns
  static cleanTable(table) {
    var newTable = [];
    newTable.push(table[0]);
    for (var i = 1; i < table.length; i++) {
      if (!Table.emptyRow(table[i])) {
        newTable.push(table[i]);
      }
    }
    return Table.trimColumns(newTable);
  }
  //Check if empty Row
  static emptyRow(row) {
    for (var i = 0; i < row.length; i++) {
      if (row[i] !== null) {
        return false;
      }
    }
    return true;
  }
  //Remove empty Columns
  static trimColumns(table) {
    var rowBitmap = [];
    if (table.length == 0) {
      return table;
    }
    //Generate initial bitmap based on first row
    for (var i = 0; i < table[0].length; i++) {
      table[0][i] !== null ? rowBitmap[i] = 1 : rowBitmap[i] = 0
    }
    // increment bitmap if a column exist
    for (var i = 1; i < table.length; i++) {
      for (var j = 0; j < table[i].length; j++) {
        table[i][j] !== null ? rowBitmap[j]++ : {}
      }
    }
    //Create a new Table
    var newTable = [];
    for (var i = 0; i < table.length; i++) {
      var newRow = [];
      for (var j = 0; j < rowBitmap.length; j++) {
        rowBitmap[j] > 0 ? newRow.push(table[i][j] === null ? "" : table[i][j]) : {}
      }
      newTable.push(newRow);
    }
    return newTable;
  }


  //Creates Title Row
  static createTitles(row, rowBitmap) {
    var title = '';
    if(row.length > 0){
      title+='|';
    }
    for (var i = 0; i < row.length; i++) {
      title += '  ' + Table.createCell(row[i], rowBitmap[i], ' ') + '  |';
    }
    title += '\n';
    return title;
  }

  //Create a Cell with appropriate padding
  static createCell(str, maxWidth, spacer) {
    var width = maxWidth - str.length;

    for (var i = 0; i < width; i++) {
      str += spacer;
    }
    return str;
  }
  //Find max padding needed for a column
  static getMaxWidth(table) {
    var rowBitmap = [];
    //Generate initial bitmap based on first row
    for (var i = 0; i < table[0].length; i++) {
      rowBitmap[i] = (table[0][i].length > 3 ? table[0][i].length : 3);
    }
    // find max width for next columns column
    for (var i = 1; i < table.length; i++) {
      for (var j = 0; j < table[i].length; j++) {
        table[i][j].length > rowBitmap[j] ? rowBitmap[j] = table[i][j].length : {}
      }
    }
    return rowBitmap;
  }


  //Creates Centering Row
  static createCentering(rowBitmap) {
    var centering = '';
    if(rowBitmap.length > 1){
      centering+='|';
    }
    for (var i = 0; i < rowBitmap.length; i++) {
      centering += '--' + Table.createCell('', rowBitmap[i], '-') + '--|';
    }
    centering += '\n';
    return centering;
  }

  //Creates Table Body TODO: wrap text at max width
  static createTable(rows, rowBitmap) {
    var table = '';
    table = table + Table.createTitles(rows[0], rowBitmap);
    table = table + Table.createCentering(rowBitmap);
    if (rows.length > 1) {
      table += '|';
      //Go through each row and column an create the rest of the cells
      for (var i = 1; i < rows.length; i++) {
        for (var j = 0; j < rows[i].length; j++) {
          table += '  ' + Table.createCell(rows[i][j], rowBitmap[j], ' ') + '  |';

        }
        if (i + 1 < rows.length) {
          table += '\n|';
        }
      }
    }
    return table;
  }
}