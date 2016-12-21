var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var TEXT = sq.TEXT;
var DATE = sq.DATE;

/**
 * Annotation Model
 * @memberof DM.DB
 * @name AnnotationModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {INTEGER} x1 - X1-Position on Page - starting point of trigger box
 * @prop {INTEGER} y1 - Y1-Position on Page - starting point of trigger box
 * @prop {INTEGER} x2 - X2-Position on Page - ending point of trigger box
 * @prop {INTEGER} y2 - Y2-Position on Page - ending point of trigger box
 * @prop {TEXT} type - Type of annotation eg link
 * @prop {TEXT} value - Value corresponding to annotation type
 * @prop {INTEGER} PageId - Foreign Key To:  {@link DM.DB.Page Page}
 */
module.exports = {
  x1: INTEGER,
  y1: INTEGER,
  x2: INTEGER,
  y2: INTEGER,
  type: TEXT,
  value: TEXT
};