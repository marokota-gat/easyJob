/**
 * offerta controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::offerta.offerta',
  ({ strapi }) => ({
    async delete(ctx) {
      const id = ctx.params.id;
      console.log('DEBUG: DELETE chiamata per offerta', id);
      try {
        const entity = await strapi.entityService.delete(
          'api::offerta.offerta',
          id
        );
        console.log(
          'DEBUG: Risultato entityService.delete:',
          entity
        );
        ctx.send({ data: entity });
        return { data: entity };
      } catch (err) {
        console.error(
          'DEBUG: Errore entityService.delete:',
          err
        );
        ctx.throw(500, 'Errore durante la cancellazione');
      }
    },

    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Utente non autenticato');
      }

      const data = {
        ...ctx.request.body.data,
        user: user.id, 
      };

      const entity = await strapi.entityService.create('api::offerta.offerta', {
        data,
        populate: ['user'],
      });

      return ctx.send(entity);
    },
  })
);
