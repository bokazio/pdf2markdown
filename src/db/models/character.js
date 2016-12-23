var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var STRING = sq.STRING;
var TEXT = sq.TEXT;
var DATE = sq.DATE;

/**
 * Character Model
 * @memberof DM.DB
 * @name CharacterModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {STRING(1)} value - single Character  
 * @prop {INTEGER} x - X-Position on Page 
 * @prop {INTEGER} y - Y-Position on Page
 * @prop {TEXT} font - style|variant|weight|stretch|size|line-height|family
 * @prop {INTEGER} PageId - Foreign Key To:  {@link DM.DB.Page Page}
 * @prop {INTEGER} FontId - Foreign Key To:  {@link DM.DB.Font Font}
 */
module.exports = {
  value: STRING(1),
  x: INTEGER,
  y: INTEGER,
  font: TEXT
};