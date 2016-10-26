class Page{
  constructor(pdfjsPage){
    this._pdfjsPage = pdfjsPage;
  }
  async render(){
    this.viewport = this._pdfjsPage.getViewport(1);
    this.canvas = document.createElement('canvas')
    console.log(1);
    this.canvas.width = this.viewport.width;
    console.log(2);
    this.canvas.height = this.viewport.height;
    var renderContext = {
      canvasContext: this.canvas.getContext('2d'),
      viewport: this.viewport,
    };
    await this._pdfjsPage.render(renderContext);
  }
  convert2Markdown(){
    
  }
}

module.exports = Page;