var sq = require('sequelize');
var INTEGER = sq.INTEGER;
var TEXT = sq.TEXT;
var DATE = sq.DATE;

/**
 * Document Model
 * @memberof DM.DB
 * @name DocumentModel
 * 
 * @prop {AUTO_INCREMENT} id - Primary Key
 * @prop {INTEGER} numberPages 
 * @prop {TEXT} pdfVersion
 * @prop {TEXT} title
 * @prop {TEXT} author
 * @prop {TEXT} subject
 * @prop {TEXT} producer
 * @prop {DATE} pdfCreationDate
 * @prop {DATE} pdfLastUpdateDate 
 */
module.exports = {
  numberPages: INTEGER,
  pdfVersion: TEXT,
  title: TEXT,
  author: TEXT,
  subject: TEXT,
  producer: TEXT,
  pdfCreationDate: DATE,
  pdfLastUpdateDate: DATE,
};