var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var STRING = sq.STRING;
var DATE = sq.DATE;

/**
 * Line Model
 * @memberof DM.DB
 * @name LineModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {INTEGER} x1 - X1-Position on Page 
 * @prop {INTEGER} y1 - Y1-Position on Page
 * @prop {INTEGER} x2 - X2-Position on Page 
 * @prop {INTEGER} y2 - Y2-Position on Page
 * @prop {INTEGER} r - Red 
 * @prop {INTEGER} g - Green
 * @prop {INTEGER} b - Blue
 * @prop {INTEGER} alpha
 * @prop {TEXT} lineWidth
 * @prop {INTEGER} PageId - Foreign Key To:  {@link DM.DB.Page Page}
 */
module.exports = {
  x1: INTEGER,
  y1: INTEGER,
  x2: INTEGER,
  y2: INTEGER,
  r: INTEGER,
  g: INTEGER,
  b: INTEGER,
  alpha: INTEGER,
  lineWidth: STRING,
};