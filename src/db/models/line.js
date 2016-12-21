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
 * @prop {INTEGER} PageId - Foreign Key To:  {@link DM.DB.Page Page}
 * @prop {INTEGER} LineStyleId - Foreign Key To:  {@link DM.DB.LineStyle LineStyle}
 */
module.exports = {
  x1: INTEGER,
  y1: INTEGER,
  x2: INTEGER,
  y2: INTEGER
};