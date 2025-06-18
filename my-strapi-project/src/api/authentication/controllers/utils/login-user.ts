'use strict';
import { errors } from '@strapi/utils';
import bcrypt from 'bcryptjs';

export const loginUser = async (ctx, roleName) => {
  const { email, userPassword } = ctx.request.body;

  if (!email || !userPassword) {
    return ctx.badRequest('Missing email or password');
  }

  const user = await strapi
    .query('plugin::users-permissions.user')
    .findOne({ where: { email } });

  console.log('👉 user.userPassword:', user?.userPassword);

  const savedPassword =
    typeof user?.userPassword === 'string'
      ? user.userPassword
      : user?.userPassword?.value || '';

  if (!user || !(await bcrypt.compare(userPassword, savedPassword))) {
    throw new errors.ValidationError('Invalid credentials');
  }

  const role = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { name: roleName } });

  if (!role) {
    return ctx.badRequest('Invalid role');
  }

  const link = await strapi.db.query('up_users_role_lnk').findOne({
    where: { user_id: user.id },
  });

  const userRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { id: link?.role_id },
  });

  if (userRole?.name !== roleName) {
    throw new errors.ValidationError(`Not a ${roleName}`);
  }

  const token = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

  ctx.send({
    jwt: token,
    user: {
      id: user.id,
      email: user.email,
      role: userRole?.name,
      Nome: user.Nome,
      Cognome: user.Cognome,
      nomeAzienda: user.nomeAzienda
    },
  });
};
