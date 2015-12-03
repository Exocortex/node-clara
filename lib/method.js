var superagent = require('superagent');
var template = require('url-template');
var R = require('ramda');

module.exports = function(options, data, key) {
  if (!data.urlParams) data.urlParams = [];

  return function(params, callback) {
    var args = R.pick(data.urlParams, params);
    var url = options.host+options.basePath+template.parse(data.path).expand(args);
    console.log(data.method, url);

    if (!callback && typeof params === 'function') {
      callback = params;
      params = {};
    }
    if (!callback) callback = function() {};

    return new Promise(function(resolve, reject) {
      superagent[data.method](url)
      .set('Accept', 'application/json')
      .auth(options.username, options.authKey)
      .end(function(err, res) {
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
