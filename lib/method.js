var fs = require('fs');
var path = require('path');
var superagent = require('superagent');
var template = require('url-template');
var queryString = require('query-string');
var R = require('ramda');
var forEachIndexed = R.addIndex(R.forEach);
var log = require('npmlog');
var config = require('./config');
var conf;

function statusCheck(data, location, callback) {
  var req = superagent.get(location).redirects(0);
  req.set('Accept', 'application/json')
  if (conf.get('apiToken')) req.auth(conf.get('username'), conf.get('apiToken'));
  req.end(function(err, response) {
    if (err && err.response && err.response.statusCode === 303) {
      return callback(null, err.response);
    }

    if (err || response.statusCode >= 400 || response.body.status === 'failed') {
      return callback(err || response.statusCode);
    }
    log.debug('statusCheck', response.statusCode, location);
    if (response.statusCode === 303) return callback(null, response);

    setTimeout(function() {
      process.stderr.write('.');
      statusCheck(data, location, callback);
    }, 2000);
  });
}

function urlFor(path, args, qs) {
  if (path.match(/\$username/) && !conf.get('username')) throw new Error('Username required');
  var tmpl = path.replace(/\$username/, conf.get('username'));
  return conf.get('host') + conf.get('basePath') + template.parse(tmpl).expand(args) + qs;
};

function parseJSON(json) {
  return typeof json === 'string' ? JSON.parse(fs.readFileSync(path.join(process.cwd(), json), 'utf8')) : json;
};


function objectIfUndefined(v, key, allowed) {
  if (v == null) return {};
  if (allowed.indexOf(typeof v) !== -1) return v;
  throw new Error(key+' must be an object');
};

module.exports = function(data, key) {
  conf = config();

  return function(queryOptions, params, callback) {
    queryOptions = objectIfUndefined(queryOptions, 'queryOptions', ['object']);
    params = objectIfUndefined(params, 'params', ['object','string']);
    if (!callback) callback = function() {};

    var args = R.pick(data.urlParams, queryOptions);
    var queryArgs = R.pick(R.keys(data.query), queryOptions);
    var qs = R.keys(queryArgs).length ? '?'+queryString.stringify(queryArgs) : '';

    var opts = R.pick(R.keys(data.options), params);
    R.forEach(function(jsonKey) {
      opts[jsonKey] = parseJSON(opts[jsonKey]);
    }, data.jsonKeys);

    if (data.body && params) {
      opts = parseJSON(params);
    }


    var errors = [];
    function checkRequired(fromObj, obj, key) {
      if (fromObj[key].required && obj[key] === undefined) {
        errors.push(key+ ' required');
      }
    }
    R.forEach(R.curry(checkRequired)(data.options, opts), R.keys(data.options));
    R.forEach(R.curry(checkRequired)(data.query, queryArgs), R.keys(data.query));

    return new Promise(function(resolve, reject) {

      function fail(err) {
        callback(err);
        reject(err);
      }

      function done(err, res) {
        var result;

        if (!data.isBinary) {
          result = data.isJSON ? res.body : res.text;
          callback(null, result);
          resolve(result);
        } else {
          if (res.body && res.body instanceof Buffer) {
            return callback(null, res.body);
            resolve(res.body);
          } else {
            res.setEncoding('binary');
            var buf = '';
            res.on('data', function(chunk) {
              buf += chunk;
            });
            res.on('end', function() {
              result = new Buffer(buf, 'binary');
              callback(null, result);
              resolve(result);
            });
          }
        }
      }

      function fetchLocation(res) {
        log.verbose('\nFetching result '+res.headers.location+'\n');
        var req = superagent.get(res.headers.location)
        if (conf.get('apiToken')) req.auth(conf.get('username'), conf.get('apiToken'));
        if (data.output === 'json') req.set('Accept', 'application/json')
        req.end(function(err, res) {
          if (err) return fail(err);
          return done(null, res);
        });
      }

      if (errors.length) return fail(errors);

      var url = urlFor(data.path, args, qs);

      log.info(data.method + ' '+url+'\n');

      if (conf.get('dryRun')) {
        log.verbose('Sending: ', JSON.stringify(opts, null, '  '));
        return resolve();
      }

      var req = superagent[data.method](url);
      if (data.output === 'json') req.set('Accept', 'application/json')
      if (conf.get('apiToken')) req.auth(conf.get('username'), conf.get('apiToken'));

      log.debug('sending: ', JSON.stringify(opts, null, '  '));

      R.forEach(function(fileKey) {
        if (opts[fileKey]) req.attach(fileKey, opts[fileKey]);
      }, data.fileKeys);

      R.forEach(function(filesKey) {
        forEachIndexed((file, i) => {
          req.attach(filesKey+i, file)
        }, opts[filesKey] || []);
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
            statusCheck(data, res.headers.location, function(err, res) {
              log.debug('Finished async', res && res.statusCode);
              if (err) return fail(err);
              if (res.statusCode === 303) return fetchLocation(res);
              done(null, res);
            });
          } else {
            done(null, res);
          }
        }
      });
    });
  };
}
