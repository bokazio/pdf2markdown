/**
 * @namespace PD
 */
var fs = require('fs');
var Page = require('./page/page.js');
var Logger = require('../logger/logger.js');
var JSCanvas = require('../document_adapter/canvas_adapter/js_canvas/js_canvas.js');
global.Image =  require('canvas').Image;
global.DOMParser = require('xmldom').DOMParser;
var Markdown = require('../markdown/markdown.js');


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
   * Loads the document's metadata
   * @return {async} Async finishes when metadata is loaded
   */
  async _loadMetaData(){
    var metadata = await this._pdf.getMetadata();
    var cd = metadata.info.CreationDate;
    var ud = metadata.info.ModDate;
    //(D:YYYYMMDDHHmmSSOHH'mm')
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
   * @return {async} Async complete when all pages are rendered
   */
  async _renderPages(num=this._doc.numberPages, start=1, chunks=1){
    for(var i = start; i <= num; i++){ 
      this._printCurrentPage(i);
      var p = await this._pdf.getPage(i);
      var r = await Page.render(p,i, this._doc.id);
      p.cleanup();
      //DB request every so many chunk lengths
      if(i % chunks == 0){
        await JSCanvas.done();    
      }
    }    
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
    console.log(sign, Number(sign+hour), Number(sign+minute));
    console.log(Number(date.getHours()) + Number(sign+hour));
    if(sign == "Z"){
      return date;
    }
    date.setHours(date.getHours() + Number(sign+hour));
    date.setMinutes(date.getMinutes() + Number(sign+minute));
    return date;
  }  
  _printCurrentPage(i){
    Logger.notification("page "+i + " / "+this._doc.numberPages);      
  }
  
  async toMarkdown(config,stream){
    //default 8.5" by 11"
    
    var stream = fs.createWriteStream('test.md', {flags: 'a'});
    var md = new Markdown({
      margin:{top:1.5},
      dimensions:{},
    },stream);
   await md.convert(this,stream)
  }
  
}


module.exports = Document;
