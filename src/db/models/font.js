var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var STRING = sq.STRING;
var TEXT = sq.TEXT;
var DATE = sq.DATE;
var DOUBLE = sq.DOUBLE;

/**
 * Font Model
 * @memberof DM.DB
 * @name FontModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {DOUBLE} x - X-Position on Page 
 * @prop {INTEGER} y - Y-Position on Page
 * @prop {TEXT} font - style|variant|weight|stretch|size|line-height|family
 * @prop {INTEGER} PageId - Foreign Key To:  {@link DM.DB.Page Page}
 * @prop {INTEGER} FontId - Foreign Key To:  {@link DM.DB.Font Font}
 */

module.exports = {
  name: {type: TEXT, primaryKey: true},
  scaleFactorWidth: DOUBLE,
  height: INTEGER,
  style: STRING,
  weight: STRING,
  family: STRING
};