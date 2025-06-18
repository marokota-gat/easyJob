export default {
  routes: [
    {
      method: 'PUT',
      path: '/candidatura/:id/status',
      handler: 'candidatura.updateStatus',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['api::candidatura.candidatura.update']
        }
      },
    },
    {
      method: 'PUT',
      path: '/candidatura/:id/feedback',
      handler: 'candidatura.updateFeedback',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['api::candidatura.candidatura.update']
        }
      },
    },
  ],
}; 