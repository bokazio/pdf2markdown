var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var TEXT = sq.TEXT;
var STRING = sq.STRING;
var DATE = sq.DATE;

/**
 * ImageData Model
 * @memberof DM.DB
 * @name ImageDataModel
 * 
 * @prop {STRING} hash - Image Hash and Primary Key
 * @prop {TEXT} value - String version of image converted from base64
 */
module.exports = {
  hash: { type: STRING, primaryKey: true},
  value: TEXT,
};