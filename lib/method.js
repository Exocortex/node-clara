var superagent = require('superagent');
var template = require('url-template');
var queryString = require('query-string');
var R = require('ramda');

module.exports = function(options, data, key) {
  if (!data.urlParams) data.urlParams = [];
  if (!data.options) data.options = {};
  if (!data.query) data.query = {};
  data.files = R.filter(function(k) { return data.options[k].type === 'File'; }, R.keys(data.options));

  return function(params, callback) {
    var args = R.pick(data.urlParams, params);
    var queryArgs = R.pick(R.keys(data.query), params);
    var qs = R.keys(queryArgs).length ? '?'+queryString.stringify(queryArgs) : '';
    var opts = R.pick(R.keys(data.options), params);

    var errors = [];
    function checkRequired(fromObj, obj, key) {
      if (fromObj[key].required && obj[key] === undefined) {
        errors.push(key+ ' required');
      }
    }
    R.forEach(R.curry(checkRequired)(data.options, opts), R.keys(data.options));
    R.forEach(R.curry(checkRequired)(data.query, queryArgs), R.keys(data.query));
    if (errors.length) return Promise.reject(errors);

    var url = options.host+options.basePath+template.parse(data.path).expand(args)+qs;

    console.log(data.method, url);

    if (!callback && typeof params === 'function') {
      callback = params;
      params = {};
    }
    if (!callback) callback = function() {};

      return new Promise(function(resolve, reject) {
      var req = superagent[data.method](url)
        .set('Accept', 'application/json')
        .auth(options.username, options.authKey);

      R.forEach(function(fileKey) {
        if (opts[fileKey]) req.attach(fileKey, opts[fileKey]);
      }, data.files);

      req.end(function(err, res) {
        if (err) {
          callback(err);
          return reject(err);
        } else {
          callback(null, res.body, res);
          return resolve(res.body, res);
        }
      });
    });
  };
}
