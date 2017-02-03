var TableExtractor = require('./table_extractor/table_extractor.js');
var Logger = require('../../logger/logger.js');
class Extractor{
  static async run(pageId, analysis, config){
    Extractor.analysis = analysis;
    Extractor.config = config;
    var page = await DB.Page.findById(pageId);
    Logger.log("Page "+page.number);
    var lines = await Extractor.generateLines(page);
    Extractor.segments = await Extractor.generateSegments(page);
    // console.log(Extractor.segments.map(e=>e.get({plain: true})))
    var detection = TableExtractor.run(lines, Extractor.segments, config,page);
    // console.log(detection);
    for(var i = 0; i < detection.tables.length; i++){
      if(detection.tables[i].contents.length > 0){
        console.log("\n"+Table.createTable(detection.tables[i].contents, Table.getMaxWidth(detection.tables[i].contents))); 
        console.log(detection.tables[i]); 
      }
      console.log("\n\n EXTRA: ");
      console.log(detection.extraLines);
      console.log("\n\n HRs: ");
      console.log(detection.HRs);
      console.log("\n");     
    }
    var extractedPage = {
      headers: Extractor.getHeaders(page,lines),
      footers: Extractor.getFooters(page,lines),
      tables: detection.tables,
      HRs: detection.HRs,
      extraLines: detection.extraLines
    };
    
    
    
    // if(footers){
    //   extractedPage.push(footers);      
    // }
  }
  
  
  static getParagraph(lines){
    var p = "";
    for(var i = 0; i < lines.length; i++){
      p += lines[i].map(l=>l.value).join('') + "\n";
    }
    return {
      type: "Paragraph",
      value: p
    }
  }
  
  // TODO 
  static getHeaders(page, lines){
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));
    var headersChars = lines.filter(l=>l[0].y <= (Extractor.config.margin.top * diag))
    lines = lines.filter(l=>l[0].y > (Extractor.config.margin.top * diag));
    var headers = {
      type: "HEADER",
      value: []
    }
    for(var l of headersChars){
      headers.value.push(Extractor._detectMultipleAlignment(l));
    }
    return headers;
  }
  
  static async generateSegments(page){
    return await page.getLines();
  }
      
  
  static getFooters(page, lines){
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));

    var footerChars = lines.filter(l=>l[0].y >= (page.height - Extractor.config.margin.bottom * diag))
    lines = lines.filter(l=>l[0].y < (page.height - Extractor.config.margin.bottom * diag));

    var headers = {
      type: "FOOTER",
      value: []
    }
    for(var l of footerChars){
      headers.value.push(Extractor._detectMultipleAlignment(l));
    }
    return headers;
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
  static _detectMultipleAlignment(content){   
    var separations = Extractor.detectLargeSpaces(content);
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
    
     
    return alignments;
  }
  static detectLargeSpaces(content){
    var largeSpaces = [];
    for(var i=1; i < content.length; i++){
      if(Math.trunc(content[i].y) == Math.trunc(content[i-1].y) && content[i].font == content[i-1].font && Extractor.analysis.spaces[content[i].font].width < (content[i].x - content[i-1].x) ){
        //console.log("big space here: "+content[i].value+", "+content[i-1].value);
        largeSpaces.push({
          before: content[i-1],
          after: content[i]
        })
      }
    }
    return largeSpaces;
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