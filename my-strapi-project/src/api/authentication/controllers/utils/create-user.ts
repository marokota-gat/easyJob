'use strict';
import bcrypt from 'bcryptjs';

export const createUser = async (ctx, roleName) => {
  const { email, userPassword } = ctx.request.body;

  if (!email || !userPassword) {
    return ctx.badRequest('Missing email or password');
  }

  const existingUser = await strapi
    .query('plugin::users-permissions.user')
    .findOne({ where: { email } });

  if (existingUser) {
    console.log('⚠️ Email già esistente:', email);
    return ctx.badRequest('Email already taken');
  }

  const role = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { name: roleName } });

  if (!role) {
    return ctx.badRequest('Invalid role');
  }

  const hashedPassword = bcrypt.hashSync(userPassword, 10);

  const newUser = await strapi
    .query('plugin::users-permissions.user')
    .create({
      data: {
        email,
        userPassword: hashedPassword,
        role: role.id,
        confirmed: true,
      },
    });

  const jwt = await strapi
    .plugin('users-permissions')
    .service('jwt')
    .issue({ id: newUser.id });

  ctx.send({
    jwt,
    user: {
      id: newUser.id,
      email: newUser.email,
      role: role.name,
    },
  });
};
