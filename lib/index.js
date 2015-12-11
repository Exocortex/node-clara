'use strict';

var R = require('ramda');
var log = require('npmlog');
log.addLevel('debug', 100, { fg: 'yellow', bg: 'black' }, 'DEBUG');
var method = require('./method');

var resources = require('./resources');

clara.DEFAULT_HOST = 'https://clara.io'
clara.DEFAULT_BASE_PATH = '/api';
clara.DEFAULT_LOG_LEVEL = 'info';

clara.VERSION = require('../package.json').version;

function clara(apiToken, username, opts) {
  if (!opts) opts = {};

  var options = {
    apiToken: apiToken,
    username: username,
    level: opts.level || clara.DEFAULT_LOG_LEVEL,
    host: opts.host || clara.DEFAULT_HOST,
    basePath: opts.basePath || clara.DEFAULT_BASE_PATH
  };
  log.level = options.level;

  var apiMethod = R.curry(method)(options);

  return R.mapObjIndexed(R.mapObjIndexed(apiMethod), resources);
}

module.exports = clara;
