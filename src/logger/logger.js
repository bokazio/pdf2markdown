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
  static heading(level,txt){
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
  static list(item){
    console.log(this._timestamp() + colors.reset.bold.red(txt));
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
    var dateString = (new Date()).toLocaleString();
    return colors.dim.cyan("["+dateString+"] ");
  }
}
Logger.timestamps = false;
Logger.verbose = false;

module.exports = Logger;