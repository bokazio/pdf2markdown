var fs =  require('fs');
var JSCanvas = require('../../document_adapter/canvas_adapter/js_canvas/js_canvas.js');
/**
 * Single page in the PDF file
 * Contains a VirtualCanvas for the definitive rendered version of the page elements
 * Contains MarkdownInformation
 */
class Page{
  /**
   * Renders the page to a virtual Canvas
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
    
    JSCanvas.setPage(page.id);
    
    var renderContext = {
      canvasContext: canvas.getContext('2d',JSCanvas),
      viewport: viewport,
    };
    
    await pdfjsPage.render(renderContext);    
    
    await Page._loadAnnotations(pdfjsPage, page.id);
  }
  
  static async _loadAnnotations(pdfjsPage, pageId){
    var annotations = await pdfjsPage.getAnnotations();
    var an = [];
    
    var view = pdfjsPage.view;
    
    
    
    for(var a of annotations){
      
      var rect = PDFJS.Util.normalizeRect([
                      a.rect[0],
                      view[3] - a.rect[1] + view[1],
                      a.rect[2],
                      view[3] - a.rect[3] + view[1]]);
      an.push({
        x1: rect[0],
        y1: rect[1],
        x2: rect[2],
        y2: rect[3],
        type: a.subtype,
        value: a.url ? a.url : JSON.stringify(a.dest),
        pageId: pageId   
      });
    }
    await DB.Annotation.bulkCreate(an);
  } 
  
}

module.exports = Page;
