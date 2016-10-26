var DocumentAdapter = require('../src/document_adapter/document_adapter.js');
global.document = new DocumentAdapter();
global.Image =  require('canvas').Image;