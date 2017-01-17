
class Extractor{
  static async run(pageId, analysis, config){
    Extractor.analysis = analysis;
    Extractor.config = config;
    var page = await DB.Page.findById(pageId);
    var lines = await Extractor.generateLines(page);
    Extractor.segments = await Extractor.generateSegments(page);
    // console.log(Extractor.segments.map(e=>e.get({plain: true})))
    var detection = Extractor.detectHRandTables(lines);
    var extractedPage = {
      headers: Extractor.getHeaders(page,lines),
      footers: Extractor.getFooters(page,lines),
      tables: detection.tables,
      HRs: detection.HRs
    };
    
    
    
    // if(footers){
    //   extractedPage.push(footers);      
    // }
    // console.log(extractedPage);
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
      headers: []
    }
    for(var l of headersChars){
      headers.headers.push(Extractor._detectMultipleAlignment(l));
    }
    return headers;
  }
  
  static async generateSegments(page){
    return await page.getLines();
  }
  
  static detectHRandTables(lines){
    var verticals = Extractor.segments.filter(s=>((s.x2 - s.x1) <= 5 && (s.x2 - s.x1) >= -5));
    var horizontals = Extractor.segments.filter(s=>((s.y2 - s.y1) <= 5 && (s.y2 - s.y1) >= -5));
    // console.log(verticals.map(v=>v.get({plain: true})));
    // console.log(Extractor.segments.map(v=>v.get({plain: true})));
    var tol = (a,b,t)=>{
      return (a-b) <= t && (a-b) >= -t
    }
    
    
    var columns = {};
    var tolerance = 2;
    
    // Normalize the x and y values, looking at tolerances since lines may not be completly vertical or horizontal
    // Also create columns from data
    // go through all vertical lines since they should be columns
    for(var i = 0; i < verticals.length; i++){
      //  if x1 and x2 are within tolerance we set them to be them both to be the minimum value
      //  This ensures we always assign to smaller value to keep values uniform along comparison
      if(tol(verticals[i].x1, verticals[i].x2, tolerance)){
        if(verticals[i].x1 < verticals[i].x2){
          verticals[i].x2 = verticals[i].x1;
        }else{
          verticals[i].x1 = verticals[i].x2;
        }
      }
      //  if y1 and y2 are within tolerance we set them to be them both to be the minimum value
      //  This ensures we always assign to smaller value to keep values uniform along comparison
      if(tol(verticals[i].y1 , verticals[i].y2, tolerance)){
        if(verticals[i].y1 < verticals[i].y2){
          verticals[i].y2 = verticals[i].y1;
        }else{
          verticals[i].y1 = verticals[i].y2;
        }
      }
      // Swap coordinates if y1 is larger than y2, this ensures y2 is always larger, makes detecting grid easier later
      if(verticals[i].y1 > verticals[i].y2 ){
        // temporary values
        var tx = verticals[i].x1;
        var ty = verticals[i].y1;
        // perform swap
        verticals[i].x1 = verticals[i].x2;
        verticals[i].y1 = verticals[i].y2;
        verticals[i].x2 = tx;
        verticals[i].y2 = ty;
      }
      // check if theres a column already and add one if there isnt
      if(!columns[verticals[i].x1]){
        columns[verticals[i].x1] = []
      }
      // add line to the column
      columns[verticals[i].x1].push(verticals[i]);
    }
    
    // Create the potential rows
    var rows = {};
    for(var i = 0; i < horizontals.length; i++){
      //  if x1 and x2 are within tolerance we set them to be them both to be the minimum value
      //  This ensures we always assign to smaller value to keep values uniform along comparison
      if(tol(horizontals[i].x1, horizontals[i].x2, tolerance)){
        if(horizontals[i].x1 < horizontals[i].x2){
          horizontals[i].x2 = horizontals[i].x1;
        }else{
          horizontals[i].x1 = horizontals[i].x2;
        }
      }
      //  if y1 and y2 are within tolerance we set them to be them both to be the minimum value
      //  This ensures we always assign to smaller value to keep values uniform along comparison
      if(tol(horizontals[i].y1 , horizontals[i].y2, tolerance)){
        if(horizontals[i].y1 < horizontals[i].y2){
          horizontals[i].y2 = horizontals[i].y1;
        }else{
          horizontals[i].y1 = horizontals[i].y2;
        }
      }
      // make sure x2 is always largest
      if(horizontals[i].x1 < horizontals[i].x2 ){
        var tx = horizontals[i].x1;
        var ty = horizontals[i].y1;
        horizontals[i].x1 = horizontals[i].x2;
        horizontals[i].y1 = horizontals[i].y2;
        horizontals[i].x2 = tx;
        horizontals[i].y2 = ty;
      }
      // add row if doesnt exist
      if(!rows[horizontals[i].y1]){
        rows[horizontals[i].y1] = []
      }
      // add line to row
      rows[horizontals[i].y1].push(horizontals[i]);
    }
    
    //Find unique grids
    var grids = [];
    
    // get keys of the columns corresponding to x position
    var keys = Object.keys(columns).sort((a,b)=>(Number(a)-Number(b)));

    
    for(var i = 0 ; i < keys.length; i++){
      // work with a column at a time
      var column = columns[keys[i]];
      // sort it by y position ascending
      column.sort((a,b)=>a.y1 - b.y1);
      
      // min and max y position of a grid, also used to see if separation from grid to signal new grid
      var maxy = column[0].y2;
      var miny = column[0].y1;
      // Go through all columns, if multiple grids on page its likely the grids start on different x positions, therefore check all columns
      for(var j = 0; j < column.length-1; j++){
        // check if consecutive line
        if(column[j+1].y1 <= maxy){
          //update if starts smaller than miny
          if(column[j+1].y1 < miny){
            miny = column[j+1].y1;
          }
          //update maxy if larger
          if(column[j+1].y2 > maxy){
            maxy = column[j+1].y2; 
          }
        }else{
          //Need to check here for dup
          var found = grids.find(g=>tol(g.miny,miny,2) && tol(g.maxy,maxy,2))
          if(found == null){
            // No duplicate add grid and first x position
            grids.push({
              miny: miny,
              maxy: maxy,
              columns:[Number(keys[i])],  // x position
              rows:[]
            })
          }else{
            // found add next column x position
            found.columns.push(Number(keys[i]))
          }
          // Setup min and max for next grid
          miny = column[j+1].y1;
          maxy = column[j+1].y2;
        }
      }
      // no change in grid on single column, means its a single column in a grid, find grid or create one
      var found = grids.find(g=>tol(g.miny,miny,2) && tol(g.maxy,maxy,2))
      if(found == null){
        // create new grid amd add first column to x
        grids.push({
          miny: miny,
          maxy: maxy,
          columns:[Number(keys[i])], // x position
          rows:[]
        })
      }else{
        // add more columns by getting their x position
        found.columns.push(Number(keys[i]))
      }
      
    }
    // console.log("GRIDS");
    // console.log(grids);
    
    // get keys of the rows corresponding to x position
    var keys = Object.keys(rows).sort((a,b)=>(Number(a)-Number(b)));
    
    var HRs = [];
    
    // Add rows to grid and find Horizontal Rules(HRs)
    for( var i = 0; i < keys.length; i++){
      var y = Number(keys[i]);
      var grid = grids.find(g=>miny <= y && maxy  >= y); 
      if(grid){
        // check if its a border
        if(!tol(grid.miny,y,tolerance) && !tol(grid.maxy,y,tolerance)){
          // add to grid
          grid.rows.push(y);
        }
      }else{
        // its an HR
        HRs.push(y);
      }
    }
    console.log("GRIDS");
    // console.log(grids);
    // console.log("HRS");
    // console.log(HRs);
    
    //Get TEXT from tables
    
    for(var i = 0; i < grids.length; i++){
      var grid =  grids[i];
      var rows = lines.filter(l=>l[0].y >= grid.miny && l[0].y <= grid.maxy)
      lines = lines.filter(l=>l[0].y < grid.miny && l[0].y > grid.maxy);
      grid.cells = [];
      for(var j = 0; j < rows.length; j++){
        grid.cells.push([]);
        // CHECK IMAGES HERE TOO!  TODO
        for(var k = 1; k < grid.columns.length; k++){
          grid.cells[j].push(rows[j].filter(c=> c.x >= grid.columns[k-1] && c.x <= grid.columns[k]).map(c=>c.value).join(""));
        }
      }
      // console.log(text.map(l=>l.map(c=>c.value).join("")).join("\n"));
    }
    console.log("GRIDS");
    console.log(grids[0].cells);
    
    return{
      tables: grids,
      HRs: HRs
    }
  }
  
  
  static getFooters(page, lines){
    var diag = Math.sqrt(Math.pow(page.width,2) + Math.pow(page.height,2));

    var footerChars = lines.filter(l=>l[0].y >= (page.height - Extractor.config.margin.bottom * diag))
    lines = lines.filter(l=>l[0].y < (page.height - Extractor.config.margin.bottom * diag));

    var headers = {
      type: "FOOTER",
      headers: []
    }
    for(var l of footerChars){
      headers.headers.push(Extractor._detectMultipleAlignment(l));
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
      if(Math.trunc(content[i].y) == Math.trunc(content[i-1].y) && content[i].font == content[i-1].font && Extractor.analysis.spaces[content[i].font] < (content[i].x - content[i-1].x) ){
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