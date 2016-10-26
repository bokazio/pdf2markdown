
var Document = require('../document.js');

describe('Document',()=>{
  test('constructor', () => {
    var doc = new Document('./resources/fannie.pdf');
    expect(doc.file).toBe('./resources/fannie.pdf');
    expect(doc.pages).toEqual([]);
  });  
  test('async loadDocument', async () => {
    var doc = new Document("./resources/fannie.pdf");
    await doc.loadDocument();
    expect(doc.pdf).toBeDefined();
  });  
})

