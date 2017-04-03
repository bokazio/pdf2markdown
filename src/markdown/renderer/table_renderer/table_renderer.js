var Logger = require('../../../logger/logger.js');


class TableRenderer {
  static render(table){   
    var ret = "\n\n"
    ret += TableRenderer.createTable(table, TableRenderer.getMaxWidth(table))
    ret += "\n\n"; 
    return ret;
  }
  //Remove Blank Rows and Columns
  static cleanTable(table) {
    var newTable = [];
    newTable.push(table[0]);
    for (var i = 1; i < table.length; i++) {
      if (!TableRenderer.emptyRow(table[i])) {
        newTable.push(table[i]);
      }
    }
    return TableRenderer.trimColumns(newTable);
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
    //Create a new TableRenderer
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
      title += '  ' + TableRenderer.createCell(TableRenderer.renderInline(row[i]), rowBitmap[i], ' ') + '  |';
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
      centering += '--' + TableRenderer.createCell('', rowBitmap[i], '-') + '--|';
    }
    centering += '\n';
    return centering;
  }

  //Creates TableRenderer Body TODO: wrap text at max width
  static createTable(rows, rowBitmap) {
    var table = '';
    table = table + TableRenderer.createTitles(rows[0], rowBitmap);
    table = table + TableRenderer.createCentering(rowBitmap);
    if (rows.length > 1) {
      table += '|';
      //Go through each row and column an create the rest of the cells
      for (var i = 1; i < rows.length; i++) {
        for (var j = 0; j < rows[i].length; j++) {
          table += '  ' + TableRenderer.createCell(TableRenderer.renderInline(rows[i][j]), rowBitmap[j], ' ') + '  |';

        }
        if (i + 1 < rows.length) {
          table += '\n|';
        }
      }
    }
    return table;
  }
  static renderInline(elements){
    var Renderer = require('../renderer.js');
    return Renderer.renderAll(elements).replace(/\n/g,"");
  }
}
module.exports = TableRenderer;