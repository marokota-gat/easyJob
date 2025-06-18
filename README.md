# EasyJob Platform

A job posting and application platform built with Strapi and React.

## Project Structure

- `frontend/`: React frontend application
- `my-strapi-project/`: Strapi backend application

## Quick Start

You can start both the frontend and backend with a single command:

```bash
node start-servers.js
```

### Manual Start

Alternatively, you can start each service manually:

1. Start the Strapi backend:

   ```bash
   cd my-strapi-project
   npm run develop
   ```

2. Start the React frontend in a new terminal:
   ```bash
   cd frontend
   npm start
   ```

## Troubleshooting API Errors

If you encounter 404 or 500 errors when using the recruiter dashboard, follow these steps:

### 1. Fix Permissions

Run the permission fix script to ensure recruiter users have proper access to create job offers:

```bash
cd my-strapi-project
node scripts/fix-permissions.js
```

### 2. Verify Strapi is Running

Make sure Strapi is running on port 1337. You should be able to access the admin panel at:

```
http://localhost:1337/admin
```

### 3. Check User Role

Ensure your user account has the "recruiter" role assigned. You can check this in the Strapi admin panel:

1. Go to Settings → Users & Permissions
2. Click on "Roles"
3. Verify that the "Authenticated" role has permissions for the Offerta collection
4. Assign your user to the recruiter role

### 4. API Endpoint Issues

If you still see 404 errors, check that:

- The API endpoints match between frontend and backend
- The frontend proxy is correctly configured to http://localhost:1337
- Your authentication token is valid

## Development

### Updating the Frontend

The frontend application is built with React and uses axios for API calls.

### Updating the Backend

The backend is built with Strapi. You can modify the content types and API endpoints in the Strapi admin panel.

**Autori**:

- Yaroslav Makhota
- Giuseppe Moscatelli
- Marco Tropiano

## 📌 Descrizione del Progetto

_easyJob_ è una piattaforma digitale di recruiting progettata per facilitare l'incontro tra domanda e offerta di lavoro, migliorando l'esperienza di ricerca per candidati e aziende. Il progetto nasce nell'ambito del corso di **Ingegneria del Software (a.a. 2024-2025)** e si propone come un'alternativa moderna e accessibile ai grandi portali tradizionali.

## 🧱 Architettura e Stack Tecnologico

- **Frontend**: React.js
- **Backend**: Strapi (Headless CMS)
- **Database**: PostgreSQL
- **Architettura**: client-server, RESTful API, componenti modulari
