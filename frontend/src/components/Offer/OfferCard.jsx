import React, { useState, useEffect } from 'react';
import './OfferCard.css';
import axios from 'axios';


const OfferCard = ({
  title = 'Software Developer Full-Time',
  company = 'Reply Technologies s.p.a.',
  location = 'Italia, San Tests',
  jobType = 'Full Time',
  postedDate = '14/01/24',
  closingDate = '31/02/24',
  description = 'lorem ipsum - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies lacinia, nunc nisl aliquam nisl, eget ultricies nisl nisl eget nisl.',
  id,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  user,
}) => {
  // Gestisce il click sul preferito
  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Previene la propagazione al componente padre
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };
  const [imageUrl] = useState(null);
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    const fetchProfilo = async () => {
      // Verifica se user esiste prima di accedere alle sue proprietà
      if (!user) {
        console.log('Dati utente non disponibili:', user);
        return;
      }
      
      // Estrai l'ID utente dalla struttura user che potrebbe variare
      const userId = user.id || (typeof user === 'number' ? user : null);
      
      if (!userId) {
        console.log('ID utente non disponibile:', user);
        return;
      }
      
      try {
        console.log('Fetching profilo for user ID:', userId);
        const response = await axios.get('http://localhost:1337/api/profilo-recruiters', {
          params: {
            filters: {
              user: {
                id: {
                  $eq: userId
                }
              }
            },
            populate: ['user', 'logoAzienda'],
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Risposta profilo recruiter:', response.data);
        
        // Se abbiamo dati validi
        if (response.data.data && response.data.data.length > 0) {
          console.log('Profilo trovato:', response.data.data[0]);
          // Gestire l'immagine se disponibile
          // setImageUrl(...)
        } else {
          console.log('Nessun profilo trovato per user ID:', userId);
        }
      } catch (error) {
        console.error('Errore caricamento profilo recruiter', error);
      }
    };
    
    // Chiama fetchProfilo solo se user esiste
    if (user) {
      fetchProfilo();
    }
  }, [token, user]);

  // Formatta la data di scadenza
  const formattedClosingDate = closingDate ? closingDate : 'Non specificata';
  
  // Rimuove i tag HTML dalla descrizione e la tronca se necessario
  const cleanDescription = description ? 
    description.replace(/<[^>]*>?/gm, '') : 
    "Nessuna descrizione disponibile";
  
  const truncatedDescription = cleanDescription.length > 100 ? 
    cleanDescription.substring(0, 97) + '...' : 
    cleanDescription;

  return (
    <div
      className="offer-card"
      onClick={onClick}
      style={{
        minHeight: '180px',
        height: '180px',
        width: '90%',
        maxWidth: '100%',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div className="offer-card-header">
        <div className="offer-header-left">
          <div className="company-logo">
            <img
              src={imageUrl ? imageUrl : '/person-run.svg'}
              alt={company}
            />
          </div>
        </div>

        <div className="offer-header-content">
          <div className="offer-title-row">
            <h3 className="offer-title">{title}</h3>
            <button
              className={`favorite-button ${isFavorite ? 'is-favorite' : ''
                }`}
              onClick={handleFavoriteClick}
              aria-label={
                isFavorite
                  ? 'Rimuovi dai preferiti'
                  : 'Aggiungi ai preferiti'
              }
            >
              <span className="star-icon">★</span>
            </button>
          </div>

          <div className="offer-company">{company}</div>

          <div className="offer-info-container">
            <div className="offer-info-left">
              <div className="location">{location}</div>
              <div className="job-type-container">
                <span className="job-type-label">
                  Da remoto,{' '}
                </span>
                <span className="job-type">{jobType}</span>
              </div>
            </div>

            <div className="offer-info-right">
              <div className="offer-date-row">
                <span className="date-label">
                  Pubblicato:{' '}
                </span>
                <span className="date-value">
                  {postedDate}
                </span>
              </div>
              <div className="offer-date-row">
                <span className="date-label">
                  Scadenza:{' '}
                </span>
                <span className="date-value">
                  {formattedClosingDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="offer-divider"></div>

      <div className="offer-description">
        Descrizione: {truncatedDescription}
      </div>
    </div>
  );
};

export default OfferCard;
