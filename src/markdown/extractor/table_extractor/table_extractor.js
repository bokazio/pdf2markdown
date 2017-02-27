var Logger = require('../../../logger/logger.js')
// Amount of tolerance to allow for pixel deviation +/- this value
var tolerance = 2;
/**
 * Extracts Tables
 */
class TableExtractor{
  
  /**
   * Run and detect tables, hrs and extra lines
   * @param  {Array} contentLines  Array of Array of DB.Character objects corresponding to a line on the page
   * @param  {Array} segments      drawn line segments on the page - DB.Line objects
   * @param  {Object} config       User provided configuration overrides
   * @param  {Page} page           Current Page
   * @return {Object}              {result: {tables, HRs, extralines}, lines:  (filtered contentLines)}
   */
  static run(contentLines, segments, config, page){
    Logger.debug("Extracting Tables");
    //Find Vertical Lines
    var verticals = segments.filter(s=>((s.x2 - s.x1) <= 5 && (s.x2 - s.x1) >= -5));
    // Find Horizontal Lines
    var horizontals = segments.filter(s=>((s.y2 - s.y1) <= 5 && (s.y2 - s.y1) >= -5));
   
    // Normalize values so that columns start with y1 being smaller, also account for pixel deviation using tolerance
    var columns = TableExtractor._normalizeLines(verticals,v=>v.y1 < v.y2, v=>v.x1);
    // Normalize values so that rows start with x1 being smaller, also account for pixel deviation using tolerance
    var rows = TableExtractor._normalizeLines(horizontals,v=>v.x1 < v.x2, v=>v.y1);
    
    //Find unique grids and columns
    var grids = TableExtractor.identifyGridsAndColumns(columns);
    
    var extra = [];
    
    // Extract the Rows
    TableExtractor._extractAllRows(grids,rows,extra);
    
    // Extract the content
    contentLines = TableExtractor._extractAllContent(grids,contentLines);
    
    var filtered = TableExtractor._filterHRs(extra,config,page);  
    
    // sort tables
    grids.sort((a,b)=>a.miny-b.miny)
    
    Logger.debug(grids.length+" tables detected");
    
    // return tables, HRs and extraLines
    return {
      result: {
        tables: grids,
        HRs: filtered.HRs,
        extraLines: filtered.extraLines,
      },
      lines: contentLines
    }
  }
  /**
   * 
   * Package Tables Up to Renderer interface
   * @return {[type]} [description]
   */
  static _packageTables(tables){
    return tables.map(t=>{
      return {
        type: "TABLE",
        value: t,
        y: t.miny
      }
    })
    
  }
  
