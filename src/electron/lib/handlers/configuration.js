'use strict';

function getConf(myIsDev) {
	let _conf = myIsDev ? require('./../../vendor/conf/configuration-dev.json') : require('./../../vendor/conf/configuration.json');
	return _conf;
}

let configuration = {
	getConf: getConf
};

module.exports = configuration;