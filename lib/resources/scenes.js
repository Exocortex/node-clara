'use strict';

module.exports = {
  list: {
    description: 'List public scenes',
    method: 'get',
    path: '/scenes'
  },

  get: {
    description: 'Get scene data',
    method: 'get',
    path: '/scenes/{sceneId}',
    urlParams: ['sceneId']
  }
};
