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

  create: {
    description: 'Create a new scene',
    method: 'post',
    path: '/scenes',
    body: {type: 'json', as: 'filename', required: false}
  },

  update: {
    description: 'Update a scene',
    method: 'put',
    path: '/scenes/{sceneId}',
    body: {type: 'json', as: 'filename', required: true}
  },

  get: {
    description: 'Get scene data',
    method: 'get',
    path: '/scenes/{sceneId}',
  },

  delete: {
    description: 'Delete a scene',
    method: 'delete',
    path: '/scenes/{sceneId}'
  },

  clone: {
    description: 'Clone a scene',
    method: 'post',
    path: '/scenes/{sceneId}/clone',
  },

  import: {
    description: 'Import a file into the scene',
    method: 'post',
    path: '/scenes/{sceneId}/import',
    options: {
      file: {type: 'File', description: 'A File', required: false},
      files: {type: 'Files', description: 'An array of files ', required: false}
    }
  },

  export: {
    description: 'Export a scene',
    method: 'post',
    path: '/scenes/{sceneId}/export/{extension}',
    output: 'binary',
    async: true
  },

  render: {
    description: 'Render an image',
    method: 'post',
    path: '/scenes/{sceneId}/render',
    async: true,
    options: {
      setupCommand: {type: String, as: 'string', description: 'Command to be executed before render'},
      data: {type: 'json', as: 'filename', description: 'Optional data for setupCommand'}
    },
    output: 'binary'
  }
};
