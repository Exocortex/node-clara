module.exports = {
  list: {
    description: 'List your jobs',
    method: 'get',
    path: '/users/$username/jobs',
    query: {
      page: { type: Number, description: 'Page number of results' },
      perPage: { type: Number, description: 'Number of jobs per page' },
    },
  },

  get: {
    description: 'Get job data',
    method: 'get',
    path: '/jobs/{jobId}',
  },
};
