var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var STRING = sq.STRING;
var DATE = sq.DATE;

/**
 * Rectangle Model
 * @memberof DM.DB
 * @name RectangleModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {INTEGER} x - X-Position on Page 
 * @prop {INTEGER} y - Y-Position on Page
 * @prop {INTEGER} width 
 * @prop {INTEGER} height
 * @prop {INTEGER} r - Red 
 * @prop {INTEGER} g - Green
 * @prop {INTEGER} b - Blue
 * @prop {INTEGER} alpha
 * @prop {TEXT} lineWidth
 * @prop {INTEGER} PageId - Foreign Key To:  {@link DM.DB.Page Page}
 * @prop {INTEGER} LineStyleId - Foreign Key To:  {@link DM.DB.LineStyle LineStyle}
 */
module.exports = {
  x: INTEGER,
  y: INTEGER,
  width: INTEGER,
  height: INTEGER,
  r: INTEGER,
  g: INTEGER,
  b: INTEGER,
  alpha: INTEGER,
  lineWidth: STRING,
};