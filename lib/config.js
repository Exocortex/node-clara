var fs = require('fs');
var path = require('path');
var R = require('ramda');
var CC = require('config-chain');
var log = require('npmlog');
log.addLevel('debug', 100, { fg: 'yellow', bg: 'black' }, 'DEBUG');
var osenv = require('osenv');

var uidOrPid = process.getuid ? process.getuid() : process.pid;

function readConfig(dir) {
  if (!dir) return null;
  var filename = path.join(dir, '.clara.json');
  if (!fs.existsSync(filename)) return null;
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (e) {
    log.error('Invalid Configuration File: '+filename);
    return null;
  }
};

var home = osenv.home();
var homeConfigFile = home && path.join(home, '.clara.json');
var homeConfig = readConfig(home);

var defaultOptions = {
  apiToken: null,
  basePath: '/api',
  dryRun: false,
  host: 'https://clara.io',
  logLevel: 'info',
  username: null
};

var conf;
var configFile;

function config(opts) {
  if (!conf) {
    conf = CC(CC.env('clara_'),  readConfig(process.cwd()), homeConfig, defaultOptions);
  }

  if (opts) {
    if (typeof opts !== 'object') throw new Error('Config opts must be an object');

    for (var key of Object.keys(opts)) {
      conf.set(key, opts[key]);
    }
  }
  log.level = conf.get('logLevel');

  return conf;
}

function write(key, value) {
  log.debug('HOME: ', home);
  if (!home) return log.error("Unknown home");
  if (!homeConfig) homeConfig = {};
  homeConfig[key] = value;
  log.info('wrote', '"'+key + ': '+ value+'"', 'to', homeConfigFile);
  fs.writeFileSync(homeConfigFile, JSON.stringify(homeConfig, null, '  '), 'utf8');
}

config.write = write;
config.home = home;
config.homeConfigFile = homeConfigFile;

module.exports = config;
