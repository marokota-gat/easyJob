import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CandidaturePage.css';

export default function CandidaturePage() {
  const [candidature, setCandidature] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const jwt = localStorage.getItem('jwt');

  useEffect(() => {
    const fetchCandidature = async () => {
      if (!jwt) return;

      try {
        // Recupera le candidature dell'utente con le offerte correlate
        const response = await axios.get(
          'http://localhost:1337/api/candidaturas?populate[0]=CV&populate[1]=offerta',
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );

        console.log('Dati candidature ricevuti:', response.data);

        // Formatta i dati per la visualizzazione
        const formattedCandidature = await Promise.all(
          response.data.data.map(async (candidatura) => {
            const attrs = candidatura.attributes || candidatura;
            
            // Ottieni i dettagli del CV
            let cvUrl = null;
            try {
              if (attrs.CV) {
                cvUrl = `http://localhost:1337${attrs.CV.url}`;
              }
            } catch (e) {
              console.error("Errore nell'accesso ai dati CV:", e);
            }

            // Ottieni i dati dell'offerta
            let offertaData = {
              ruolo: 'Offerta non disponibile',
              azienda: 'Azienda non specificata',
              luogo: 'Luogo non specificato'
            };
            
            try {
              // Controlla se l'offerta è disponibile
              if (attrs.offerta && attrs.offerta.data) {
                const offertaAttrs = attrs.offerta.data.attributes;
                offertaData = {
                  id: attrs.offerta.data.id,
                  ruolo: offertaAttrs.Ruolo || 'Ruolo non specificato',
                  azienda: offertaAttrs.Azienda || 'Azienda non specificata',
                  luogo: offertaAttrs.Luogo || 'Luogo non specificato',
                };
                console.log('Dati offerta trovati:', offertaData);
              } else if (attrs.offerta && typeof attrs.offerta === 'object') {
                // Formato alternativo senza data wrapper
                offertaData = {
                  id: attrs.offerta.id,
                  ruolo: attrs.offerta.Ruolo || 'Ruolo non specificato',
                  azienda: attrs.offerta.Azienda || 'Azienda non specificata',
                  luogo: attrs.offerta.Luogo || 'Luogo non specificato',
                };
                console.log('Dati offerta formato alternativo:', offertaData);
              } else if (attrs.offertaId) {
                // Prova a recuperare l'offerta separatamente
                try {
                  const offertaResponse = await axios.get(
                    `http://localhost:1337/api/offertas/${attrs.offertaId}`,
                    {
                      headers: {
                        Authorization: `Bearer ${jwt}`,
                      },
                    }
                  );
                  
                  if (offertaResponse.data && offertaResponse.data.data) {
                    const offertaAttrs = offertaResponse.data.data.attributes;
                    offertaData = {
                      id: offertaResponse.data.data.id,
                      ruolo: offertaAttrs.Ruolo || 'Ruolo non specificato',
                      azienda: offertaAttrs.Azienda || 'Azienda non specificata',
                      luogo: offertaAttrs.Luogo || 'Luogo non specificato',
                    };
                    console.log('Dati offerta recuperati separatamente:', offertaData);
                  }
                } catch (offertaError) {
                  console.error("Errore nel recupero dell'offerta:", offertaError);
                }
              }
            } catch (e) {
              console.error("Errore nell'accesso ai dati offerta:", e);
            }

            // Ottieni i dati del candidato dalla candidatura
            const nomeCandidato = attrs.nomeCandidato || attrs.nome || '';
            const cognomeCandidato = attrs.cognomeCandidato || attrs.cognome || '';
            const emailCandidato = attrs.emailCandidato || attrs.email || '';
            
            // Formatta la data di candidatura
            let dataCandidatura = 'Data non disponibile';
            try {
              if (attrs.dataCandidatura) {
                dataCandidatura = new Date(attrs.dataCandidatura).toLocaleDateString('it-IT');
              } else if (attrs.createdAt) {
                dataCandidatura = new Date(attrs.createdAt).toLocaleDateString('it-IT');
              }
            } catch (e) {
              console.error("Errore nella formattazione della data:", e);
            }

            return {
              id: candidatura.id,
              offerta: offertaData,
              stato: attrs.stato || 'inviata',
              feedback: attrs.feedback || '',
              cvUrl: cvUrl,
              dataCandidatura: dataCandidatura,
              nome: nomeCandidato,
              cognome: cognomeCandidato,
              email: emailCandidato
            };
          })
        );

        console.log('Candidature formattate:', formattedCandidature);
        setCandidature(formattedCandidature);
        setLoading(false);
      } catch (err) {
        console.error(
          'Errore nel caricamento delle candidature:',
          err
        );
        setError(
          'Errore nel caricamento delle candidature. Riprova più tardi.'
        );
        setLoading(false);
      }
    };

    fetchCandidature();
  }, [jwt]);

  // Funzione per ottenere la classe CSS in base allo stato
  const getStatusClass = (stato) => {
    switch (stato) {
      case 'inviata':
        return 'status-sent';
      case 'presa_visione':
        return 'status-viewed';
      case 'feedback_disponibile':
        return 'status-feedback';
      case 'accettata':
        return 'status-accepted';
      case 'rifiutata':
        return 'status-rejected';
      case 'in valutazione':
        return 'status-evaluating';
      default:
        return '';
    }
  };

  // Funzione per ottenere il testo dello stato in italiano
  const getStatusText = (stato) => {
    switch (stato) {
      case 'inviata':
        return 'Inviata';
      case 'presa_visione':
        return 'Presa visione';
      case 'feedback_disponibile':
        return 'Feedback disponibile';
      case 'accettata':
        return 'Accettata';
      case 'rifiutata':
        return 'Rifiutata';
      case 'in valutazione':
        return 'In valutazione';
      default:
        return stato;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Caricamento candidature...
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="candidature-page">
      <p className="candidature-title">
        Le tue candidature
      </p>

      {candidature.length === 0 ? (
        <div className="no-candidature">
          <p>
            Non hai ancora inviato candidature. Esplora le
            offerte disponibili e candidati!
          </p>
        </div>
      ) : (
        <div className="candidature-list">
          {candidature.map((candidatura) => (
            <div
              key={candidatura.id}
              className="candidatura-card"
            >
              <div className="candidatura-header">
                <h2>{candidatura.offerta.ruolo}</h2>
                <span
                  className={`candidatura-status ${getStatusClass(
                    candidatura.stato
                  )}`}
                >
                  {getStatusText(candidatura.stato)}
                </span>
              </div>

              <div className="content-card">
                <p>
                  <strong>Azienda:</strong>{' '}
                  {candidatura.offerta.azienda}
                </p>
                <p>
                  <strong>Luogo:</strong>{' '}
                  {candidatura.offerta.luogo}
                </p>
                <p>
                  <strong>Data candidatura:</strong>{' '}
                  {candidatura.dataCandidatura}
                </p>
                <p>
                  <strong>Stato:</strong>{' '}
                  <span className={`stato-badge ${getStatusClass(candidatura.stato)}`}>
                    {getStatusText(candidatura.stato)}
                  </span>
                </p>
                {candidatura.cvUrl && (
                  <p>
                    <strong>CV:</strong>{' '}
                    <a
                      href={candidatura.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visualizza CV
                    </a>
                  </p>
                )}
              </div>

              {candidatura.feedback && (
                <div className="candidatura-feedback">
                  <h3>Feedback del recruiter:</h3>
                  <p>{candidatura.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
