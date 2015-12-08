'use strict';

module.exports = {
  list: {
    description: 'List public scenes',
    method: 'get',
    path: '/scenes',
    query: {
      perPage: {type: Number, description: 'Number of items per page'}
    }
  },

  get: {
    description: 'Get scene data',
    method: 'get',
    path: '/scenes/{sceneId}',
    urlParams: ['sceneId']
  },

  import: {
    description: 'Import a file into the scene',
    method: 'post',
    path: '/scenes/{sceneId}/import',
    urlParams: ['sceneId'],
    options: {
      file: {type: 'File', description: 'A File', required: false},
      files: {type: 'Files', description: 'An array of files ', required: false}
    }
  }
};
