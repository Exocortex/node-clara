require('es6-promise');
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
    var seeOther = (err && err.response && err.response.statusCode === 303 && err.response) ||
      (response && response.statusCode === 303 && response);

    if (seeOther) {
      if (seeOther.type.match(/json/) && seeOther.body.status !== 'ok') {
        log.verbose("Async failed", seeOther.body);
        return callback(new Error("Job failed: "+seeOther.body.id));
      }
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
  return function(queryOptions, params, callback) {
    conf = config();

    queryOptions = objectIfUndefined(queryOptions, 'queryOptions', ['object']);
    if (typeof params === 'function' && callback === undefined) {
      callback = params;
      params = {};
    } else {
      params = objectIfUndefined(params, 'params', ['object','string']);
      if (!callback) callback = function() {};
    }

    var args = R.pick(data.urlParams, queryOptions);
    var queryArgs = R.pick(R.keys(data.query), queryOptions);
    R.forEach(function(key) {
      queryArgs[key] = JSON.stringify(parseJSON(queryArgs[key]));
    }, data.jsonQueryKeys);
    var qs = R.keys(queryArgs).length ? '?'+queryString.stringify(queryArgs) : '';
    var onlyLocation = (data.async || data.sse) && queryOptions.url;

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
        errors.push(key+ ' required');
      }
    }
    R.forEach(R.curry(checkRequired)(data.options, opts), R.keys(data.options));
    R.forEach(R.curry(checkRequired)(data.query, queryArgs), R.keys(data.query));

    if (data.customMethod) return data.customMethod(queryOptions, params, callback);

    return new Promise(function(resolve, reject) {

      function fail(err, res) {
        callback(err, res);
        reject(err, res);
      }

      function done(err, res) {
        var result;

        if (!res) {
          callback(null, res);
          resolve(res);
        } else if (!data.isBinary) {
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
        if (onlyLocation) {
          callback(null, res.headers.location);
          return resolve(res.headers.location);
        }

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
      if (data.output === 'json') req.set('Accept', 'application/json');
      if (data.sse) req.set('Accept', 'text/event-stream');
      if (conf.get('apiToken')) req.auth(conf.get('username'), conf.get('apiToken'));

      R.forEach(function(fileKey) {
        if (opts[fileKey]) req.attach(fileKey, opts[fileKey]);
      }, data.fileKeys);

      R.forEach(function(filesKey) {
        forEachIndexed(function(file, i) {
          req.attach(filesKey+i, file)
        }, opts[filesKey] || []);
      }, data.filesKeys);

      if (data.method !== 'get') {
        log.debug('sending: ', JSON.stringify(opts, null, '  '));
        req.send(opts);
      }


      if (data.sse) {
        var stream = require('stream').Writable();
        var buf = '';
        var job = { status: 'starting', message: '', progress: 0};
        stream._write = function(chunk, enc, next) {
          buf = buf +  chunk.toString('utf8');
          var lines = buf.split('\n');
          buf = lines[lines.length-1];
          for (var i = 0; i < lines.length-1; i++) {
            var line = lines[i];
            if (line === '') continue;
            var match = line.match(/^data: (.*)$/);
            if (!match) {
              log.debug('unmatched line', line);
              continue;
            }
            job = R.merge(job, JSON.parse(match[1]));
            if (job.message === null) job.message = '';
            if (opts.progressCallback) opts.progressCallback(job);
          }

          next();
        };

        stream.on('error', function(err) {
          done(err);
        });

        stream.on('finish', function() {
          if (!job.files || !job.files.length || !job.files[0].url) return done(null);
          if (onlyLocation) {
            callback(null, job.files[0].url);
            return resolve(job.files[0].url);
          }
          var req2 = superagent.get(job.files[0].url);
          req2.end(done);
        });

        req.pipe(stream);
        return;
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
}
