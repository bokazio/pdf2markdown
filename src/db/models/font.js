var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var TEXT = sq.TEXT;
var DATE = sq.DATE;

/**
 * Font Model
 * @memberof DM.DB
 * @name FontModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {TEXT} style 
 * @prop {TEXT} variant
 * @prop {TEXT} weight
 * @prop {TEXT} stretch
 * @prop {TEXT} size
 * @prop {TEXT} family
 * @prop {TEXT} lineHeight
 */
module.exports = {
  style: TEXT,
  variant: TEXT,
  weight: TEXT,
  stretch: TEXT,
  size: TEXT,
  family: TEXT,
  lineHeight: TEXT,
};