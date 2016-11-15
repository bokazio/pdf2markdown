
var fs = require('fs');
var Page = require('./page/page.js');
var Logger = require('../logger/logger.js');
global.Image =  require('canvas').Image;
require('../util.js')();
require('pdfjs-dist');
PDFJS.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.js';
PDFJS.disableWorker = true;
PDFJS.renderInteractiveForms = false;


/** 
 * - Class representing the whole document. 
 * - Includes pages
 * - If pdf has a table of contents, document will have one as well
 */
class Document{
  
  /**
   * Initializes the document 
   */
  constructor(){
    /**
     * @property {Page[]} pages - list of Page objects
     */
    this.pages = [];
  }
  
  /**
   * Use PDFJS to load a pdf from file.
   * @param  {String} file FilePath of file for conversion 
   * @return {async} Async finishes when document info is generated
   */
  async loadDocument(file){
    this.file = file;
    Logger.log("Loading PDF :"+this.file);
    var data = new Uint8Array(fs.readFileSync(this.file));
    Logger.debug("File Loaded");
    this._pdf = await PDFJS.getDocument(data);
    await this._loadMetaData();
    await this._loadPages();
  }
  
  /**
   * @return {async} Async complete when pages are loaded
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
   * Renders all pages that were loaded. This is separated from
   * converting to markdown to allow for faster corrections to
   * markdown conversion as the rendering process could take awhile
   * @return {async} Async complete when all pages are rendered
   */
  async renderPages(){
    for(var i = 0; i < 1;i++){//this.pages.length; i++){
      await this.pages[i].render();
      this.pages[i].toFile("./resources/page_"+(i+1)+".json")
    }
  }
  
  convert2Markdown(){
    
  }
}


module.exports = Document;
