var R = require('ramda');
var program = require('commander');
var mapIndexed = R.addIndex(R.map);
var fs = require('fs');
var jsonQuery = require('json-query');
var log = require('npmlog');

var clara = require('../lib');
var resources = require('../lib/resources');

var claraOptions = {
  level: clara.DEFAULT_LOG_LEVEL,
  host: clara.DEFAULT_HOST
};

program
  .version(require('../package.json').version)
  .option('--username <username>', 'Username', process.env.CLARA_USERNAME)
  .option('--server <server>', clara.DEFAULT_HOST)
  .option('--apiToken <apiToken>', 'API Token', process.env.CLARA_API_TOKEN)
  .option('-o, --output <filename>', 'Output File')
  .option('--jsonQuery <jsonQuery>', 'JSON Query')
  .option('--verbose', 'Verbose output')
  .option('--debug', 'Debug output')
  .option('--quiet', 'Output only errors')

function buildCommand(info, key, section) {
  var urlParams = info.urlParams || [];
  var optionString = R.map(function(opt) { return '<'+opt+'>' }, urlParams).join(' ');
  var cmd = program.command(section+':'+key + ' '+ optionString);

  var cmdOptions = info.options || {};
  var query = info.query || {};

  cmd.description(info.description);

  function addOption(fromObj, key) {
    var info = fromObj[key];
    var param = info.required ? ' <'+key+'>' : ' ['+(info.as || key)+']';
    cmd.option('--'+key+param, info.description, info.default);
  };

  R.forEach(R.curry(addOption)(cmdOptions), R.keys(cmdOptions));
  R.forEach(R.curry(addOption)(query), R.keys(query));

  cmd.action(function() {
    if (program.verbose) claraOptions.level = 'verbose';
    if (program.debug) claraOptions.level = 'debug';
    if (program.quiet) claraOptions.level = 'error';
    if (program.server) claraOptions.host = program.server;

    var args = {};
    for (var i=0; i<urlParams.length; i++) {
      args[urlParams[i]] = arguments[i];
    }
    function convertParam(fromObj, v, k) {
      if (fromObj[k].type === Number) {
        return Number(v);
      } else {
        return v;
      }
    }
    var queryArgs = R.mapObjIndexed(R.curry(convertParam)(query),R.pick(R.keys(query), cmd));
    var opts = R.mapObjIndexed(R.curry(convertParam)(cmdOptions),R.pick(R.keys(cmdOptions), cmd));

    var fail = function(err) {
      if (err.status) {
        console.log('err?', err.status, err.message);
      } else {
        console.log('err?', err);
      }
    }

    // console.log('query?', queryArgs);
    // console.log('args?', args);
    // console.log('opts?', opts);
    //
    var claraApi = clara(program.authKey, program.username, claraOptions);
    claraApi[section][key](Object.assign({}, args, queryArgs, opts), function(err, result, outputOptions) {
      if (err) return fail(err);

      var isJSON = !outputOptions || outputOptions.isJSON;
      var output = result;
      isJSON ? JSON.stringify(result, null, '  ') : result;

      if (isJSON) {
        if (program.jsonQuery) {
          log.info('running query: ', program.jsonQuery);
          output = jsonQuery(program.jsonQuery, {data: output}).value;
          if (output === undefined) {
            output = "Invalid json query";
          }
        }
        output = JSON.stringify(output, null, '  ');
      }


      if (program.output) {
        fs.writeFileSync(program.output, output, isJSON ? 'utf8' : 'binary');
      } else {
        process.stdout.write(output);
      }
    }).catch(fail);
  });
};

R.forEach(function(section) {
  R.forEach(function(key) {
    buildCommand(resources[section][key], key, section);
  }, R.keys(resources[section]));
}, R.keys(resources));


program.parse(process.argv);
