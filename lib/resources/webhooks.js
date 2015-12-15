

var webhookOptions = {
  url: {type: String, description: 'URL of your webhook', required: true},
  jobTypes: {type: Array, description: 'Array of job types', required: true},
  statuses: {type: Array, description: 'Array of status', required: true},
  active: {type: Boolean, description: 'Activate webhook'},
  scenes: {type: Array, description: 'List of scenes to listen for'},
  secret: {type: String, description: 'If set, Clara.io will send a X-Clara-Signature header containing the HMAC hex digest of the body using this secret as the key'}
};

module.exports = {
  list: {
    description: 'List webhooks',
    method: 'get',
    path: '/webhooks',
    query: {
      page: {type: Number, description: 'Page number of results'},
      perPage: {type: Number, description: 'Number of items per page'},
    }
  },

  create: {
    description: 'Create a webhook',
    method: 'post',
    path: '/webhooks',
    body: {type: 'json', as: 'filename', required: false},
    options: webhookOptions
  },

  update: {
    description: 'Update a webhook',
    method: 'put',
    path: '/webhooks/{webhookId}',
    body: {type: 'json', as: 'filename', required: false},
    options: webhookOptions
  },
}
