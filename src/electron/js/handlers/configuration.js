'use strict';

let isDevMode = process.env.TODO_DEV ? (process.env.TODO_DEV.trim() == "true") : false;

function getConf() {
	let _conf = isDevMode ? require('../../webapp/conf/configuration-dev.json') : require('../../webapp/conf/configuration.json');
	return _conf;
}

let configuration = {
	getConf: getConf,
	isDevMode: isDevMode
};

module.exports = configuration;