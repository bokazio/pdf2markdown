
var fs = require('fs');
var Page = require('./page/page.js');
global.Image =  require('canvas').Image;
require('../util.js')();
require('pdfjs-dist');
PDFJS.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.js';
PDFJS.disableWorker = true;
PDFJS.renderInteractiveForms = false;


/** 
 * - Class representing the whole document. 
 * - Includes pages of converted markdown
 * - If pdf has a table of contents, document will have one as well
 */
class Document{
  /**
   * @param  {String} file FilePath of file for conversion 
   */
  constructor(file){
    this.file = file;
    this.pages = [];
  }
  /**
   * Use PDFJS to load a pdf.
   * @return {async} Async finishes when document info is generated
   */
  async loadDocument(){
    console.info("Loading PDF:",this.file);
    var data = new Uint8Array(fs.readFileSync(this.file));
    this._pdf = await PDFJS.getDocument(data);
    await this._loadMetaData();
    await this._loadPages();
  }
  /**
   * @return {async} Async Finished when pages are loaded
   */
  async _loadPages(){
    for(var i = 1; i <= this._pdf.numPages; i++){
      this.pages.push(new Page(await this._pdf.getPage(i)));      
    }
  }
  /**
   * Loads the document's metadata
   * @return {async} Async finishes when metadata is loaded
   */
  async _loadMetaData(){
    var metadata = await this._pdf.getMetadata();
    this.info = metadata.info;
    this.numPages = this._pdf.numPages;
    this.metadata = metadata.metadata;
  }
  /**
   * @return {void}
   */
  async renderPages(){
    for(var i = 0; i < this.pages.length; i++){
      await this.pages[i].render();
    }
  }
  convert2Markdown(){
    
  }
  static _getNextPage(){
    
  }
  static _processArray(max,fn){
    var index = 1;
    return new Promise(function(resolve, reject) {

        function next() {
            if (index < max) {
                fn(index++).then(next, reject);
            } else {
                resolve();
            }
        }
        next();
    })
  }
}


module.exports = Document;
