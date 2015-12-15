'use strict';

module.exports = {
  library: {
    description: 'List public scenes',
    method: 'get',
    path: '/scenes',
    query: {
      page: {type: Number, description: 'Page number of results'},
      perPage: {type: Number, description: 'Number of items per page'},
      query: {type: String, description: 'Search query'}
    }
  },

  list: {
    description: 'List your scenes',
    method: 'get',
    path: '/users/$username/scenes',
    query: {
      page: {type: Number, description: 'Page number of results'},
      perPage: {type: Number, description: 'Number of items per page'},
      query: {type: String, description: 'Search query'}
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
    query: {
      time: {type: Number, description: 'Frame number to render'},
      width: {type: Number, description: 'Width in pixels of the desired image'},
      height: {type: Number, description: 'Height in pixels of the desired image'},
      gi: {type: String, desription: "Global Illumination (on|off)"},
      cameraNode: {type: String, description: "Camera to user for rendering (name or id)"},
      cameraType: {type: String, description: "Camera type to render the scene (default|sphericala|box|fisheye|orthogonal)"},
      fov: {type: Number, description: "Field of view of the camera (0 to 360)"},
      quality: {type: "Quality level: (basic|standard|high|maximum)"},
      gamma: {type: "Gamma correction value. Default is 2.2. To disable gamma correction use the value of 1.0"}
    },
    options: {
      setupCommand: {type: String, as: 'string', description: 'Command to be executed before render'},
      data: {type: 'json', as: 'filename', description: 'Optional data for setupCommand'}
    },
    output: 'binary'
  },

  command: {
    description: 'Run a command',
    method: 'post',
    path: '/scenes/{sceneId}/command/{plugin}/{command}',
    options: {
      data: {type: 'json', as: 'filename', description: 'Optional data for setupCommand'}
    }
  }
};
