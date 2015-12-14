var path = require('path');
var expect = require('chai').expect;
var clara = require('../lib')();

function fixture(filename) {
  return path.join(__dirname, filename);
}

describe('Integration test', function() {
  //var sceneId = "17dc9efb-5157-491c-9642-6f621086525e";
  var sceneId;

  it('should create a scene', function(done) {
    clara.scenes.create({}, {}, function(err, newScene) {
      expect(err).to.not.exist;
      expect(newScene._id.length).to.equal(36);
      sceneId = newScene._id;
      done();
    });
  });

  it('should update a scene', function(done) {
    var name = "Integration Test: "+(new Date).getTime();
    clara.scenes.update({sceneId: sceneId}, {name: name}, function(err, scene) {
      expect(err).to.not.exist;
      expect(scene.name).to.equal(name);
      done();
    });
  });

  it('should import a file', function(done) {
    this.timeout(30000);

    clara.scenes.import({sceneId: sceneId}, {file: fixture('wave.jpg')}, function(err, result) {
      expect(err).to.not.exist;
      expect(result.status).to.equal('ok');
      done();
    });
  });

  it('should render a file', function(done) {
    this.timeout(30000);

    clara.scenes.render({sceneId: sceneId}, {}, function(err, result) {
      expect(err).to.not.exist;
      expect(result instanceof Buffer).to.be.true;
      expect(result.length).to.be.gt(1000);
      done();
    });
  });
});
