var fs = require('fs');
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
   * @return {async} Async Function finishes when document info is generated
   */
  async loadDocument(){
    console.info("Loading PDF:",this.file);
    var data = new Uint8Array(fs.readFileSync(this.file));
    this.pdf = await PDFJS.getDocument(data);
    //await this._createPages();
  }
  async _createPages(){
    for(var i = 1; i <= this.pdf.numPages; i++){
      this.pages.push(await this.pdf.getPage(i));      
    }
  }
  generateRawPageData(){
    
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
