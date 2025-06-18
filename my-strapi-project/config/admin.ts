export default ({ env }) => ({
  auth: {
    secret: env(
      'ADMIN_JWT_SECRET',
      'E7E9eHhJyS9mrUaW4AJygQ=='
    ),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'uR7M8vscq7cho1Pb636joQ=='),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
