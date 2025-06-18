import React, { useEffect } from 'react';
import './LoginPage.css';
import AuthForm from '../components/AuthForm/AuthForm';

export default function LoginPage() {
  useEffect(() => {
    // Pulisci completamente il localStorage per evitare problemi con dati precedenti
    console.log('Pulizia del localStorage nella pagina di login');
    localStorage.clear();
    
    // Assicuriamoci che il flag profileCompleted sia rimosso
    localStorage.removeItem('profileCompleted');
    localStorage.removeItem('user');
    localStorage.removeItem('jwt');
    localStorage.removeItem('userId');
  }, []);

  return (
    <div className="login-page">
      <div className="leftside">
        <h1>
          Benvenuto su{' '}
          <span className="hightlited">easyJob</span>!
        </h1>
        <div className="logo">
          <img
            src="/partnership.png"
            alt="Logo"
            className="img"
          />
        </div>
        <div className="description">
          <p>
            Trova il tuo{' '}
            <span className="hightlited">
              lavoro ideale
            </span>{' '}
            in pochi click!
          </p>
          <img
            src="/lavoroSemplice.png"
            alt="Lavoro semplice"
            className="lavoro-semplice"
          />
        </div>
      </div>
      <div className="rightside">
        <div className="form-container">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
