var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var TEXT = sq.TEXT;
var DATE = sq.DATE;

/**
 * Page Model
 * @memberof DM.DB
 * @name PageModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {INTEGER} width 
 * @prop {INTEGER} height
 * @prop {INTEGER} number
 * @prop {INTEGER} documentId - Foreign Key To:  {@link DM.DB.DocumentModel DocumentModel}
 */
module.exports = {
  width: INTEGER,
  height: INTEGER,
  number: INTEGER
};