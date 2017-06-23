'use strict';

function getConf(myIsDev) {
	let _conf = myIsDev ? require('./../../webapp/conf/configuration-dev.json') : require('./../../webapp/conf/configuration.json');
	return _conf;
}

let configuration = {
	getConf: getConf
};

module.exports = configuration;