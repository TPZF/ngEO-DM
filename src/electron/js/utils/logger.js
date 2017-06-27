/**
 *  Logger instance based on electron-log
 *
 * 	by default it puts:
 *	on Linux: ~/.config/<app name>/log.log
 *	on OS X: ~/Library/Logs/<app name>/log.log
 *	on Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log
*/


const Logger = require('electron-log');
const configuration = require('../handlers/configuration');

Logger.transports.file.level = configuration.getConf().log.level;
Logger.transports.file.format = configuration.getConf().log.format;
Logger.transports.file.maxSize = configuration.getConf().log.maxSize;


module.exports = Logger;