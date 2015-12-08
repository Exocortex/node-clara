var R = require('ramda');
var program = require('commander');
var mapIndexed = R.addIndex(R.map);
var fs = require('fs');

var resources = require('../lib/resources');

program
  .version(require('../package.json').version)
  .option('-u, --username <username>', 'Username', process.env.CLARA_USERNAME)
  .option('-a, --authKey <authkey>', 'Auth Key', process.env.CLARA_API_KEY )
  .option('-o, --output <filename>', 'Output File')

function buildCommand(info, key, section) {
  var params = info.urlParams || [];
  var opts = R.map(function(opt) { return '<'+opt+'>' }, params).join(' ');
  var cmd = program.command(section+':'+key + ' '+ opts);

  var options = info.options || {};
  var query = info.query || {};

  cmd.description(info.description);

  function addOption(fromObj, key) {
    var info = fromObj[key];
    var param = info.required ? ' <'+key+'>' : ' ['+key+']';
    cmd.option('--'+key+param, info.description, info.default);
  };

  R.forEach(R.curry(addOption)(options), R.keys(options));
  R.forEach(R.curry(addOption)(query), R.keys(query));

  cmd.action(function() {
    var args = {};
    for (var i=0; i<params.length; i++) {
      args[params[i]] = arguments[i];
    }
    function convertParam(fromObj, v, k) {
      if (fromObj[k].type === Number) {
        return Number(v);
      } else {
        return v;
      }
    }
    var queryArgs = R.mapObjIndexed(R.curry(convertParam)(query),R.pick(R.keys(query), cmd));
    var opts = R.mapObjIndexed(R.curry(convertParam)(options),R.pick(R.keys(options), cmd));

    // console.log('query?', queryArgs);
    // console.log('args?', args);
    // console.log('opts?', opts);
    //
    var clara = require('../lib')(program.authKey, program.username);
    clara[section][key](Object.assign({}, args, queryArgs, opts)).then(function(result) {
      if (program.output) {
        fs.writeFileSync(program.output, JSON.stringify(result, null, '  '), 'utf8');
      } else {
        process.stdout.write(JSON.stringify(result, null, '  ')+'\n');
      }
    }).catch(function(err) {
      if (err.status) {
        console.log('err?', err.status, err.message);
      } else {
        console.log('err?', err);
      }
    });
  });
};

R.forEach(function(section) {
  R.forEach(function(key) {
    buildCommand(resources[section][key], key, section);
  }, R.keys(resources[section]));
}, R.keys(resources));


program.parse(process.argv);