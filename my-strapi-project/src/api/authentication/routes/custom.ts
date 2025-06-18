export default {
    routes: [
        {
            method: 'POST',
            path: '/auth-candidato/register',
            handler: 'register-candidato.register',
            config: { 
                auth: false,
                middlewares: []
            },
        },
        {
            method: 'POST',
            path: '/auth-recruiter/register',
            handler: 'register-recruiter.register',
            config: { 
                auth: false,
                middlewares: []
            },
        },
        {
            method: 'POST',
            path: '/auth-candidato/login',
            handler: 'login-candidato.login',
            config: { 
                auth: false,
                middlewares: []
            },
        },
        {
            method: 'POST',
            path: '/auth-recruiter/login',
            handler: 'login-recruiter.login',
            config: { 
                auth: false,
                middlewares: []
            },
        },
    ],
};