var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var TEXT = sq.TEXT;
var DATE = sq.DATE;

/**
 * LineStyle Model
 * @memberof DM.DB
 * @name LineStyleModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {INTEGER} r - Red 
 * @prop {INTEGER} g - Green
 * @prop {INTEGER} b - Blue
 * @prop {INTEGER} alpha
 * @prop {TEXT} lineWidth
 */
module.exports = {
  r: INTEGER,
  g: INTEGER,
  b: INTEGER,
  alpha: INTEGER,
  lineWidth: TEXT,
};