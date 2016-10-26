
var Document = require('../document.js');

describe('Document',()=>{
  describe('constructor(file)',()=>{
    test('intialize file and page', () => {
      var doc = new Document('./resources/fannie.pdf');
      expect(doc.file).toBe('./resources/fannie.pdf');
      expect(doc.pages).toEqual([]);
    });  
  });
  describe('async loadDocument',()=>{
    test('loads metadata', async () => {
      var doc = new Document("./resources/fannie.pdf");
      await doc.loadDocument();
      expect(doc.metadata).toBeNull();
      expect(doc.info).not.toBeNull();
    }); 
    test('loads pages', async () => {
      
      var doc = new Document("./resources/fannie.pdf");
      await doc.loadDocument();
      console.log(document.createElement('canvas'));
      expect(doc.pages).not.toBeNull();
      expect(doc.pages.length).toBe(doc.numPages);
    });        
  })
})

