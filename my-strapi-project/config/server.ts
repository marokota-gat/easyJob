export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', [
      'mySuperSecretKey1',
      'mySuperSecretKey2',
    ]),
  },
  cors: {
    origin: '*', // Permette tutte le origini
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: '*', // Permette tutti gli header
    credentials: true, // Permette l'invio di cookie se necessario
  },
});
