import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';

export default function ProfilePage() {
  const [profileData, setProfileData] = useState({
    nome: '',
    cognome: '',
    dataNascita: '',
    email: '',
    telefono: '',
    dataRegistrazione: '',
    descrizione: '',
    nomeAzienda: '',
    immagineProfilo: '/photoProfile.svg'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('jwt');
        const user = JSON.parse(localStorage.getItem('user'));
        const userRole = user.role;
        


        if (!user || !user.id || !token) {
          throw new Error('Dati utente o token mancanti');
        }

        // Recupera direttamente il profilo usando l'ID utente
        const profileEndpoint = userRole === 'Recruiter' 
          ? '/api/profilo-recruiters' 
          : '/api/profilo-candidatos';

        const profileUrl = `http://localhost:1337${profileEndpoint}?filters[user][id][$eq]=${user.id}&populate=*`;
        
        const profileResponse = await fetch(
          profileUrl,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
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



        // Gestione immagine profilo dinamica - SOLO quella del profilo specifico
        let imageUrl = '/photoProfile.svg'; // Default fallback
        

        
        if (userRole === 'Candidato') {
          // Per candidati, usa SOLO immagineProfilo del profilo specifico
          // Gestisce sia la struttura vecchia (data.attributes.url) che quella nuova (url diretto)
          let candidatoImageUrl = null;
          if (profileInfo.immagineProfilo?.data?.attributes?.url) {
            // Struttura vecchia: { data: { attributes: { url: "..." } } }
            candidatoImageUrl = profileInfo.immagineProfilo.data.attributes.url;
          } else if (profileInfo.immagineProfilo?.url) {
            // Struttura nuova: { url: "...", id: ..., etc }
            candidatoImageUrl = profileInfo.immagineProfilo.url;
          }
          
          if (candidatoImageUrl) {
            imageUrl = `http://localhost:1337${candidatoImageUrl}`;

                      }
        } else if (userRole === 'Recruiter') {
          // Per recruiter, usa SOLO logoAzienda del profilo specifico
          // Gestisce sia la struttura vecchia che quella nuova
          let recruiterImageUrl = null;
          if (profileInfo.logoAzienda?.data?.attributes?.url) {
            // Struttura vecchia: { data: { attributes: { url: "..." } } }
            recruiterImageUrl = profileInfo.logoAzienda.data.attributes.url;
          } else if (profileInfo.logoAzienda?.url) {
            // Struttura nuova: { url: "...", id: ..., etc }
            recruiterImageUrl = profileInfo.logoAzienda.url;
          }
          
          if (recruiterImageUrl) {
            imageUrl = `http://localhost:1337${recruiterImageUrl}`;

                      }
        }

        // Recupera anche i dati utente per email e data registrazione
        const userResponse = await fetch(`http://localhost:1337/api/users/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        let userData = {};
        if (userResponse.ok) {
          userData = await userResponse.json();
        }

        // Adatta i dati in base alla struttura del tuo modello Strapi
        setProfileData({
          // Dati da /api/users
          email: userData.email || user.email || '',
          dataRegistrazione: userData.createdAt ? formatDate(userData.createdAt) : '',
          
          // Dati da /api/profilo-recruiter o /api/profilo-candidato
          nome: profileInfo.nome || '',
          cognome: profileInfo.cognome || '',
          dataNascita: profileInfo.dataNascita ? formatDate(profileInfo.dataNascita) : '',
          telefono: profileInfo.telefono || '',
          descrizione: profileInfo.descrizione || '',
          nomeAzienda: profileInfo.nomeAzienda || '',
          
          // Immagine profilo dinamica - SOLO quella specifica del profilo
          immagineProfilo: imageUrl,
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
        <div className="profile-image-container">
          <img 
            src={profileData.immagineProfilo} 
            alt="immagine profilo" 
            onError={(e) => {
              e.target.src = '/photoProfile.svg';
            }}
          />
          {profileData.immagineProfilo === '/photoProfile.svg' && (
            <div className="no-image-message">
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Nessuna immagine profilo caricata. <Link to="/dashboard/modifica-profilo" style={{ color: '#007bff' }}>Carica una foto</Link>
              </small>
            </div>
          )}
        </div>
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
            {profileData.nomeAzienda && (
              <p className="attributes-profile">
                <strong>Azienda:</strong> {profileData.nomeAzienda}
              </p>
            )}
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
        <Link to="/dashboard/modifica-profilo">
          <button className="bottone-modifica-profilo">
            Modifica Profilo
          </button>
        </Link>
      </div>
    </div>
  );
}