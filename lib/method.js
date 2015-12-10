var fs = require('fs');
var path = require('path');
var superagent = require('superagent');
var template = require('url-template');
var queryString = require('query-string');
var R = require('ramda');
var forEachIndexed = R.addIndex(R.forEach);

function statusCheck(options, data, location, callback) {
  var req = superagent.get(location).redirects(0);
  req.set('Accept', 'application/json')
  if (options.authKey) req.auth(options.username, options.authKey);
  req.end(function(err, response) {
    if (err && err.response && err.response.statusCode === 303) {
      return callback(null, err.response);
    }

    if (err || response.statusCode >= 400 || response.body.status === 'failed') {
      return callback(err || response.statusCode);
    }
    if (response.statusCode === 303) return callback(null, response);

    setTimeout(function() {
      process.stderr.write('.');
      statusCheck(options, data, location, callback);
    }, 2000);
  });
}

module.exports = function(options, data, key) {
  if (!data.urlParams) data.urlParams = [];
  if (!data.options) data.options = {};
  if (!data.query) data.query = {};
  data.fileKeys = R.filter(function(k) { return data.options[k].type === 'File'; }, R.keys(data.options));
  data.filesKeys = R.filter(function(k) { return data.options[k].type === 'Files'; }, R.keys(data.options));
  data.fileAttachKeys = R.filter(function(k) { return data.options[k].type === 'FileAttach'; }, R.keys(data.options));

  if (!data.output) data.output = 'json';
  data.isJSON = data.output === 'json';

  return function(params, callback) {
    if (typeof params !== 'object') throw new Error('params must be an object');

    var args = R.pick(data.urlParams, params);
    var queryArgs = R.pick(R.keys(data.query), params);
    var qs = R.keys(queryArgs).length ? '?'+queryString.stringify(queryArgs) : '';

    var opts = R.pick(R.keys(data.options), params);
    R.forEach(function(fileAttachKey) {
      var filename = path.join(process.cwd(), opts[fileAttachKey]);
      opts[fileAttachKey] = JSON.parse(fs.readFileSync(filename, 'utf8'));
    }, data.fileAttachKeys);

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

    process.stderr.write(data.method + ' '+url+'\n');

    if (!callback && typeof params === 'function') {
      callback = params;
      params = {};
    }
    if (!callback) callback = function() {};

    return new Promise(function(resolve, reject) {

      function fail(err) {
        callback(err);
        reject(err);
      }

      function done(err, res, data) {
        callback(null, res.body, data);
        return resolve(res.body, data);
      }

      function fetchLocation(res) {
        process.stderr.write('\nFetching result '+res.headers.location+'\n');
        var req = superagent.get(res.headers.location)
        if (options.authKey) req.auth(options.username, options.authKey);
        if (data.output === 'json') req.set('Accept', 'application/json')
        req.end(function(err, res) {
          if (err) return fail(err);
          return done(null, res, data);
        });
      }

      var req = superagent[data.method](url);
      if (data.output === 'json') req.set('Accept', 'application/json')

      if (options.authKey) req.auth(options.username, options.authKey);

      R.forEach(function(fileKey) {
        if (opts[fileKey]) req.attach(fileKey, opts[fileKey]);
      }, data.fileKeys);

      R.forEach(function(filesKey) {
        forEachIndexed((file, i) => {
          req.attach(filesKey+i, file)
        }, opts[filesKey]);
      }, data.filesKeys);

      if (data.method !== 'get') {
        req.send(opts)
      }

      req.end(function(err, res) {
        if (err || res.statusCode >= 400) {
          fail(err);
        } else {
          if (data.async) {
            process.stderr.write('\n');
            statusCheck(options, data, res.headers.location, function(err, res) {
              if (err) return fail(err);
              if (res.statusCode === 303) return fetchLocation(res);
              done(null, res, data);
            });
          } else {
            done(null, res, data);
          }
        }
      });
    });
  };
}
