var md5File = require('md5-file');
var R = require('ramda');
var filterIndexed = R.addIndex(R.filter);
var config = require('./config');
var log = require('npmlog');

// Hash each file, send hashes to `hashuplaod`
// Based on response, send file or fileId to `import`
module.exports = function(queryOptions, params, callback) {
  var clara = require('./index')();

  var hashes = R.filter(function(hash) { return !!hash; }, R.map(function(file) {
    try {
      return md5File(file);
    } catch (e) {
      return false;
    }
  }, params.files));

  return clara.scenes.hashupload({sceneId: queryOptions.sceneId}, {hashes: hashes}, function(err, result) {
    var existingHashes = R.filter(function(hash) { return result[hash]; }, hashes);
    var fileIds = R.map(function(hash) { return result[hash]; }, existingHashes);
    var files = filterIndexed(function(file,idx) {
      return !result[hashes[idx]];
    }, params.files);

    log.debug('importing new: ', files);
    log.debug('importing existing: ', fileIds);

    var query = Object.assign({}, queryOptions, {fileIds: fileIds});
    return clara.scenes.import(query, {files: files}, callback);

  });
};
