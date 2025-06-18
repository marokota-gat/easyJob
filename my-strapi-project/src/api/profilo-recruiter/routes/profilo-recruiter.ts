/**
 * profilo-recruiter router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::profilo-recruiter.profilo-recruiter', {
  config: {
    find: {
      middlewares: [
        // Aggiungiamo un middleware per assicurarci che la richiesta sia gestita correttamente
        (ctx, next) => {
          console.log('Middleware for find - Query:', ctx.query);
          return next();
        },
      ],
    },
    findOne: {
      middlewares: [
        // Middleware per loggare le richieste findOne
        (ctx, next) => {
          console.log('Middleware for findOne - Params:', ctx.params);
          return next();
        },
      ],
    },
  },
}); 