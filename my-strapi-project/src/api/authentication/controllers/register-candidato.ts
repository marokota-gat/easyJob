import { createUser } from './utils/create-user';

export default {
  async register(ctx) {
    return await createUser(ctx, 'Candidato');
  },
};
