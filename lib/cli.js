var R = require('ramda');
var program = require('commander');
var mapIndexed = R.addIndex(R.map);
var fs = require('fs');
var jsonQuery = require('json-query');
var log = require('npmlog');

var config = require('../lib/config');
var conf = config();
var clara = require('../lib');
var resources = require('../lib/resources');
var claraOptions = {};

function setLogLevel(level) {
  return function() {
    conf.set('logLevel', level);
    log.level = level;
  };
};


program
  .version(require('../package.json').version)
  .option('--username <username>', 'Username', function(u) { conf.set('username', u); }, conf.get('username'))
  .option('--server <server>', 'Server to use [server]', function(v) { conf.set('host', v); }, conf.get('host'))
  .option('--apiToken <apiToken>', 'API Token', function(t) { conf.set('apiToken', t); }, conf.get('apiToken'))
  .option('-o, --output <filename>', 'Output File')
  .option('--jsonQuery <jsonQuery>', 'JSON Query')
  .option('--verbose', 'Verbose output', setLogLevel('verbose'))
  .option('--debug', 'Debug output', setLogLevel('debug'))
  .option('--quiet', 'Output only errors', setLogLevel('error'))
  .option('--dryRun', 'Dry Run', function() { conf.set('dryRun', true); }, conf.get('dryRun'))


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
  if (info.body) addOption(info, 'body');

  cmd.action(function() {


    var claraApi = clara(claraOptions);

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
    if (info.body) opts.body = cmd.body;

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

program.command('set <key> <val>')
  .description('Set a configuration value to '+config.homeConfigFile)
  .action(function(key,val) {
    config.write(key, val);
  });

program.command('get <key>')
  .description('Return the current configuration for <key>')
  .action(function(key) {
    log.info(key, ':', conf.get(key));
  });


program.parse(process.argv);
