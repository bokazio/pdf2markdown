[![Build Status](https://travis-ci.org/timthez/pdf2markdown.svg?branch=master)](https://travis-ci.org/timthez/pdf2markdown)

# pdf2Markdown (Under Development)

## Description
Attempts to convert a well-formed pdf to markdown. Uses [PDFJS](https://github.com/mozilla/pdf.js/) for parsing of the pdf. It then has PDFJS render to its own canvas which it then classifies the operations and generates markdown.

### Development Environment and Setup
1. ```yarn``` 
2. ```webpack --watch``` - automatic transpilation 
4. ```npm start``` runs the current build
