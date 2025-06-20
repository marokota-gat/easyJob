import React, { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import OffertePage from './pages/OffertePage';
import CandidaturePage from './pages/CandidaturePage';
import MainLayout from './components/Layout/MainLayout';
import ProfilePage from './pages/ProfilePage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CompletaProfiloCandidato from './pages/CompletaProfiloCandidato';
import CompletaProfiloRecruiter from './pages/CompletaProfiloRecruiter';
import PubblicaOffertaPage from './pages/PubblicaOffertaPage';
import ModificaProfilo from './pages/ModificaProfilo';
import axios from 'axios';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

// Componente per verificare se il profilo è completo
const ProfileCheck = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const navigate = useNavigate();
  const jwt = localStorage.getItem('jwt');
  const userStr = localStorage.getItem('user');
  const profileCompleted = localStorage.getItem('profileCompleted');
  
  let user = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('ProfileCheck - Errore nel parsing dei dati utente', e);
    }
  }

  useEffect(() => {
    // Limitiamo il numero di tentativi per evitare loop infiniti
    if (checkAttempts > 3) {
      console.log('ProfileCheck - Troppi tentativi di verifica del profilo, interrompo il processo');
      setIsLoading(false);
      return;
    }
    
    const checkProfileExists = async () => {
      setCheckAttempts(prevAttempts => prevAttempts + 1);
      
      if (!jwt || !user || !user.id) {
        console.log('ProfileCheck - Dati utente mancanti, reindirizzamento al login');
        window.location.replace('/login');
        return;
      }

      console.log('ProfileCheck - Utente:', user);
      console.log('ProfileCheck - Ruolo:', user.role);
      console.log('ProfileCheck - ProfileCompleted attuale:', profileCompleted);
      
      // Se il profilo è già stato confermato come completo, non facciamo la verifica API
      if (profileCompleted === 'true') {
        console.log('ProfileCheck - Profilo già verificato come completo nel localStorage');
        setHasProfile(true);
        setIsLoading(false);
        return;
      }

      try {
        // Determina quale endpoint utilizzare in base al ruolo
        const userRole = user.role ? user.role.toLowerCase() : '';
        console.log('ProfileCheck - Ruolo normalizzato:', userRole);
        
        const profiloEndpoint = userRole === 'recruiter' || userRole === 'authrec' 
          ? 'profilo-recruiters'
          : 'profilo-candidatos';
        
        console.log(`ProfileCheck - Verifico l'esistenza di un profilo in: ${profiloEndpoint} per l'utente ID: ${user.id}`);
        
        // Otteniamo solo il profilo dell'utente specifico usando i filtri
        const userId = user.id;
        const url = `http://localhost:1337/api/${profiloEndpoint}?populate=*&filters[user][id][$eq]=${userId}`;
        console.log('ProfileCheck - URL richiesta:', url);
        
        const response = await axios.get(
          url,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
        
        console.log('ProfileCheck - Risposta profilo completa:', response);
        console.log('ProfileCheck - Dati risposta:', response.data);
        
        // Verifica se ci sono dati nella risposta
        if (response.data && 
            response.data.data && 
            Array.isArray(response.data.data) && 
            response.data.data.length > 0) {
          
          console.log('ProfileCheck - Profilo trovato:', response.data.data[0]);
          
          // Salva i dati del profilo nel localStorage
          const profilo = response.data.data[0].attributes;
          if (profilo.nome) localStorage.setItem('userNome', profilo.nome);
          if (profilo.cognome) localStorage.setItem('userCognome', profilo.cognome);
          if (profilo.nomeAzienda) localStorage.setItem('userNomeAzienda', profilo.nomeAzienda);
          
          setHasProfile(true);
          localStorage.setItem('profileCompleted', 'true');
          setIsLoading(false);
        } else {
          console.log('ProfileCheck - Nessun profilo trovato');
          setHasProfile(false);
          localStorage.setItem('profileCompleted', 'false');
          
          // Controlliamo se siamo già nella pagina di completamento profilo per evitare loop
          const currentPath = window.location.pathname;
          const isAlreadyOnCompletaProfiloPage = 
            currentPath.includes('completa-profilo-recruiter') || 
            currentPath.includes('completa-profilo-candidato');
          
          if (!isAlreadyOnCompletaProfiloPage) {
            console.log('ProfileCheck - Reindirizzamento alla pagina di completamento profilo');
            // Reindirizza alla pagina appropriata in base al ruolo
            if (userRole === 'recruiter' || userRole === 'authrec') {
              window.location.replace('/completa-profilo-recruiter');
            } else {
              window.location.replace('/completa-profilo-candidato');
            }
          } else {
            console.log('ProfileCheck - Già nella pagina di completamento profilo, non reindirizzo');
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('ProfileCheck - Errore nella verifica del profilo:', error);
        console.error('ProfileCheck - Dettagli errore:', error.response ? error.response.data : 'Nessuna risposta');
        
        // In caso di errore, se abbiamo già un'indicazione che il profilo è completo, usiamo quella
        if (profileCompleted === 'true') {
          setHasProfile(true);
        } else {
          // Controlliamo se siamo già nella pagina di completamento profilo per evitare loop
          const currentPath = window.location.pathname;
          const isAlreadyOnCompletaProfiloPage = 
            currentPath.includes('completa-profilo-recruiter') || 
            currentPath.includes('completa-profilo-candidato');
          
          if (!isAlreadyOnCompletaProfiloPage) {
            // Reindirizza alla pagina di completamento profilo in base al ruolo
            const userRole = user.role ? user.role.toLowerCase() : '';
            if (userRole === 'recruiter' || userRole === 'authrec') {
              window.location.replace('/completa-profilo-recruiter');
            } else {
              window.location.replace('/completa-profilo-candidato');
            }
          } else {
            console.log('ProfileCheck - Già nella pagina di completamento profilo, non reindirizzo');
            setIsLoading(false);
          }
        }
      } finally {
        if (isLoading) {
          setIsLoading(false);
        }
      }
    };

    checkProfileExists();
  }, [jwt, user, navigate, profileCompleted, checkAttempts]);

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return hasProfile ? children : null;
};

// Componente per proteggere le rotte
const ProtectedRoute = ({ children, requiredRole }) => {
  const jwt = localStorage.getItem('jwt');
  const userStr = localStorage.getItem('user');
  const profileCompleted = localStorage.getItem('profileCompleted');
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const navigate = useNavigate();
  
  let user = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error(
        'ProtectedRoute - Errore nel parsing dei dati utente',
        e
      );
    }
  }

  // Verifica se il profilo è completo prima di mostrare le pagine protette
  useEffect(() => {
    // Limitiamo il numero di tentativi per evitare loop infiniti
    if (checkAttempts > 3) {
      console.log('ProtectedRoute - Troppi tentativi di verifica del profilo, interrompo il processo');
      return;
    }

    // Controlliamo se siamo già nella pagina di completamento profilo per evitare richieste inutili
    const currentPath = window.location.pathname;
    const isAlreadyOnCompletaProfiloPage = 
      currentPath.includes('completa-profilo-recruiter') || 
      currentPath.includes('completa-profilo-candidato');
    
    if (isAlreadyOnCompletaProfiloPage) {
      console.log('ProtectedRoute - Già nella pagina di completamento profilo, non verifico il profilo');
      return;
    }

    // Se non stiamo già verificando e non abbiamo ancora verificato il profilo
    if (!isCheckingProfile && profileCompleted !== 'true' && user && user.id) {
      setIsCheckingProfile(true);
      setCheckAttempts(prevAttempts => prevAttempts + 1);
      
      console.log('ProtectedRoute - Inizio verifica profilo');
      console.log('ProtectedRoute - User:', user);
      console.log('ProtectedRoute - ProfileCompleted attuale:', profileCompleted);
      
      const checkProfile = async () => {
        try {
          // Determina quale endpoint utilizzare in base al ruolo
          const userRole = user.role ? user.role.toLowerCase() : '';
          const profiloEndpoint = userRole === 'recruiter' || userRole === 'authrec' 
            ? 'profilo-recruiters'
            : 'profilo-candidatos';
            
          // Otteniamo il profilo dell'utente specifico usando i filtri
          const userId = user.id;
          const url = `http://localhost:1337/api/${profiloEndpoint}?populate=*&filters[user][id][$eq]=${userId}`;
          console.log('ProtectedRoute - URL richiesta:', url);
          
          const response = await axios.get(
            url,
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            }
          );
          
          console.log('ProtectedRoute - Risposta profilo completa:', response);
          console.log('ProtectedRoute - Dati risposta:', response.data);
          
          // Verifica se ci sono dati nella risposta
          if (response.data && 
              response.data.data && 
              Array.isArray(response.data.data) &&
              response.data.data.length > 0) {
            
            console.log('ProtectedRoute - Profilo trovato per l\'utente:', response.data.data[0]);
            
            // Salva i dati del profilo nel localStorage
            const profilo = response.data.data[0].attributes;
            if (profilo.nome) localStorage.setItem('userNome', profilo.nome);
            if (profilo.cognome) localStorage.setItem('userCognome', profilo.cognome);
            if (profilo.nomeAzienda) localStorage.setItem('userNomeAzienda', profilo.nomeAzienda);
            
            localStorage.setItem('profileCompleted', 'true');
            setIsCheckingProfile(false);
            return; // Importante: interrompe l'esecuzione se il profilo è trovato
          } 
          
          // Se arriviamo qui, non è stato trovato alcun profilo
          console.log('ProtectedRoute - Nessun profilo trovato per questo utente, reindirizzamento...');
          localStorage.setItem('profileCompleted', 'false');
          
          // Controlliamo se siamo già nella pagina di completamento profilo per evitare loop
          const currentPath = window.location.pathname;
          const isAlreadyOnCompletaProfiloPage = 
            currentPath.includes('completa-profilo-recruiter') || 
            currentPath.includes('completa-profilo-candidato');
          
          if (isAlreadyOnCompletaProfiloPage) {
            console.log('ProtectedRoute - Già nella pagina di completamento profilo, non reindirizzo');
            setIsCheckingProfile(false);
            return; // Evitiamo il reindirizzamento se siamo già nella pagina giusta
          }
          
          // Forza il reindirizzamento con window.location invece di navigate
          if (userRole === 'candidato' || userRole === 'authuser') {
            console.log('ProtectedRoute - Reindirizzamento a completa-profilo-candidato');
            window.location.replace('/completa-profilo-candidato');
          } else if (userRole === 'recruiter' || userRole === 'authrec') {
            console.log('ProtectedRoute - Reindirizzamento a completa-profilo-recruiter');
            window.location.replace('/completa-profilo-recruiter');
          } else {
            console.log('ProtectedRoute - Ruolo non riconosciuto, reindirizzamento al login');
            window.location.replace('/login');
          }
          return; // Importante: interrompe l'esecuzione
        } catch (error) {
          console.error('ProtectedRoute - Errore nella verifica del profilo:', error);
          console.error('ProtectedRoute - Dettagli errore:', error.response ? error.response.data : 'Nessuna risposta');
          
          // In caso di errore, reindirizza alla pagina di completamento profilo
          localStorage.setItem('profileCompleted', 'false');
          
          // Controlliamo se siamo già nella pagina di completamento profilo per evitare loop
          const currentPath = window.location.pathname;
          const isAlreadyOnCompletaProfiloPage = 
            currentPath.includes('completa-profilo-recruiter') || 
            currentPath.includes('completa-profilo-candidato');
          
          if (isAlreadyOnCompletaProfiloPage) {
            console.log('ProtectedRoute - Già nella pagina di completamento profilo, non reindirizzo');
            setIsCheckingProfile(false);
            return; // Evitiamo il reindirizzamento se siamo già nella pagina giusta
          }
          
          // Forza il reindirizzamento con window.location invece di navigate
          const userRole = user.role ? user.role.toLowerCase() : '';
          if (userRole === 'candidato' || userRole === 'authuser') {
            console.log('ProtectedRoute - Reindirizzamento a completa-profilo-candidato dopo errore');
            window.location.replace('/completa-profilo-candidato');
          } else if (userRole === 'recruiter' || userRole === 'authrec') {
            console.log('ProtectedRoute - Reindirizzamento a completa-profilo-recruiter dopo errore');
            window.location.replace('/completa-profilo-recruiter');
          } else {
            console.log('ProtectedRoute - Ruolo non riconosciuto dopo errore, reindirizzamento al login');
            window.location.replace('/login');
          }
          return; // Importante: interrompe l'esecuzione
        } finally {
          // Assicuriamoci di resettare lo stato di verifica
          setIsCheckingProfile(false);
        }
      };
      
      checkProfile();
    }
  }, [jwt, user, navigate, profileCompleted, isCheckingProfile, checkAttempts]);

  // Se stiamo verificando il profilo, mostra un loader
  if (isCheckingProfile) {
    return <div>Verifica profilo in corso...</div>;
  }

  // Se non c'è JWT, reindirizza al login
  if (!jwt) {
    console.log(
      'ProtectedRoute - Nessun JWT trovato, reindirizzamento al login'
    );
    return <Navigate to="/login" />;
  }

  // Se è richiesto un ruolo specifico e l'utente non ha quel ruolo, reindirizza
  if (
    requiredRole &&
    user?.role &&
    user.role.toLowerCase() !== requiredRole.toLowerCase()
  ) {
    console.log(
      `ProtectedRoute - Ruolo richiesto: ${requiredRole}, ruolo attuale: ${user.role}`
    );

    // Reindirizza in base al ruolo attuale dell'utente
    if (user.role.toLowerCase() === 'candidato') {
      return <Navigate to="/dashboard/offerte" />;
    } else if (user.role.toLowerCase() === 'recruiter') {
      return <Navigate to="/dashboard/offerte" />;
    } else {
      return <Navigate to="/login" />;
    }
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rimanda alla pagina login */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        <Route path="/login" element={<LoginPage />} />

        {/* Pagine di completamento profilo */}
        <Route
          path="/completa-profilo-candidato"
          element={
            <ProtectedRoute>
              <CompletaProfiloCandidato />
            </ProtectedRoute>
          }
        />
        <Route
          path="/completa-profilo-recruiter"
          element={
            <ProtectedRoute>
              <CompletaProfiloRecruiter />
            </ProtectedRoute>
          }
        />

        {/* Pagine protette con verifica profilo */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProfileCheck>
                <MainLayout />
              </ProfileCheck>
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/dashboard/offerte" />}
          />
          <Route path="feed" element={<FeedPage />} />
          <Route
            path="offerte"
            element={
              <ProtectedRoute>
                <OffertePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="candidature"
            element={
              <ProtectedRoute requiredRole="candidato">
                <CandidaturePage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="recruiter"
            element={
              <ProtectedRoute requiredRole="recruiter">
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="pubblica-offerta"
            element={
              <ProtectedRoute requiredRole="recruiter">
                <PubblicaOffertaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="modifica-profilo"
            element={
              <ProtectedRoute>
                <ModificaProfilo />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Rimanda alla pagina login se la pagina non esiste */}
        <Route
          path="*"
          element={<Navigate to="/login" />}
        />

      </Routes>
    </BrowserRouter>
  );
}
export default App;
