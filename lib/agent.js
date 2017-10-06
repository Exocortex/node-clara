var superagent = require('superagent');
var template = require('url-template');
var config = require('./config');
var conf;

exports.urlFor = function(path, args, qs) {
  if (!conf) conf = config();

  if (path.match(/\$username/) && !conf.get('username')) throw new Error('Username required');
  var tmpl = path.replace(/\$username/, conf.get('username'));
  return conf.get('host') + conf.get('basePath') + template.parse(tmpl).expand(args) + qs;
};

exports.req = function(method, url) {
  if (!conf) conf = config();
  var req = superagent[method](url);
  if (conf.get('apiToken')) req.auth(conf.get('username'), conf.get('apiToken'));
  return req;
};
