"use strict";

/**
 * Package with module electron-packager
 */
var packager = require('electron-packager');
const pkg = require('./package.json');
const argv = require('minimist')(process.argv.slice(2));
const devDeps = Object.keys(pkg.devDependencies);

const appName = argv.name || pkg.productName;
const shouldUseAsar = argv.asar || false;
const shouldBuildAll = argv.all || false;
const arch = argv.arch || 'all';
const platform = argv.platform || 'darwin';

const DEFAULT_OPTS = {
	dir: './src/app',
	name: appName,
	asar: shouldUseAsar,
	ignore: [].concat(devDeps.map(name => `/node_modules/${name}($|/)`))
};

const icon = './src/electron/assets/icon';

if (icon) {
	DEFAULT_OPTS.icon = icon;
}

pack(platform, arch, function done(err, appPath) {
	console.log('err on pack', err);
});

function pack(plat, arch, cb) {
	// there is no darwin ia32 electron
	if (plat === 'darwin' && arch === 'ia32') return;

	const iconObj = {
		icon: DEFAULT_OPTS.icon + (() => {
			let extension = '.png';
			if (plat === 'darwin') {
				extension = '.icns';
			} else if (plat === 'win32') {
				extension = '.ico';
			}
			return extension;
		})()
	};

	const opts = Object.assign({}, DEFAULT_OPTS, iconObj, {
		platform: plat,
		arch,
		prune: true,
		all: shouldBuildAll,
		'appVersion': pkg.version || DEFAULT_OPTS.version,
		out: `releases/${plat}-${arch}`
	});

	packager(opts, cb);
}