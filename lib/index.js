'use strict';

var R = require('ramda');
var method = require('./method');
var resources = require('./resources');
var config = require('./config');

clara.VERSION = require('../package.json').version;
function clara(opts) {
  var conf = config(opts || {});

  return R.mapObjIndexed(R.mapObjIndexed(method), resources);
}

module.exports = clara;
