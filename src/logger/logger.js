var colors = require('colors/safe');
var fs = require('fs');

class Logger{
  /**
   * Log as white text
   * @param  {String} txt 
   */
  static log(txt){
    console.log(this._timestamp() + colors.reset.white(txt));
  }
  /**
   * If in verbose mode Log as dim yellow text
   * @param  {String} txt 
   */
  static debug(txt){
    if(Logger.verbose){
      console.log(this._timestamp() + colors.dim.yellow(txt));
    }
  }
  /**
   * Log a heading that is underlines and cyan
   * @param  {String} txt 
   */
  static heading(txt){
    console.log(this._timestamp() + colors.reset.underline.cyan(txt));
  }
  /**
   * Log a warning as bold and yellow
   * @param  {String} txt 
   */
  static warn(txt){
    console.log(this._timestamp() + colors.reset.bold.yellow(txt));
  }
  /**
   * Log info as green
   * @param  {String} txt 
   */
  static info(txt){
    console.log(this._timestamp() + colors.reset.green(txt));
  }
  /**
   * Log an error as bold red
   * @param  {String} txt 
   */
  static error(txt){
    console.log(this._timestamp() + colors.reset.bold.red(txt));
  }
  /**
   * Display a list of items if verbose as bold and grey
   * @param  {String} txt 
   */
  static list(items){
    if(Logger.verbose){
      for(var i = 0; i < items.length; i++){
        console.log(this._timestamp() + colors.reset.bold.grey(items[i]));
      }
    }
  }
  /**
   * Log deprecated as bold grey
   * @param  {String} txt 
   */
  static deprecated(txt){
    console.log(this._timestamp() + colors.reset.bold.grey(txt));
  }
  /**
   * Log a notification as bold dim yellow
   * @param  {String} txt 
   */
  static notification(txt){
    console.log(this._timestamp() + colors.reset.bold.dim.yellow(txt));
  }
  /**
   * Generate a timestamp if they are enabled  and display them as dim cyan
   */
  static _timestamp(){
    if(!Logger.timestamps){
      return "";
    }
    var date = new Date()
    var dateString = date.toLocaleString();
    return colors.dim.cyan("["+dateString+", "+date.getMilliseconds().toString().padStart(3)+"] ");
  }
  /**
   * Append to a log file under test.log.txt
   * TODO: allow configuration of this if needed
   * @param  {String} txt 
   */
  static file(txt){
    fs.appendFileSync("test/log.txt",txt); 
  }
}
Logger.timestamps = false;
Logger.verbose = false;

module.exports = Logger;