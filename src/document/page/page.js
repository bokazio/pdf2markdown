var fs =  require('fs');
var JSCanvas = require('../../document_adapter/canvas_adapter/js_canvas/js_canvas.js');
/**
 * Single page in the PDF file
 * Contains a JSCanvas for the definitive rendered version of the page elements
 */
class Page{
  /**
   * Renders the page to a virtual 'JSCanvas'
   * @return {async} async - Completes when page is rendered
   */
  static async render(pdfjsPage,number,documentId){
    
    //Get the viewport 
    var viewport = pdfjsPage.getViewport(1);
    
    //create the canvas adapter using document.createElement
    var canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    var page = await DB.Page.create({
      width: canvas.width,
      height: canvas.height,
      number: number,
      refNum: pdfjsPage.pageInfo.ref.num,
      refGen: pdfjsPage.pageInfo.ref.gen,
      documentId: documentId,
    });
    
    // Setup JSCanvas to use page and document
    JSCanvas.setPage(page.id);
    JSCanvas.setDocument(documentId);
    
    var renderContext = {
      canvasContext: canvas.getContext('2d',JSCanvas),
      viewport: viewport,
    };
    
    // Get PDFJS going
    await pdfjsPage.render(renderContext);    
    
    // Load any annotiations on the page
    await Page._loadAnnotations(pdfjsPage, page.id);
  }
  /**
   * Get all annotations on a page
   * @param  {Number} pdfjsPage 
   * @param  {Number} pageId    current page id           
   */
  static async _loadAnnotations(pdfjsPage, pageId){
    // get all annotations PDFJS can get
    var annotations = await pdfjsPage.getAnnotations();
    var an = [];
    
    // get view to calculate position on page
    var view = pdfjsPage.view;  
       
    for(var a of annotations){  
      
      // get the bounding box of the annotation
      var rect = PDFJS.Util.normalizeRect([
        a.rect[0],
        view[3] - a.rect[1] + view[1],
        a.rect[2],
        view[3] - a.rect[3] + view[1]]
      );
      // add annotation to the queue
      an.push({
        x1: rect[0],
        y1: rect[1],
        x2: rect[2],
        y2: rect[3],
        type: a.subtype,
        // if it has a url use it otherwise get all destination information
        value: a.url ? a.url : JSON.stringify(a.dest),
        pageId: pageId   
      });
    }
    // Bulk insert the annottions
    await DB.Annotation.bulkCreate(an);
  } 
  
}

module.exports = Page;
