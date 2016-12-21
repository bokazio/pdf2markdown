var fs =  require('fs');
var JSCanvas = require('../../document_adapter/canvas_adapter/js_canvas/js_canvas.js');
/**
 * Single page in the PDF file
 * Contains a VirtualCanvas for the definitive rendered version of the page elements
 * Contains MarkdownInformation
 */
class Page{
  /**
   * Creates A Page and holds onto the pdfjs page
   * @param  {PDFJS.Page} pdfjsPage - a PDFJS page
   */
  constructor(pdfjsPage,number,document_id){
    this._pdfjsPage = pdfjsPage;
    this.number = number;
    this.document_id = document_id;
    this.jsCanvas = new JSCanvas();
  }
  /**
   * Renders the page to a virtual Canvas
   * @return {async} async - Completes when page is rendered
   */
  async render(){
    this._setTimeStamp('renderStart');
    this.viewport = this._pdfjsPage.getViewport(1);
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.viewport.width;
    this.canvas.height = this.viewport.height;
    //TODO: hold on to virtual canvas here.
    this.renderContext = {
      canvasContext: this.canvas.getContext('2d',this.jsCanvas),
      viewport: this.viewport,
    };
    await this._pdfjsPage.render(this.renderContext);    
    this.annotations = await this._pdfjsPage.getAnnotations();
    if(this.annotations.length>0){
      console.info(this.annotations)
      throw("done");
    }
    this.save();
    this._setTimeStamp('renderEnd');
  }
  
  convert2Markdown(){
    
  }
  
  _setTimeStamp(attrib){
    this[attrib] = Date.now();
  }
  toFile(file){
    // fs.writeFileSync(file,JSON.stringify(Page.attributes(this.jsCanvas), null, 2));
  }
  save(){
    if(this.saved){
      this._page = DB.pages.update(this.getAttributes());
    }else{
      this._page = DB.pages.insert(this.getAttributes());
      this.id = this._page["$loki"];
      this.saved = true;
    }
  }
  persist(persistence){
    
  }
  getAttributes(){
    // console.log(this);
    this._page = {
      type: "Page",
      number: this.number,
      document_id: this.document_id,
      canvas: this.jsCanvas.canvas,
      width: this.viewport.width,
      height: this.viewport.height,
      annotations: this.annotations

    }
    return this._page;
  }
  static attributes(obj){
    
    if(Array.isArray(obj)){
      for(var i = 0; i < obj.length; i++){
        obj[i] = Page.attributes(i); 
      }
      return obj;
    }
    if(typeof obj === 'function' ){
      return undefined;
    }
    if( typeof obj !== 'object'){
      return obj;
    }
    var properties = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
        if(Array.isArray(obj[key])){
          properties[key] = [];
          for(var i=0;i<obj[key].length;i++){
            properties[key].push(Page.attributes(obj[key][i]));
          }
        }else{
          if(typeof obj[key] === 'object' && obj[key] != null ){
            properties[key] = Page.attributes(obj[key]);
          }else{
            properties[key] = obj[key];
          }
        }
      }
    }
    return properties;
  }
}

module.exports = Page;
