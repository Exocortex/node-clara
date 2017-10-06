'use strict';

var R = require('ramda');
var method = require('./method');
var resources = require('./resources');
var agent = require('./agent');
var config = require('./config');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

clara.VERSION = require('../package.json').version;
clara.agent = agent;
function clara(opts) {
  var conf = config(opts || {});

  return R.mapObjIndexed(R.mapObjIndexed(method), resources);
}

module.exports = clara;
