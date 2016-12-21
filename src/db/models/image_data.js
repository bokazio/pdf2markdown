var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var TEXT = sq.TEXT;
var DATE = sq.DATE;

/**
 * ImageData Model
 * @memberof DM.DB
 * @name ImageDataModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {TEXT} hash - Image Hash 
 * @prop {TEXT} value - String version of image converted from base64
 */
module.exports = {
  hash: TEXT,
  value: TEXT,
};