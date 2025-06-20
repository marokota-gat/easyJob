/**
 * profilo-candidato controller
 */

import { factories } from '@strapi/strapi'

// Definizione delle interfacce per TypeScript
interface User {
  id: number;
  [key: string]: any;
}

interface ProfiloCandidato {
  id: number;
  attributes?: any;
  user?: User;
  [key: string]: any;
}

interface QueryFilters {
  [key: string]: any;
}

interface StrapiQuery {
  filters?: QueryFilters;
  populate?: string[] | string | any;
  [key: string]: any;
}

export default factories.createCoreController('api::profilo-candidato.profilo-candidato', ({ strapi }) => ({
  async create(ctx) {
    try {
      // Ottieni l'ID dell'utente dal token JWT
      const userId = ctx.state.user.id;
      console.log('Create Candidato - User ID from JWT:', userId);
      console.log('Create Candidato - Request body:', JSON.stringify(ctx.request.body));

      // Verifica se esiste già un profilo per questo utente
      // Utilizziamo findMany senza filtri e poi filtriamo manualmente
      const allProfiles = await strapi.entityService.findMany('api::profilo-candidato.profilo-candidato', {
        populate: ['user']
      }) as ProfiloCandidato[];

      console.log('Create Candidato - All profiles:', allProfiles);
      
      // Filtriamo manualmente per trovare il profilo dell'utente
      const existingProfile = allProfiles.find(profile => 
        profile.user && profile.user.id === userId
      );

      // Se esiste già un profilo, restituiscilo invece di crearne uno nuovo
      if (existingProfile) {
        console.log('Create Candidato - Profile already exists, returning existing profile');
        return { data: existingProfile };
      }

      // Crea una copia dei dati originali
      const { data } = ctx.request.body;

      // Assicurati che i dati includano l'ID utente
      if (!data.user) {
        data.user = userId;
      }

      console.log('Create Candidato - Final data to save:', data);

      // Crea il profilo con la relazione utente
      const entity = await strapi.entityService.create('api::profilo-candidato.profilo-candidato', {
        data: data
      });

      console.log('Create Candidato - Created entity:', entity);

      // Aggiorna il profilo con la relazione utente per assicurarsi che sia collegato correttamente
      const updatedEntity = await strapi.entityService.update('api::profilo-candidato.profilo-candidato', entity.id, {
        data: {
          user: userId
        },
        populate: ['user']
      });

      console.log('Create Candidato - Updated entity with user relation:', updatedEntity);

      // Restituisci il risultato
      return { data: updatedEntity };
    } catch (err) {
      console.error('Error in profilo-candidato controller (create):', err);
      return ctx.badRequest(`${err.name}: ${err.message}`);
    }
  },

  // Override del metodo update per gestire correttamente l'aggiornamento
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;
      
      console.log('Update Candidato - Profile ID:', id);
      console.log('Update Candidato - User ID from JWT:', userId);

      // Verifica che il profilo appartenga all'utente autenticato
      const existingProfile = await strapi.entityService.findOne('api::profilo-candidato.profilo-candidato', id, {
        populate: ['user']
      }) as any;

      if (!existingProfile) {
        return ctx.notFound('Profilo non trovato');
      }

      if (existingProfile.user && existingProfile.user.id !== userId) {
        return ctx.forbidden('Non hai i permessi per modificare questo profilo');
      }

      // Estrai i dati dal FormData
      let updateData: any = {};
      
      if (ctx.request.body.data) {
        if (typeof ctx.request.body.data === 'string') {
          try {
            updateData = JSON.parse(ctx.request.body.data);
          } catch (parseError) {
            console.error('Update Candidato - Failed to parse data:', parseError);
            return ctx.badRequest('Invalid JSON data');
          }
        } else {
          updateData = ctx.request.body.data;
        }
      }

      // Assicurati che l'utente rimanga collegato
      updateData.user = userId;

      console.log('Update Candidato - Update data:', updateData);
      console.log('Update Candidato - Files in request:', ctx.request.files ? Object.keys(ctx.request.files) : 'No files');

      // Aggiorna prima i dati del profilo
      let updatedEntity = await strapi.entityService.update('api::profilo-candidato.profilo-candidato', id, {
        data: updateData,
        populate: ['user', 'immagineProfilo']
      }) as any;

      // Se ci sono file, gestiscili separatamente
      if (ctx.request.files && ctx.request.files['files.immagineProfilo']) {
        console.log('Update Candidato - Processing image file');
        
        try {
          // Carica il file usando il servizio upload di Strapi
          const uploadedFiles = await strapi.plugins.upload.services.upload.upload({
            data: {
              refId: id,
              ref: 'api::profilo-candidato.profilo-candidato',
              field: 'immagineProfilo'
            },
            files: ctx.request.files['files.immagineProfilo']
          });

          console.log('Update Candidato - File uploaded successfully');

          // Ricarica l'entità per ottenere i dati aggiornati con l'immagine
          updatedEntity = await strapi.entityService.findOne('api::profilo-candidato.profilo-candidato', id, {
            populate: ['user', 'immagineProfilo']
          }) as any;

        } catch (uploadError) {
          console.error('Update Candidato - File upload error:', uploadError);
          // Continua anche se l'upload fallisce
        }
      }

      console.log('Update Candidato - Final result:', updatedEntity);

      // Formatta la risposta nel formato standard di Strapi
      const { user, ...attributes } = updatedEntity;
      
      return {
        data: {
          id: updatedEntity.id,
          attributes: {
            ...attributes,
            user: user ? {
              data: {
                id: user.id,
                attributes: {
                  ...user,
                  id: undefined
                }
              }
            } : null
          }
        }
      };
    } catch (err) {
      console.error('Error in profilo-candidato controller (update):', err);
      return ctx.badRequest(`${err.name}: ${err.message}`);
    }
  },

  // Override del metodo find per gestire meglio gli errori
  async find(ctx) {
    try {
      // Ottieni l'ID dell'utente dal token JWT se presente
      const userId = ctx.state?.user?.id;
      
      // Casting della query per TypeScript
      const query = { ...ctx.query } as StrapiQuery;
      
      // Rimuoviamo il filtro user che causa problemi
      if (query.filters && query.filters.user) {
        delete query.filters.user;
      }
      
      // Assicurati che user sia sempre popolato
      if (!query.populate) {
        query.populate = '*';
      }

      // Usiamo l'entityService invece di super.find per evitare errori
      const entries = await strapi.entityService.findMany('api::profilo-candidato.profilo-candidato', {
        ...query,
        populate: '*'
      }) as any[];
      
      // Se abbiamo un userId, filtriamo manualmente i risultati
      let filteredData = entries || [];
      if (userId) {
        filteredData = filteredData.filter(item => {
          return item && 
                 item.user && 
                 typeof item.user === 'object' && 
                 item.user.id === userId;
        });
      }
      
      // Formatta la risposta nello stesso formato di super.find
      return {
        data: filteredData.map(item => {
          // Estrai user dall'item per gestirlo separatamente
          const { user, ...attributes } = item;
          
          return {
            id: item.id,
            attributes: {
              ...attributes,
              // Formatta user nel formato corretto per Strapi
              user: user ? {
                data: {
                  id: user.id,
                  attributes: {
                    ...user,
                    id: undefined // Rimuovi l'id duplicato dagli attributi
                  }
                }
              } : null
            }
          };
        }),
        meta: {
          pagination: {
            page: 1,
            pageSize: filteredData.length,
            pageCount: 1,
            total: filteredData.length
          }
        }
      };
    } catch (err) {
      console.error('Error in profilo-candidato controller (find):', err);
      // Rispondere con 200 e array vuoto invece di errore 500
      return {
        data: [],
        meta: {
          pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 }
        },
        error: `${err.name}: ${err.message}`
      };
    }
  },

  // Override del metodo findOne per gestire meglio gli errori
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      console.log('FindOne Candidato - ID:', id);
      
      // Casting della query per TypeScript
      const query = ctx.query as StrapiQuery;
      
      // Assicurati che user sia sempre popolato
      if (!query.populate) {
        query.populate = ['user'];
      } else if (typeof query.populate === 'object') {
        // Verifica se populate è un array
        if (Array.isArray(query.populate) && !query.populate.includes('user')) {
          query.populate.push('user');
        }
        // Se non è un array ma è un oggetto, gestiamo diversamente
        else if (!Array.isArray(query.populate) && query.populate !== 'user') {
          query.populate = [query.populate, 'user'];
        }
      }
      
      const { data, meta } = await super.findOne(ctx);
      return { data, meta };
    } catch (err) {
      console.error('Error in profilo-candidato controller (findOne):', err);
      // Rispondere con 200 e oggetto vuoto invece di errore 500
      return {
        data: null,
        meta: {},
        error: `${err.name}: ${err.message}`
      };
    }
  }
})); 