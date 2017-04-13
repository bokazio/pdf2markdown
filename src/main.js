/**
 * Main Entry Point to the pdf2markdown
 * @function Main
 * @param {Object} arguments
 * @param {string} arguments.file file path to pdf file
 * @param {boolean} arguments.debug print verbose debug information
 * @param {boolean} arguments.timestamp print timestamps with each log
 */



var Minimist = require('minimist');
var Logger = require('./logger/logger.js');
var DocumentAdapter = require('../src/document_adapter/document_adapter.js');
var Document = require('./document/document.js');
var colors = require('colors/safe');
var db = require("./db/db.js");
var fs = require('fs');
global.Promise = require("bluebird");
Promise.longStackTraces();

  Logger.verbose = true;
  Logger.timestamps = true;

class Main{
  static async run(file,config){
    
    // TODO: arguments
    var options = {
      string:['f','file','c','config'],
      alias:{
        file: 'f',
        config: 'c'
      }
    }
    var argv = Minimist(process.argv.slice(2),options);
    
    // get config
    if(argv.config != null){
      Main.config = JSON.parse(fs.readFileSync(argv.config));
    }
    
    Logger.heading("Creating Adapters");
    global.document = new DocumentAdapter(); 
    Logger.heading("Creating Adapters Complete");
    var reload = true;
    
    // load the DB
    Logger.heading("Loading Database");
    global.DB = new db();
    await DB.load(!argv.rerun);
    Logger.heading("Loading Database Complete");
    
    // Load the document
    var doc = new Document();
    if(!argv.rerun){
      // TODO: display progress better for start and max
      await doc.loadDocument(Main.config.input.name,Main.config.input.max,Main.config.input.start);
    }
    // output it to markdown
    return await doc.toMarkdown(Main.config);
  }
}
(async ()=>{
  // write to file, needs to handle images too etc
  // located here to allow later on allow for flexibility in piping to other things
  // Example code below piped it to a client using websockets
  var out = await Main.run();
  fs.writeFileSync(Main.config.output,out);
})();





// module.exports = Main;

// http://www.iicm.tugraz.at/thesis/bilal_dissertation.pdf
// 
// 
// 


// var restify = require('restify');
// var socketio = require('socket.io');
// var fs = require('fs');
// var server = restify.createServer();
// var io = socketio.listen(server.server);

// server.use(restify.CORS({
//     origins: ['http://localhost:3000'],   // defaults to ['*']
//     credentials: false,                 // defaults to false
// }));


// io.sockets.on('connection', function (socket) {
//     socket.on('process', function (data) {
//       console.log = (a)=>{ 
//         console.info(a);
//         socket.emit('progress',a);        
//       }
//       console.error = (a)=>{ 
//         console.info(a);
//         socket.emit('progress',colors.reset.bold.red(a));        
//       }
//       Logger.heading("Task Received");
//       // fs.writeFileSync('test.pdf',data);
//       Main.run(data.file,data.config).then(d=>{
//         socket.emit("complete",d);
//         Logger.heading("Task Complete");
//       });
//       // console.log(m);
//       // console.log(data);
//     });
// });

// server.listen(8080, function () {
//     console.info('socket.io server listening at %s', server.url);
// });