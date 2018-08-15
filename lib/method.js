require('es6-promise');
var fs = require('fs');
var path = require('path');
var queryString = require('query-string');
var R = require('ramda');
var forEachIndexed = R.addIndex(R.forEach);
var log = require('npmlog');
var config = require('./config');
var agent = require('./agent');
var conf;

function statusCheck(data, location, callback) {
  var req = agent.req('get', location);
  req.redirects(0);
  req.set('Accept', 'application/json');
  req.end(function(err, response) {
    var seeOther =
      (err &&
        err.response &&
        err.response.statusCode === 303 &&
        err.response) ||
      (response && response.statusCode === 303 && response);

    if (seeOther) {
      if (seeOther.type.match(/json/) && seeOther.body.status !== 'ok') {
        log.verbose('Async failed', seeOther.body);
        return callback(new Error('Job failed: ' + seeOther.body.id));
      }
      return callback(null, err.response);
    }

    if (
      err ||
      response.statusCode >= 400 ||
      response.body.status === 'failed'
    ) {
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

function parseJSON(json) {
  return typeof json === 'string'
    ? JSON.parse(fs.readFileSync(path.join(process.cwd(), json), 'utf8'))
    : json;
}

function objectIfUndefined(v, key, allowed) {
  if (v == null) return {};
  if (allowed.indexOf(typeof v) !== -1) return v;
  throw new Error(key + ' must be an object');
}

module.exports = function(data, key) {
  return function(queryOptions, params, callback) {
    conf = config();

    queryOptions = objectIfUndefined(queryOptions, 'queryOptions', ['object']);
    if (typeof params === 'function' && callback === undefined) {
      callback = params;
      params = {};
    } else {
      params = objectIfUndefined(params, 'params', ['object', 'string']);
      if (!callback) callback = function() {};
    }

    var args = R.pick(data.urlParams, queryOptions);
    var queryArgs = R.pick(R.keys(data.query), queryOptions);
    R.forEach(function(key) {
      queryArgs[key] = JSON.stringify(parseJSON(queryArgs[key]));
    }, data.jsonQueryKeys);
    var qs = R.keys(queryArgs).length
      ? '?' + queryString.stringify(queryArgs)
      : '';
    var onlyLocation = data.async && queryOptions.url;

    var opts;

    if (data.body && typeof params === 'string') {
      opts = parseJSON(params);
    } else if (data.body && !Object.keys(data.options).length) {
      opts = params;
    } else {
      opts = R.pick(R.keys(data.options), params);
      R.forEach(function(jsonKey) {
        opts[jsonKey] = parseJSON(opts[jsonKey]);
      }, data.jsonKeys);
    }

    var errors = [];
    function checkRequired(fromObj, obj, key) {
      if (fromObj[key].required && obj[key] === undefined) {
        errors.push(key + ' required');
      }
    }
    R.forEach(R.curry(checkRequired)(data.options, opts), R.keys(data.options));
    R.forEach(
      R.curry(checkRequired)(data.query, queryArgs),
      R.keys(data.query)
    );

    if (data.customMethod)
      return data.customMethod(queryOptions, params, callback);

    const outputFormat =
      typeof data.output === 'function'
        ? data.output(queryOptions, params)
        : data.output;

    return new Promise(function(resolve, reject) {
      function fail(err, res) {
        callback(err, res);
        reject(err, res);
      }

      function done(err, res) {
        var result;

        if (outputFormat !== 'binary') {
          result = outputFormat === 'json' ? res.body : res.text;
          callback(null, result);
          resolve(result);
        } else {
          if (res.body && res.body instanceof Buffer) {
            callback(null, res.body);
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
        if (onlyLocation) {
          callback(null, res.headers.location);
          return resolve(res.headers.location);
        }

        log.verbose('\nFetching result ' + res.headers.location + '\n');
        var req = agent.req('get', res.headers.location);
        if (outputFormat === 'json') req.set('Accept', 'application/json');
        req.end(function(err, res) {
          if (err) return fail(err);
          return done(null, res);
        });
      }

      if (errors.length) return fail(errors);

      var url = agent.urlFor(data.path, args, qs);

      log.info(data.method + ' ' + url + '\n');

      if (conf.get('dryRun')) {
        log.verbose('Sending: ', JSON.stringify(opts, null, '  '));
        return resolve();
      }

      var req = agent.req(data.method, url);
      if (outputFormat === 'json') req.set('Accept', 'application/json');

      R.forEach(function(fileKey) {
        if (opts[fileKey]) req.attach(fileKey, opts[fileKey]);
      }, data.fileKeys);

      R.forEach(function(filesKey) {
        forEachIndexed(function(file, i) {
          req.attach(filesKey + i, file);
        }, opts[filesKey] || []);
      }, data.filesKeys);

      if (data.method !== 'get') {
        log.debug('sending: ', JSON.stringify(opts, null, '  '));
        req.send(opts);
      }

      req.end(function(err, res) {
        if (err || res.statusCode >= 400) {
          fail(err, res);
        } else {
          if (data.async) {
            process.stderr.write('\n');
            statusCheck(data, res.headers.location, function(err, res) {
              if (err) return fail(err);
              log.debug('Finished async', res && res.statusCode);
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
};
