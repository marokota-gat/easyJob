/**
 * candidatura controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::candidatura.candidatura', ({ strapi }) => ({
  // Metodo personalizzato per creare una candidatura
  async create(ctx) {
    try {
      // Ottieni l'ID dell'utente dal token JWT
      const userId = ctx.state.user.id;
      console.log('Create Candidatura - User ID from JWT:', userId);
      console.log('Create Candidatura - Request body:', JSON.stringify(ctx.request.body));
      
      // Verifica se l'utente è autenticato
      if (!userId) {
        return ctx.unauthorized('Utente non autenticato');
      }
      
      // Estrai i dati dalla richiesta
      const { data } = ctx.request.body;
      
      // Assicurati che i dati includano l'ID utente
      if (!data.user) {
        data.user = userId;
      }
      
      // Imposta la data di candidatura a oggi se non specificata
      if (!data.dataCandidatura) {
        data.dataCandidatura = new Date().toISOString().split('T')[0];
      }
      
      // Imposta lo stato predefinito se non specificato
      if (!data.stato) {
        data.stato = 'inviata';
      }
      
      console.log('Create Candidatura - Final data to save:', data);
      
      // Crea la candidatura
      const entity = await strapi.entityService.create('api::candidatura.candidatura', {
        data: data
      });
      
      console.log('Create Candidatura - Created entity:', entity);
      
      // Restituisci il risultato
      return { data: entity };
    } catch (err) {
      console.error('Error in candidatura controller (create):', err);
      return ctx.badRequest(`${err.name}: ${err.message}`);
    }
  },

  // Metodo personalizzato per aggiornare lo stato di una candidatura
  async updateStatus(ctx) {
    try {
      const { id } = ctx.params;
      const { stato } = ctx.request.body;
      
      console.log(`Tentativo di aggiornare lo stato della candidatura ${id} a ${stato}`);
      console.log('Utente autenticato:', ctx.state?.user?.id || 'Nessun utente autenticato');
      console.log('Dettagli richiesta:', {
        headers: ctx.request.headers,
        body: ctx.request.body,
        params: ctx.params
      });
      
      if (!id) {
        return ctx.badRequest('ID candidatura mancante');
      }
      
      if (!stato) {
        return ctx.badRequest('Stato mancante');
      }
      
      // Trova la candidatura
      console.log(`Ricerca candidatura con ID: ${id}`);
      const candidatura = await strapi.entityService.findOne('api::candidatura.candidatura', id);
      
      if (!candidatura) {
        console.log(`Candidatura con ID ${id} non trovata`);
        return ctx.notFound('Candidatura non trovata');
      }
      
      console.log(`Candidatura trovata:`, candidatura);
      
      try {
        // Aggiorna lo stato
        console.log(`Aggiornamento stato a: ${stato}`);
        const updatedCandidatura = await strapi.entityService.update('api::candidatura.candidatura', id, {
          data: {
            stato: stato
          }
        });
        
        console.log(`Candidatura aggiornata con successo:`, updatedCandidatura);
        return updatedCandidatura;
      } catch (updateErr) {
        console.error(`Errore durante l'aggiornamento della candidatura:`, updateErr);
        
        // Verifica se è un errore di permessi
        if (updateErr.message && updateErr.message.includes('permission')) {
          return ctx.forbidden('Non hai i permessi necessari per aggiornare questa candidatura');
        }
        
        throw updateErr;
      }
    } catch (err) {
      console.error('Errore nell\'aggiornamento dello stato:', err);
      return ctx.badRequest(`Errore: ${err.message}`);
    }
  },

  // Metodo personalizzato per aggiornare il feedback di una candidatura
  async updateFeedback(ctx) {
    try {
      const { id } = ctx.params;
      const { feedback } = ctx.request.body;
      
      console.log(`Tentativo di aggiornare il feedback della candidatura ${id}`);
      console.log('Utente autenticato:', ctx.state?.user?.id || 'Nessun utente autenticato');
      
      if (!id) {
        return ctx.badRequest('ID candidatura mancante');
      }
      
      if (!feedback) {
        return ctx.badRequest('Feedback mancante');
      }
      
      // Trova la candidatura
      console.log(`Ricerca candidatura con ID: ${id}`);
      const candidatura = await strapi.entityService.findOne('api::candidatura.candidatura', id);
      
      if (!candidatura) {
        console.log(`Candidatura con ID ${id} non trovata`);
        return ctx.notFound('Candidatura non trovata');
      }
      
      console.log(`Candidatura trovata:`, candidatura);
      
      try {
        // Aggiorna il feedback
        console.log(`Aggiornamento feedback`);
        const updatedCandidatura = await strapi.entityService.update('api::candidatura.candidatura', id, {
          data: {
            feedback: feedback
          }
        });
        
        console.log(`Candidatura aggiornata con successo:`, updatedCandidatura);
        return updatedCandidatura;
      } catch (updateErr) {
        console.error(`Errore durante l'aggiornamento del feedback:`, updateErr);
        
        // Verifica se è un errore di permessi
        if (updateErr.message && updateErr.message.includes('permission')) {
          return ctx.forbidden('Non hai i permessi necessari per aggiornare questa candidatura');
        }
        
        throw updateErr;
      }
    } catch (err) {
      console.error('Errore nell\'aggiornamento del feedback:', err);
      return ctx.badRequest(`Errore: ${err.message}`);
    }
  }
}));
