var R = require('ramda');

function urlParamsForPath(path) {
  var re = /\{((.*?))\}/g;
  var params = [];
  var match;
  while (match = re.exec(path)) {
    params.push(match[1]);
  }
  return params;
};

function normalize(data, key) {
  if (!data.urlParams) data.urlParams = urlParamsForPath(data.path);
  if (!data.options) data.options = {};
  if (!data.query) data.query = {};
  data.jsonQueryKeys = R.filter(function(k) { return data.query[k].type === 'json'; }, R.keys(data.query));
  data.fileKeys = R.filter(function(k) { return data.options[k].type === 'File'; }, R.keys(data.options));
  data.filesKeys = R.filter(function(k) { return data.options[k].type === 'Files'; }, R.keys(data.options));
  data.jsonKeys = R.filter(function(k) { return data.options[k].type === 'json'; }, R.keys(data.options));

  if (!data.output) data.output = 'json';
  data.isJSON = data.output === 'json';
  data.isText = data.output === 'text';
  data.isBinary = data.output === 'binary';

  return data;
};

var resources = {
  scenes: require('./scenes'),
  jobs: require('./jobs'),
  user: require('./user'),
  webhooks: require('./webhooks')
};

module.exports = R.mapObjIndexed(R.mapObjIndexed(normalize), resources);
