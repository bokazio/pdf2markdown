var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var STRING = sq.STRING;
var DATE = sq.DATE;

/**
 * Image Model
 * @memberof DM.DB
 * @name ImageModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {INTEGER} x - X-Position on Page 
 * @prop {INTEGER} y - Y-Position on Page
 * @prop {INTEGER} width 
 * @prop {INTEGER} height
 * @prop {INTEGER} PageId - Foreign Key To:  {@link DM.DB.Page Page}
 * @prop {INTEGER} ImageDataId - Foreign Key To:  {@link DM.DB.ImageData ImageData}
 */
module.exports = {
  x: INTEGER,
  y: INTEGER,
  width: INTEGER,
  height: INTEGER
};