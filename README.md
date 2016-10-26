[![Build Status](https://travis-ci.org/timthez/pdf2markdown.svg?branch=master)](https://travis-ci.org/timthez/pdf2markdown)

# pdf2Markdown (Under Development)

## Description
Attempts to convert a well-formed pdf to markdown. Uses [PDFJS](https://github.com/mozilla/pdf.js/) for parsing of the pdf. It then has PDFJS render to its own canvas which it then classifies the operations and generates markdown.

## Contributing
- Documentation is in [JSDoc](http://usejsdoc.org/index.html). 
- Tests are done with [Jest](https://facebook.github.io/jest/). 
- Design diagrams are in docs/diagrams. The OmniGraffle file containts the most recent design diagrams. The images may be out of date.
- Resources are for use in tests and builds 

### Development Environment and Setup
1. ```yarn``` 
2. ```webpack --watch``` - automatic transpilation and jdoc geneneration
3. ```npm test -- --watch``` runs jest and watches for changes
4. ```npm start``` runs the current build
