import React from 'react';
import { useState } from 'react';
import './AuthForm.css';
import Button from '../UI/Button';
import InputField from '../UI/InputField';
import IconComponent from '../UI/IconComponent';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AuthForm() {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidato');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [error, setError] = useState('');
  const [detailedError, setDetailedError] = useState('');
  const [loading, setLoading] = useState(false);
  // const { login, registerUser } = useAuth();
  const backgroundbButtonColor = 'rgb(20,90,205)'; // blue
  const backgroundAccessColor = '#eb9410'; // orange

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDetailedError('');

    if (!email || !password) {
      setError('Email e password sono obbligatorie');
      setLoading(false);
      return;
    }

    try {
      console.log(
        `Tentativo di ${
          isLogin ? 'login' : 'registrazione'
        } come ${role} con email: ${email}`
      );

      if (isLogin) {
        // Login con endpoint dinamico in base al ruolo
        const endpoint =
          role === 'recruiter'
            ? 'auth-recruiter/login'
            : 'auth-candidato/login';

        console.log(`Endpoint utilizzato: ${endpoint}`);

        const res = await axios.post(
          `http://localhost:1337/api/${endpoint}`,
          {
            email,
            userPassword: password,
          }
        );

        console.log('Risposta dal server:', res.data);

        if (!res.data.jwt) {
          setError('Token JWT mancante nella risposta');
          setDetailedError(JSON.stringify(res.data));
          setLoading(false);
          return;
        }

        localStorage.clear();
        localStorage.setItem('jwt', res.data.jwt);
        localStorage.setItem(
          'user',
          JSON.stringify(res.data.user)
        );
        localStorage.setItem('userId', res.data.user.id);
        
        // Verifica se l'utente ha già un profilo
        try {
          const token = res.data.jwt;
          const userId = res.data.user.id;
          const userRole = res.data.user.role ? res.data.user.role.toLowerCase() : '';
          
          console.log('Login - Utente ID:', userId);
          console.log('Login - Ruolo utente:', userRole);
          
          // Determina quale endpoint utilizzare in base al ruolo
          const profiloEndpoint = (userRole === 'recruiter' || userRole === 'authrec') 
            ? 'profilo-recruiters'
            : 'profilo-candidatos';
            
          console.log(`Login - Verifico se esiste un profilo in: ${profiloEndpoint} per l'utente ID: ${userId}`);
            
          // Otteniamo solo il profilo dell'utente specifico usando i filtri
          const url = `http://localhost:1337/api/${profiloEndpoint}?populate=*&filters[user][id][$eq]=${userId}`;
          console.log('Login - URL richiesta:', url);
            
          const profiloResponse = await axios.get(
            url,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
            
          console.log('Login - Risposta profilo completa:', profiloResponse);
          console.log('Login - Dati profilo:', profiloResponse.data);
            
          // Verifica se ci sono dati nella risposta
          if (profiloResponse.data && 
              profiloResponse.data.data && 
              Array.isArray(profiloResponse.data.data) &&
              profiloResponse.data.data.length > 0) {
              
            // Abbiamo trovato il profilo dell'utente
            const profiloUtente = profiloResponse.data.data[0];
            console.log('Login - Profilo trovato per l\'utente:', profiloUtente);
            localStorage.setItem('profileCompleted', 'true');
                
            // Salva i dati del profilo nel localStorage
            const profilo = profiloUtente.attributes;
            if (profilo.nome) localStorage.setItem('userNome', profilo.nome);
            if (profilo.cognome) localStorage.setItem('userCognome', profilo.cognome);
            if (profilo.nomeAzienda) localStorage.setItem('userNomeAzienda', profilo.nomeAzienda);
                
            // Reindirizza alla dashboard
            console.log('Login - Reindirizzamento alla dashboard dopo login (profilo trovato)');
            window.location.replace('/dashboard/offerte');
            return;
          } else {
            console.log('Login - Nessun profilo trovato per questo utente');
            localStorage.setItem('profileCompleted', 'false');
              
            // Salva anche nome e cognome se disponibili
            if (res.data.user.Nome) localStorage.setItem('userNome', res.data.user.Nome);
            if (res.data.user.Cognome) localStorage.setItem('userCognome', res.data.user.Cognome);
            if (res.data.user.nomeAzienda) localStorage.setItem('userNomeAzienda', res.data.user.nomeAzienda);
              
            // Reindirizza alla pagina di completamento profilo in base al ruolo
            console.log('Login - Reindirizzamento alla pagina di completamento profilo (profilo non trovato)');
            if (userRole === 'recruiter' || userRole === 'authrec') {
              window.location.replace('/completa-profilo-recruiter');
              return;
            } else {
              window.location.replace('/completa-profilo-candidato');
              return;
            }
          }
        } catch (profiloError) {
          console.error('Login - Errore nel verificare il profilo:', profiloError);
          console.error('Login - Dettagli errore:', profiloError.response ? profiloError.response.data : 'Nessuna risposta');
          // Se non riesco a verificare, assumo che non ci sia un profilo
          localStorage.setItem('profileCompleted', 'false');
            
          // Salva anche nome e cognome se disponibili
          if (res.data.user.Nome) localStorage.setItem('userNome', res.data.user.Nome);
          if (res.data.user.Cognome) localStorage.setItem('userCognome', res.data.user.Cognome);
          if (res.data.user.nomeAzienda) localStorage.setItem('userNomeAzienda', res.data.user.nomeAzienda);
            
          // Reindirizza alla pagina di completamento profilo in base al ruolo
          const userRole = res.data.user.role ? res.data.user.role.toLowerCase() : '';
          if (userRole === 'recruiter' || userRole === 'authrec') {
            window.location.replace('/completa-profilo-recruiter');
            return;
          } else {
            window.location.replace('/completa-profilo-candidato');
            return;
          }
        }
      } else {
        // Registrazione con endpoint dinamico in base al ruolo
        const endpoint =
          role === 'recruiter'
            ? 'auth-recruiter/register'
            : 'auth-candidato/register';

        console.log(
          `Endpoint utilizzato per registrazione: ${endpoint}`
        );

        const res = await axios.post(
          `http://localhost:1337/api/${endpoint}`,
          {
            email,
            userPassword: password,
          }
        );

        console.log(
          'Risposta dal server (registrazione):',
          res.data
        );

        if (!res.data.jwt) {
          setError(
            'Token JWT mancante nella risposta dopo registrazione'
          );
          setDetailedError(JSON.stringify(res.data));
          setLoading(false);
          return;
        }

        localStorage.clear();
        localStorage.setItem('jwt', res.data.jwt);
        localStorage.setItem(
          'user',
          JSON.stringify(res.data.user)
        );
        localStorage.setItem('userId', res.data.user.id);
        
        // Verifica se l'utente ha già un profilo
        try {
          // Prima salva i dati utente nel localStorage
          localStorage.setItem('profileCompleted', 'false');

          // Salva anche nome e cognome se disponibili
          if (res.data.user.Nome) {
            localStorage.setItem(
              'userNome',
              res.data.user.Nome
            );
          }
          if (res.data.user.Cognome) {
            localStorage.setItem(
              'userCognome',
              res.data.user.Cognome
            );
          }
          if (res.data.user.nomeAzienda) {
            localStorage.setItem(
              'userNomeAzienda',
              res.data.user.nomeAzienda
            );
          }

          // Controlliamo se siamo già nella pagina di completamento profilo per evitare loop
          const currentPath = window.location.pathname;
          const isAlreadyOnCompletaProfiloPage = 
            currentPath.includes('completa-profilo-recruiter') || 
            currentPath.includes('completa-profilo-candidato');
          
          if (isAlreadyOnCompletaProfiloPage) {
            console.log('AuthForm - Già nella pagina di completamento profilo, non reindirizzo');
            return; // Evitiamo il reindirizzamento se siamo già nella pagina giusta
          }

          // Reindirizza alla pagina di completamento profilo in base al ruolo
          console.log('Registrazione completata, reindirizzamento alla pagina di compilazione profilo');
          if (role === 'recruiter') {
            window.location.replace(
              '/completa-profilo-recruiter'
            );
            return; // Importante: interrompe l'esecuzione dopo il reindirizzamento
          } else {
            window.location.replace(
              '/completa-profilo-candidato'
            );
            return; // Importante: interrompe l'esecuzione dopo il reindirizzamento
          }
        } catch (profileError) {
          console.error('Errore durante la verifica del profilo:', profileError);
          
          // In caso di errore, procediamo comunque con il reindirizzamento
          if (role === 'recruiter') {
            window.location.replace(
              '/completa-profilo-recruiter'
            );
            return; // Importante: interrompe l'esecuzione dopo il reindirizzamento
          } else {
            window.location.replace(
              '/completa-profilo-candidato'
            );
            return; // Importante: interrompe l'esecuzione dopo il reindirizzamento
          }
        }
      }
    } catch (err) {
      console.error('Errore completo:', err);

      setError("Errore durante l'autenticazione. Riprova.");

      if (err.response) {
        // La richiesta è stata effettuata e il server ha risposto con un codice di stato
        // che esce dall'intervallo 2xx
        console.error('Dati errore:', err.response.data);
        console.error(
          'Status errore:',
          err.response.status
        );
        console.error(
          'Headers errore:',
          err.response.headers
        );

        setDetailedError(
          `Errore ${err.response.status}: ${JSON.stringify(
            err.response.data
          )}`
        );
      } else if (err.request) {
        // La richiesta è stata effettuata ma non è stata ricevuta alcuna risposta
        console.error(
          'Nessuna risposta ricevuta:',
          err.request
        );
        setDetailedError(
          'Nessuna risposta dal server. Verifica la connessione e che il server sia in esecuzione.'
        );
      } else {
        // Si è verificato un errore durante l'impostazione della richiesta
        console.error(
          'Errore di configurazione:',
          err.message
        );
        setDetailedError(
          `Errore di configurazione: ${err.message}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="form-header">
        <Button
          text="Login"
          width="30%"
          height="40px"
          textColor={isLogin ? 'white' : 'black'}
          borderRadius="12px"
          border={
            isLogin ? '1px solid rgb(0, 0, 114)' : 'none'
          }
          fontSize="20px"
          backgroundColor={
            isLogin ? backgroundbButtonColor : 'transparent'
          }
          margin="0px 5px 0px 0px"
          onClick={() => setIsLogin(true)}
          className="custom-button login"
        />
        <Button
          text="Registrati"
          width="35%"
          height="40px"
          textColor={!isLogin ? 'white' : 'black'}
          borderRadius="12px"
          fontSize="20px"
          border={
            !isLogin ? '1px solid rgb(0, 0, 114)' : 'none'
          }
          backgroundColor={
            !isLogin
              ? backgroundbButtonColor
              : 'transparent'
          }
          margin="0px 0px 0px 5px"
          onClick={() => setIsLogin(false)}
          className="custom-button register"
        />
      </div>
      <form onSubmit={handleLogin}>
        <div className="input">
          <h3>Email:</h3>
          <InputField
            placeholder="Inserisci la tua mail"
            width="100%"
            height="40px"
            border="1px solid #bfbfbf"
            borderRadius="12px"
            onChange={(e) => setEmail(e.target.value)}
            icon={<IconComponent iconName="mail-icon" />}
            iconPosition="left"
          />
        </div>

        <div className="input">
          <h3>Password:</h3>
          <InputField
            type={showPassword ? 'text' : 'password'}
            placeholder="Inserisci la password"
            width="100%"
            height="40px"
            border="1px solid #bfbfbf"
            borderRadius="12px"
            onChange={(e) => setPassword(e.target.value)}
            icon={<IconComponent iconName="lock-icon" />}
            iconPosition="left"
            onIconClick={togglePasswordVisibility}
          />
        </div>

        {!isLogin && (
          <div className="input">
            <h3>Conferma password:</h3>
            <InputField
              type={
                showConfirmPassword ? 'text' : 'password'
              }
              placeholder="Conferma la password"
              width="100%"
              height="40px"
              border="1px solid #bfbfbf"
              borderRadius="12px"
              icon={<IconComponent iconName="lock-icon" />}
              iconPosition="left"
              onIconClick={toggleConfirmPasswordVisibility}
            />
          </div>
        )}

        {isLogin ? (
          <h3>Scegli il ruolo con cui accedere</h3>
        ) : (
          <h3>Scegli il ruolo con cui registrarti.</h3>
        )}
        <div className="role">
          <Button
            text="Candidato"
            width="35%"
            height="100%"
            backgroundColor="transparent"
            textColor="black"
            margin="10px"
            textDecoration={
              role === 'candidato' ? 'underline' : ''
            }
            onClick={() => {
              setRole('candidato');
              console.log('tasto candidato cliccato');
            }}
          />
          <Button
            height="100%"
            text="Recruiter"
            width="35%"
            backgroundColor="transparent"
            textColor="black"
            margin="0px 0px 0px 0px"
            textDecoration={
              role === 'recruiter' ? 'underline' : ''
            }
            onClick={() => {
              setRole('recruiter');
              console.log('tasto recruiter cliccato');
            }}
          />
        </div>

        {error && <p className="error-message">{error}</p>}
        {detailedError && (
          <p className="detailed-error">{detailedError}</p>
        )}

        <Button
          text={isLogin ? 'Accedi' : 'Registrati'}
          width={isLogin ? '40%' : '45%'}
          height="40px"
          border="1px solid rgb(209, 136, 1)"
          textColor="black"
          margin="5%"
          backgroundColor={backgroundAccessColor}
          borderRadius="12px"
          fontSize="16px"
          fontWeight="bold"
          type="submit"
          icon={<IconComponent iconName="login-icon" />}
          iconPosition="right"
          disabled={loading}
        />

        {isLogin && (
          <p>
            Hai dimenticato la{' '}
            <a href="#reset-password">password?</a>
          </p>
        )}
      </form>
    </div>
  );
}
