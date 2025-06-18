import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

export default function ProfilePage() {
  const [profileData, setProfileData] = useState({
    nome: '',
    cognome: '',
    dataNascita: '',
    email: '',
    telefono: '',
    dataRegistrazione: '',
    descrizione: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Recupera l'ID del profilo dal localStorage
        const userId = localStorage.getItem('userId'); // o 'profileId' in base a come hai salvato l'ID
        const token = localStorage.getItem('jwt'); // se usi autenticazione JWT
        const user =JSON.parse(localStorage.getItem('user'))
        const userRole = user.role
        
        console.log(userRole)

        if (!userId) {
          throw new Error('ID utente non trovato nel localStorage');
        }

        // Configura la richiesta a Strapi
        const response = await fetch(`http://localhost:1337/api/users/${userId}?populate=*`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Aggiungi il token di autenticazione se necessario
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });

        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const userData = await response.json();
        
        console.log(userData)

        const profileEndpoint = userRole === 'Recruiter' 
          ? '/api/profilo-recruiters' 
          : '/api/profilo-candidatos';

        const profileResponse = await fetch(
          `http://localhost:1337${profileEndpoint}?filters[user][id][$eq]=${userId}&populate=*`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          }
        );

        if (!profileResponse.ok) {
          throw new Error(`Errore nel recupero dati profilo: ${profileResponse.status}`);
        }

        const profileResponseData = await profileResponse.json();
        
        const profileInfo = profileResponseData.data && profileResponseData.data.length > 0 
          ? profileResponseData.data[0].attributes 
          : {};

        console.log(profileInfo)

        // Adatta i dati in base alla struttura del tuo modello Strapi
        setProfileData({
          // Dati da /api/users
          email: userData.email || '',
          dataRegistrazione: userData.createdAt ? formatDate(userData.createdAt) : '',
          
          // Dati da /api/profilo-recruiter o /api/profilo-candidato
          nome: profileInfo.nome || '',
          cognome: profileInfo.cognome || '',
          dataNascita: profileInfo.dataNascita ? formatDate(profileInfo.dataNascita) : '',
          telefono: profileInfo.telefono || '',
          descrizione: profileInfo.descrizione || '',
          
          // Gestione immagine profilo
          immagineProfilo: profileInfo.immagineProfilo?.data?.attributes?.url 
            ? `${process.env.REACT_APP_STRAPI_URL}${profileInfo.immagineProfilo.data.attributes.url}`
            : '/photoProfile.svg',
        });

      } catch (err) {
        console.error('Errore nel recupero dei dati profilo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Funzione per formattare le date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  // Gestione del caricamento
  if (loading) {
    return (
      <div className="container-profile">
        <div className="loading-message">
          <p>Caricamento profilo...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="container-profile">
      <div className="header-profile">
        <img src="/photoProfile.svg" alt="immagine profilo" />
        <div className="header-name">
          <div className="list-attributes">
            <p className="name">
              {profileData.nome} {profileData.cognome}
            </p>
            <p className="attributes-profile">
              {profileData.dataNascita}
            </p>
            <p className="attributes-profile">
              {profileData.email}
            </p>
            <p className="attributes-profile">
              {profileData.telefono}
            </p>
          </div>
        </div>
        <div className="registration-date">
          <p className="attributes-profile">
            {profileData.nome} usa easyJob dal: <br />
            {profileData.dataRegistrazione}
          </p>
        </div>
      </div>
      <div className="divider-profile" />
      <div className="footer-profile">
        <div className="description-profile">
          {profileData.descrizione || 'Nessuna descrizione disponibile'}
        </div>
      </div>
    </div>
  );
}