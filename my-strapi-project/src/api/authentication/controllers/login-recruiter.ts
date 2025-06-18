import { loginUser } from './utils/login-user';

export default {
  async login(ctx) {
    await loginUser(ctx, 'Recruiter');
  },
};
