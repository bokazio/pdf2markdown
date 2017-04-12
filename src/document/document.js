/**
 * @namespace PD
 */
var fs = require('fs');
var Page = require('./page/page.js');
var Logger = require('../logger/logger.js');
var JSCanvas = require('../document_adapter/canvas_adapter/js_canvas/js_canvas.js');
var Markdown = require('../markdown/markdown.js');

// setup PDFJS config and needed libraries
global.Image =  require('canvas').Image;
global.DOMParser = require('xmldom').DOMParser;
require('../util.js')();
require('pdfjs-dist');
PDFJS.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.js';
PDFJS.disableWorker = true;
PDFJS.renderInteractiveForms = false;



/** 
 * - Class representing the whole document. 
 * - Includes pages
 * - If pdf has a table of contents, document will have one as well
 * @memberof PD
 */
class Document{  
    
  /**
   * Use PDFJS to load a pdf from file.
   * @param  {String} file FilePath of file for conversion 
   * @param  {Number} pages How many pages to process
   * @param  {Number} start page to process
   * @return {async} Async finishes when document info is generated
   */
  async loadDocument(file,pages,start=1){
    Logger.log("Loading PDF from: "+file);
    var data = new Uint8Array(fs.readFileSync(file));
    this._pdf = await PDFJS.getDocument(data);
    Logger.debug("File Loaded");
    await this._loadMetaData();
    await this._renderPages(pages,start);
  }
  
  /**
   * Use PDFJS to load directly from a byte array
   * @param  {Uint8Array} data  byte array
   * @param  {Number} pages How many pages to process
   * @param  {Number} start page to process
   * @return {[type]}       [description]
   */
  async loadDocumentFromData(data,pages,start=1){
    Logger.info("Loading file into PDFJS");
    this._pdf = await PDFJS.getDocument(data);
    Logger.info("File Loaded");
    Logger.info("Loading metadata");
    await this._loadMetaData();
    Logger.info("Starting Render Process");
    await this._renderPages(pages,start);
    Logger.info("Render Process Complete");
  }
  
  /**
   * Loads the document's metadata
   * TODO: add check if document already exists
   * @return {async} Async finishes when metadata is loaded
   */
  async _loadMetaData(){
    var metadata = await this._pdf.getMetadata();
    var cd = metadata.info.CreationDate;
    var ud = metadata.info.ModDate;
    //Date is in this format: (D:YYYYMMDDHHmmSSOHH'mm')
    var c = this._getUtc(new Date(cd.substring(2,6),cd.substring(6,8),cd.substring(8,10),cd.substring(10,12),cd.substring(12,14),cd.substring(14,16),0),cd.substring(16,17),cd.substring(17,19),cd.substring(20,22));
    var u = this._getUtc(new Date(ud.substring(2,6),ud.substring(6,8),ud.substring(8,10),ud.substring(10,12),ud.substring(12,14),ud.substring(14,16),0),ud.substring(16,17),ud.substring(17,19),ud.substring(20,22));

    this._doc = await DB.Document.create({
      numberPages: Number(this._pdf.numPages),
      pdfVersion: metadata.info.PDFFormatVersion,
      title: metadata.info.Title,
      author: metadata.info.Author,
      subject: metadata.info.Subject,
      producer: metadata.info.Producer,
      pdfCreationDate: c,
      pdfLastUpdateDate: u
    })
  }
  
  
  /**
   * Renders all pages that were loaded. This is separated from
   * converting to markdown to allow for faster corrections to
   * markdown conversion as the rendering process could take awhile
   * @param  {Number} num    Number of pages to render, defaults to document total
   * @param  {Number} start  starting page
   * @param  {Number} chunks how many pages before a bulk insert of characters;
   * @return {async} Async complete when all pages are rendered
   */
  async _renderPages(num=this._doc.numberPages, start=1, chunks=1){
    for(var i = start; i <= num; i++){ 
      this._printCurrentPage(i);
      var p = await this._pdf.getPage(i);
      var r = await Page.render(p,i, this._doc.id);
      p.cleanup();
      //DB request every so many chunk lengths, 
      // may be able to `await` after looping so that it doesnt block
      // by keeping reference in another list and after awaiting for all of then
      if(i % chunks == 0){
        await JSCanvas.done();    
      }
    }    
    await JSCanvas.finish();
  }
  
  /**
   * Get the UTC time from date, TODO: Buggy
   * @param  {Date} date   
   * @param  {String} sign   
   * @param  {String} hour   
   * @param  {String} minute 
   * @return {Date}        
   */
  _getUtc(date,sign,hour,minute){    
    if(sign == "Z"){
      return date;
    }
    date.setHours(date.getHours() + Number(sign+hour));
    date.setMinutes(date.getMinutes() + Number(sign+minute));
    return date;
  }  
  /**
   * Print Current page that is being processed
   * @param  {Number} i Page Number
   */
  _printCurrentPage(i){
    Logger.notification(" Rendering page "+i + " / "+this._doc.numberPages);      
  }
  /**
   * Initialize markdown conversion
   * TODO: refactor this.
   * @param  {Object} config analysis and output configuration
   * @param  {Object} stream **Not implemented**
   * @return {String}        Markdown text
   */
  async toMarkdown(config,stream){
    //default 8.5" by 11"
    if(!this._doc){
      this._doc = await DB.Document.findOne();
    }
    var md = new Markdown(config);
   return await md.convert(this,stream)
  }
  
}


module.exports = Document;