  /**
   * Get the HRs from extra lines not in table Extraneous Lines
   * @param  {Array}  lines  extra lines
   * @param  {Object} config of document
   * @param  {Page} page   current page
   * @return {Object}        HRs and extralines
   */
  static _filterHRs(lines,config,page){
    var res = {
      HRs: [],
      extraLines: []
    }
    // Find half width of page, if line width is greater than half page, its probably an HR.
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));
    var halfWidth = (page.width - (config.margin.left * diag) - (config.margin.right * diag)) / 2;

    for(var i = 0; i < lines.length; i++){
      // distance formula: sqrt( (x2-x1)^2 + (y2-y1)^2) )
      var lineWidth = Math.sqrt(Math.pow(lines[i][0].x2 - lines[i][0].x1,2) + Math.pow(lines[i][0].y2 - lines[i][0].y1,2));
      if(lineWidth >= halfWidth){
        res.HRs.push({
          type: "HR",
          y: lines[i][0].y1
        });
      }else{
        res.extraLines.push({
          type: "EXTRA_LINE",
          y: lines[i][0].y1
        });
      }
    }  
    return res;
  }
  
  /**
   * Ensures that x1,y1 of line adhere to comparator, if it doesn's it swaps the vertices
   * the hash corresponds to the group that each line is added to, usually either the x1 position or the y1 position
   * If lines are not perfectly straight
   * attempt to correct this by checking tolerance and assign same value for small deviations on same axis
   * Example: 
   * ```
   * line:{
   *   x1: 20,
   *   y1: 50,
   *   x2: 22,
   *   y2: 150
   * }
   * ```
   * Would be normalized to:
   * ```
   * line:{
   *   x1: 20,
   *   y1: 50,
   *   x2: 20,
   *   y2: 150
   * }
   * ```
   * @param  {Array} lines   All lines to normalize
   * @param  {Function} comparator swap if comparator returns false
   * @param  {Function} hash       How to group the lines
   * @return {Object}            Normalized Lines
   */
  static _normalizeLines(lines,comparator,hash){
    var normalized = {};
    for(var i = 0; i < lines.length; i++){
      //  if x1 and x2 are within tolerance we set them to be them both to be the minimum value
      //  This ensures we always assign to smaller value to keep values uniform along comparison
      if(tol(lines[i].x1, lines[i].x2, tolerance)){
        if(lines[i].x1 < lines[i].x2){
          lines[i].x2 = lines[i].x1;
        }else{
          lines[i].x1 = lines[i].x2;
        }
      }
      //  if y1 and y2 are within tolerance we set them to be them both to be the minimum value
      //  This ensures we always assign to smaller value to keep values uniform along comparison
      if(tol(lines[i].y1 , lines[i].y2, tolerance)){
        if(lines[i].y1 < lines[i].y2){
          lines[i].y2 = lines[i].y1;
        }else{
          lines[i].y1 = lines[i].y2;
        }
      }
      // swap if comparator is true
      if(!comparator(lines[i])){
        var tx = lines[i].x1;
        var ty = lines[i].y1;
        lines[i].x1 = lines[i].x2;
        lines[i].y1 = lines[i].y2;
        lines[i].x2 = tx;
        lines[i].y2 = ty;
      }
      // add set if doesnt exist
      if(!normalized[hash(lines[i])]){
        normalized[hash(lines[i])] = []
      }
      // add line to set
      normalized[hash(lines[i])].push(lines[i]);
    }
    return normalized;
  }
  
  /**
   * Identifies all grids and the grid's min and max y values, also assigns columns to a grid
   * @param  {Array} columns List of all vertical lines identified as potential columns
   * @return {Array}         List of Identified Grids
   */
  static identifyGridsAndColumns(columns){
    var grids = [];
    // get keys of the columns corresponding to x position
    var keys = Object.keys(columns).sort((a,b)=>(Number(a)-Number(b)));
    
    for(var i = 0 ; i < keys.length; i++){
      // Current x position
      var x = Number(keys[i]);
      // work with a column at a time
      var column = columns[x];
      
      // sort it by y position ascending
      column.sort((a,b)=> a.y1 - b.y1);
      
      // min and max y position of a grid, also used to see if separation from grid to signal new grid
      var maxy = column[0].y2;
      var miny = column[0].y1;
      
      var res = TableExtractor._addColumn(grids,column, maxy, miny,x);
      // Set min and max values
      maxy = res.maxy;
      miny = res.miny;
      
      
      // no change in grid on single column, means its a single column in a grid, find grid or create one
      TableExtractor._addSingleColumn(grids,miny,maxy,x);
      
    }
    
    grids = TableExtractor._mergeGrids(grids);
    
    return grids;
  }
  
  static _mergeGrids(grids){
    var mGrids = [];
    for( var i = 0; i < grids.length; i++){
      var found = grids.find(g=>g.maxy >= grids[i].maxy && g.miny <= grids[i].miny && !(grids[i].maxy == g.maxy && grids[i].miny == g.miny) )
      if( found){
        if(!found.variableColumn){
          found.variableColumn = []
        }
        found.variableColumn.push(grids[i]);
      }else{
        mGrids.push(grids[i]);
      }
    }
    return mGrids;
  }
  
  /**
   * Adds a single column to a grid
   * if the grid does not exist, it creates a new grid
   * @param {Array} grids All the current Grids
   * @param {Number} miny  value for the current set of lines corresponding to a single grid's column
   * @param {Number} maxy  value for the current set of lines corresponding to a single grid's column
   * @param {Number} x     position of the column to add
   */
  static _addSingleColumn(grids,miny,maxy,x){
    //Need to check here for dup
    var found = grids.find(g=>tol(g.miny,miny,2) && tol(g.maxy,maxy,2))
    if(found == null){
      // No duplicate add grid and first x position
      grids.push({
        miny: miny,
        maxy: maxy,
        columns:[x],  // x position
        rows:[]
      })
    }else{
      // found add next column x position
      found.columns.push(x)
    }
  }
  
  /**
   * Handles adding multiple Columns to a grid
   * @param {Array} grids  All detected grids
   * @param {Array} column Current Column
   * @param {Number} maxy   Current max y value
   * @param {Number} miny   Current min y value
   * @param {Number} x      x coordinate of the column
   */
  static _addColumn(grids,column,maxy,miny,x){
    // Go through all columns, if multiple grids on page its likely the grids start on different x positions, therefore check all columns
    for(var i = 0; i < column.length-1; i++){
      // check if consecutive line
      if(column[i+1].y1 <= maxy || tol(column[i+1].y1,maxy,tolerance)){
        //update if starts smaller than miny
        if(column[i+1].y1 < miny){
          miny = column[i+1].y1;
        }
        //update maxy if larger
        if(column[i+1].y2 > maxy){
          maxy = column[i+1].y2; 
        }
      }else{
        TableExtractor._addSingleColumn(grids,miny,maxy, x);
        // Setup min and max for next grid
        miny = column[i+1].y1;
        maxy = column[i+1].y2;
      }
    }
    return {
      miny: miny,
      maxy: maxy
    }
  }
  /**
   * Extracts all rows for all grids
   * @param  {Array} grids List of Grids
   * @param  {Array} rows  Detected Rows
   * @param  {Array} HRs   Horizontal Rules list
   */
  static _extractAllRows(grids,rows,HRs){    
    // get keys of the rows corresponding to y position
    var keys = Object.keys(rows).sort((a,b)=>(Number(a)-Number(b)));
    
    // Add rows to grid and find Horizontal Rules(HRs)
    for( var i = 0; i < keys.length; i++){
      var y = Number(keys[i]);
      var grid = grids.find(g=>g.miny <= y && g.maxy  >= y); 
      if(grid){
        TableExtractor._addRow(grid,y,rows[keys[i]]);
      }else{
        // its an HR
        HRs.push(rows[keys[i]]);
      }
    }
  }
  
  /**
   * Add a row to a grid and prevent duplicate rows
   * @param {Object} grid       Current Grid
   * @param {Number} y          Y value of the Row
   * @param {Array} rowLines Array of all lines in the row
   */
  static _addRow(grid,y,rowLines){
    // Add it to grid
    if(!grid.rows.find(r=>tol(r,y,tolerance))){
      grid.rows.push(y);
    }
    TableExtractor._checkForNoTableBorder(grid,rowLines);
    
  }
  
  /**
   * Add Border to table if the table doesnt have a border
   * @param  {Object} grid Current Grid
   * @param  {Array} rowLines  Array of all lines in the rowLines
   * @return {Object}      Grid with borders
   */
  static _checkForNoTableBorder(grid,rowLines){
    // find table-x edges if they dont exist
    var maxX = rowLines[0].x1 > rowLines[0].x2 ? rowLines[0].x1 : rowLines[0].x2;
    var minX = rowLines[0].x1 < rowLines[0].x2 ? rowLines[0].x1 : rowLines[0].x2;
    // search for smallest and largest x
    for(var i = 1; i < rowLines.length; i++){
      if(maxX < rowLines[i].x1){
        maxX = rowLines[i].x1
      }
      if(maxX < rowLines[i].x2){
        maxX = rowLines[i].x2
      }
      if(minX > rowLines[i].x1){
        minX = rowLines[i].x1
      }
      if(minX > rowLines[i].x2){
        minX = rowLines[i].x2
      }
    }
    // check if it already exists
    var foundMin = grid.columns.find(c=> c <= minX);
    var foundMax = grid.columns.find(c=>c >= maxX);
    
    if(!foundMin){
      // add a new table minimum boundary
      grid.columns.push(minX)          
      grid.columns.sort((a,b)=>a-b);         
    }
    if(!foundMax){
      // add a new table maximum boundary
      grid.columns.push(maxX)
      grid.columns.sort((a,b)=>a-b);
    }
    return grid;
  }
  /**
   * Extract All Content and put in corresponding grids
   * @param  {Array} grids List of all grids
   * @param  {Array} lines Lines of content
   */
  static _extractAllContent(grids,lines){
    //Get TEXT from tables    
    for(var i = 0; i < grids.length; i++){
      // Current grid
      var grid =  TableExtractor._pruneGrid(grids[i]);
      // Prune values:
      lines = TableExtractor._extractContent(grid,lines);
    }
    return lines;
  }
  
  /**
   * Extract all content and put it into the grid
   * @param  {Object} grid  Current Grid
   * @param  {Array} lines Content Lines
   * @return {Object}       Content filled Grid
   */
  static _extractContent(grid,lines){
    // if grid is continuation from another page or continues on another page need to imply row ending on borders
    // Check if borders are in rows otherwise add them
    if(!grid.rows.find(r=>tol(r,grid.miny,tolerance))){
      grid.rows.unshift(grid.miny);
    }
    if(!grid.rows.find(r=>tol(r,grid.maxy,tolerance))){
      grid.rows.push(grid.maxy);
    }
    // Get all text contained in the grid
    var textContent = lines.filter(l => l[0].y >= grid.miny && l[0].y <= grid.maxy)

    // remove them from the current lines
    lines = lines.filter(l=>l[0].y < grid.miny || l[0].y > grid.maxy);
    
    // create contents of the grid
    grid.contents = [];
    // fro each 
    for(var i = 0; i < grid.rows.length-1; i++){
      // determine text within a table row
      var row = textContent.filter(r=> r[0].y >= grid.rows[i] && r[0].y <= grid.rows[i+1]);
      // push an empty row
      grid.contents.push([]);
      // go through each row and separate by column
      TableExtractor._extractRowContents(grid,row,grid.contents[i])
    }
    return lines;
  }
  /**
   * Extract each rows content and put it in grid
   * @param  {Object} grid    Current Grid
   * @param  {Array} row     Current Row
   * @param  {Array} content grid content
   * @return {Object}         The Grid
   */
  static _extractRowContents(grid,row,content){
    for(var i = 0; i < row.length; i++){
      // go through columns
      for(var j = 1; j < grid.columns.length; j++){
        // create cell if it doesnt exist
        if(content.length < j){
          content.push("");
        }
        // add text to cell
        content[j-1] += row[i].filter(c=> c.x >= grid.columns[j-1] && c.x <= grid.columns[j]).map(c=>c.value).join("")+" ";
      }
    }
    return grid;
  }
  
  /**
   * Prunes the grid of columns and rows that are within a certain tolerance
   * @param  {Object} grid The grid to prune
   * @return {Object} The pruned grid
   */
  static _pruneGrid(grid){    
    var rows = [];
    // go through each row and check for rows within a certain tolerance
    for(var j = 0; j < grid.rows.length - 1; j++){
      rows.push(grid.rows[j]);
      // Skip row if within tolerance
      while(j < (grid.rows.length - 1) && tol(grid.rows[j],grid.rows[j+1],tolerance)){
        j++;
      }
    }
    // check whether last row should be included
    if(!tol(rows[rows.length - 1],grid.rows[grid.rows.length - 1],tolerance)){
      rows.push(grid.rows[grid.rows.length - 1]);
    }
    grid.rows = rows;
    var columns = [];
    // go through each column and check for columns within a certain tolerance
    for(var j = 0; j < grid.columns.length - 1; j++){
      columns.push(grid.columns[j]);
      // skip column if within tolerance
      while(j < (grid.columns.length - 1) && tol(grid.columns[j],grid.columns[j+1],tolerance)){
        j++;
      }
    }
    // check whether last column should be included
    if(!tol(columns[columns.length -1],grid.columns[grid.columns.length-1],tolerance)){
      columns.push(grid.columns[grid.columns.length-1]);
    }
    grid.columns = columns;
    
    return grid;
  }
}

/**
 * Check whether two values are within a certain tolerance to be considered equal
 * @param  {Number} a Value 1
 * @param  {Number} b Value 2
 * @param  {Number} t Tolerance
 * @return {boolean}   Whether they are within tolerance
 */
var tol = (a,b,t)=>{
  return (a-b) <= t && (a-b) >= -t
}

module.exports = TableExtractor;