
var Logger = require('../../logger/logger.js');
Logger.timestamps = true;
Logger.verbose = true;
var Document = require('../document.js');

describe('Document',()=>{
  describe('constructor(file)',()=>{
    test('intialize file and page', () => {
      var doc = new Document();
      expect(doc.pages).toEqual([]);
    });  
  });
  
  // describe('async loadDocument()',()=>{
  //   test('async _loadsMetadata()', async () => {
  //     var doc = new Document();
  //     await doc.loadDocument("./resources/fannie.pdf");
  //     expect(doc.metadata).toBeNull();
  //     expect(doc.info).not.toBeNull();
  //   }); 
  //   test('async loadPages()', async () => {      
  //     var doc = new Document();
  //     await doc.loadDocument("./resources/fannie.pdf");
  //     expect(doc.pages).not.toBeNull();
  //     expect(doc.pages.length).toBe(doc.numPages);
  //   });        
  // })
  
  // describe('async renderPages()',()=>{
  //   test('calls render on all pages', async () => {
  //     // Page Render Mock
  //     var Page = require('../page/page.js');
  //     Page.prototype.render = jest.genMockFn();
  //     Page.prototype.render.mockImplementation(async function () {
  //         this._setTimeStamp('renderStart');
  //         this._setTimeStamp('renderEnd');
  //     });
      
  //     //Test
  //     var doc = new Document();
  //     await doc.loadDocument("./resources/fannie.pdf");
  //     await doc.renderPages();
  //     doc.pages.forEach(page=>{
  //       expect(page.renderStart).toBeDefined();
  //       expect(page.renderEnd).toBeDefined();
  //     });
  //   });            
  // })
})

