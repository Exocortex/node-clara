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
  cmd.description(info.description);

  cmd.action(function(args) {
    var opts = {};
    for (var i=0; i<params.length; i++) {
      opts[params[i]] = arguments[i];
    }

    var clara = require('../lib')(program.authKey, program.username);
    clara[section][key](opts).then(function(result) {
      if (program.output) {
        fs.writeFileSync(program.output, JSON.stringify(result, null, '  '), 'utf8');
      } else {
        console.log(result);
      }
    }).catch(function(err) {
      console.log('err?', err.status, err.message);
    });
  });
};

R.forEach(function(section) {
  R.forEach(function(key) {
    buildCommand(resources[section][key], key, section);
  }, R.keys(resources[section]));
}, R.keys(resources));


program.parse(process.argv);
