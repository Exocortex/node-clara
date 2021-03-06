'use strict';

var importOptimized = require('../importOptimized');

module.exports = {
  library: {
    description: 'List public scenes',
    method: 'get',
    path: '/scenes',
    query: {
      page: { type: Number, description: 'Page number of results' },
      perPage: { type: Number, description: 'Number of items per page' },
      query: { type: String, description: 'Search query' },
    },
  },

  list: {
    description: 'List your scenes',
    method: 'get',
    path: '/users/$username/scenes',
    query: {
      page: { type: Number, description: 'Page number of results' },
      perPage: { type: Number, description: 'Number of items per page' },
      query: { type: String, description: 'Search query' },
    },
  },

  collections: {
    description: 'List your collections',
    method: 'get',
    path: '/collections',
  },

  collection: {
    description: 'List the scenes in a collection',
    method: 'get',
    path: '/collections/{collectionId}/scenes',
    query: {
      page: { type: Number, description: 'Page number of results' },
      perPage: { type: Number, description: 'Number of items per page' },
      query: { type: String, description: 'Search query' },
    },
  },

  create: {
    description: 'Create a new scene',
    method: 'post',
    path: '/scenes',
    body: { type: 'json', as: 'filename', required: false },
  },

  update: {
    description: 'Update a scene',
    method: 'put',
    path: '/scenes/{sceneId}',
    body: { type: 'json', as: 'filename', required: true },
  },

  get: {
    description: 'Get scene data',
    method: 'get',
    path: '/scenes/{sceneId}',
  },

  delete: {
    description: 'Delete a scene',
    method: 'delete',
    path: '/scenes/{sceneId}',
  },

  clone: {
    description: 'Clone a scene',
    method: 'post',
    path: '/scenes/{sceneId}/clone',
  },

  hashupload: {
    description: 'upload a file into the scene from hash',
    method: 'post',
    path: '/scenes/{sceneId}/files/fromHash',
    options: {
      hashes: {
        type: Array,
        description: 'Array of file hashes',
        required: true,
      },
    },
  },

  import: {
    description: 'Import files into the scene',
    method: 'post',
    path: '/scenes/{sceneId}/import',
    query: {
      async: { type: Boolean },
      data: {
        type: 'json',
        as: 'filename',
        description: 'Optional data for import',
      },
      fileIds: { type: Array, description: 'Array of existing file ids' },
    },
    options: {
      file: { type: 'File', description: 'A File', required: false },
      files: {
        type: 'Files',
        description: 'An array of files ',
        required: false,
      },
    },
  },

  buildup: {
    description: 'Import buildup file',
    method: 'post',
    path: '/scenes/buildup',
    body: { type: 'json', as: 'filename', required: true },
  },

  importOptimized: {
    description: 'Import files into the scene',
    path: '/scenes/{sceneId}/import',
    query: {
      async: { type: Boolean },
      data: {
        type: 'json',
        as: 'filename',
        description: 'Optional data for import',
      },
    },
    options: {
      file: { type: 'File', description: 'A File', required: false },
      files: {
        type: 'Files',
        description: 'An array of files ',
        required: false,
      },
    },
    customMethod: importOptimized,
  },

  export: {
    description: 'Export a scene',
    method: 'post',
    path: '/scenes/{sceneId}/export/{extension}',
    output: 'binary',
    async: true,
    query: {
      configuration: {
        type: String,
        description: 'Configuration settings (json)',
      },
    },
  },

  render: {
    description: 'Render an image',
    method: 'post',
    path: '/scenes/{sceneId}/render',
    async: true,
    query: {
      time: { type: Number, description: 'Frame number to render' },
      width: {
        type: Number,
        description: 'Width in pixels of the desired image',
      },
      height: {
        type: Number,
        description: 'Height in pixels of the desired image',
      },
      gi: { type: String, desription: 'Global Illumination (on|off)' },
      cache: { type: Boolean, description: 'Use render cache' },
      cameraNode: {
        type: String,
        description: 'Camera to user for rendering (name or id)',
      },
      cameraType: {
        type: String,
        description:
          'Camera type to render the scene (default|sphericala|box|fisheye|orthogonal)',
      },
      configuration: {
        type: String,
        description: 'Configuration settings (json)',
      },
      configurations: {
        type: String,
        description: 'Multi Configuration settings (json)',
      },
      configurationList: {
        type: String,
        description: 'Configuration List (json)',
      },
      format: {
        type: 'String',
        description: 'Render format (jpeg|png|mp4|gif|jpeg-frames|png-frames)',
      },
      clip: {
        type: String,
        description: 'Clip to render (json)',
      },
      fov: {
        type: Number,
        description: 'Field of view of the camera (0 to 360)',
      },
      quality: { type: 'Quality level: (basic|standard|high|maximum)' },
      gamma: {
        type:
          'Gamma correction value. Default is 2.2. To disable gamma correction use the value of 1.0',
      },
      preset: {
        type: String,
        description: 'Configurator preset',
      },
      v2renderer: {
        type: Boolean,
        description: 'Use v2 renderer for WebGL Renders',
      },
    },
    options: {
      setupCommand: {
        type: String,
        as: 'string',
        description: 'Command to be executed before render',
      },
      data: {
        type: 'json',
        as: 'filename',
        description: 'Optional data for setupCommand',
      },
    },
    output: (query, params) => {
      return query.format.match(/frames/) ? 'json' : 'binary';
    },
  },

  command: {
    description: 'Run a command',
    method: 'post',
    path: '/scenes/{sceneId}/command/{plugin}/{command}',
    options: {
      data: {
        type: 'json',
        as: 'filename',
        description: 'Optional data for setupCommand',
      },
    },
  },

  publish: {
    description: 'Publish a scene',
    method: 'post',
    path: '/scenes/{sceneId}/publish',
    options: {},
  },
};
