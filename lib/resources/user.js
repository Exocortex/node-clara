module.exports = {
  get: {
    description: 'Get User Profile',
    method: 'get',
    path: '/users/$username',
  },

  update: {
    description: 'Update user profile',
    method: 'put',
    path: '/users/$username',
    body: { type: 'json', as: 'filename', required: true },
  },
};
