var colors = require('colors/safe');
class Logger{
  static log(txt){
    console.log(this._timestamp() + colors.reset.white(txt));
  }
  static debug(txt){
    if(Logger.verbose){
      console.log(this._timestamp() + colors.dim.yellow(txt));
    }
  }
  static heading(txt){
    console.log(this._timestamp() + colors.reset.underline.cyan(txt));
  }
  static warn(txt){
    console.log(this._timestamp() + colors.reset.bold.yellow(txt));
  }
  static info(txt){
    console.log(this._timestamp() + colors.reset.green(txt));
  }
  static error(txt){
    console.log(this._timestamp() + colors.reset.bold.red(txt));
  }
  static list(items){
    if(Logger.verbose){
      for(var i = 0; i < items.length; i++){
        console.log(this._timestamp() + colors.reset.bold.grey(items[i]));
      }
    }
  }
  static deprecated(txt){
    console.log(this._timestamp() + colors.reset.bold.grey(txt));
  }
  static notification(txt){
    console.log(this._timestamp() + colors.reset.bold.dim.yellow(txt));
  }
  static _timestamp(){
    if(!Logger.timestamps){
      return "";
    }
    var date = new Date()
    var dateString = date.toLocaleString();
    return colors.dim.cyan("["+dateString+", "+date.getMilliseconds().toString().padStart(3)+"] ");
  }
}
Logger.timestamps = false;
Logger.verbose = false;

module.exports = Logger;