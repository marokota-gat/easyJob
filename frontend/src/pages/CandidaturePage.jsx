import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CandidaturePage.css';

export default function CandidaturePage() {
  const [candidature, setCandidature] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingCv, setUploadingCv] = useState(null); // ID della candidatura in fase di upload
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
              documentId: candidatura.documentId,
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

  // Funzione per gestire l'upload del nuovo CV
  const handleCvUpload = async (candidaturaId, file) => {
  try {
    console.log('=== INIZIO UPLOAD CV ===');
    console.log('Candidatura ID:', candidaturaId);
    console.log('File:', file.name, file.type, file.size);
    
    setUploadingCv(candidaturaId);

    // Step 1: Upload del file
    console.log('Step 1: Caricamento file...');
    const formData = new FormData();
    formData.append('files', file);

    const uploadResponse = await axios.post(
      'http://localhost:1337/api/upload',
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Upload response completa:', uploadResponse);
    console.log('Upload data:', uploadResponse.data);

    if (uploadResponse.data && uploadResponse.data.length > 0) {
      const uploadedFile = uploadResponse.data[0];
      console.log('File caricato:', uploadedFile);
      console.log('ID del file caricato:', uploadedFile.id);

      // Step 2: Aggiorna la candidatura con il nuovo CV
      console.log('Step 2: Aggiornamento candidatura...');
      const updateUrl = `http://localhost:1337/api/candidaturas/${candidaturaId}`;
      console.log('URL di aggiornamento:', updateUrl);
      
      const updateData = {
        data: {
          CV: uploadedFile.id,
        },
      };
      console.log('Dati da inviare:', JSON.stringify(updateData, null, 2));

      const updateResponse = await axios.put(
        updateUrl,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Update response completa:', updateResponse);
      console.log('Update data:', updateResponse.data);

      // Step 3: Aggiorna lo stato locale
      setCandidature(prevCandidature =>
        prevCandidature.map(candidatura =>
          candidatura.id === candidaturaId
            ? {
                ...candidatura,
                cvUrl: `http://localhost:1337${uploadedFile.url}`,
              }
            : candidatura
        )
      );

      alert('CV aggiornato con successo!');
      window.location.reload();
    } else {
      console.error('Nessun file nell\'upload response');
      throw new Error('Upload fallito: nessun file restituito');
    }
  } catch (error) {
    console.error('=== ERRORE UPLOAD ===');
    console.error('Errore completo:', error);
    console.error('Response error:', error.response);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    }
    
    // Messaggio di errore più specifico
    let errorMessage = 'Errore nell\'aggiornamento del CV.';
    if (error.response) {
      switch (error.response.status) {
        case 404:
          errorMessage = 'Risorsa non trovata. Verifica che la candidatura esista.';
          break;
        case 401:
          errorMessage = 'Non autorizzato. Verifica il token di autenticazione.';
          break;
        case 403:
          errorMessage = 'Permessi insufficienti.';
          break;
        case 413:
          errorMessage = 'File troppo grande.';
          break;
        default:
          errorMessage = `Errore del server: ${error.response.status}`;
      }
    }
    
    alert(errorMessage);
  } finally {
    setUploadingCv(null);
  }
};

  // Funzione per gestire la selezione del file
  const handleFileSelect = (candidaturaId, event) => {
    const file = event.target.files[0];
    if (file) {
      // Verifica il tipo di file
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Formato file non supportato. Carica un file PDF o Word.');
        return;
      }

      // Verifica la dimensione del file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Il file è troppo grande. Dimensione massima: 10MB.');
        return;
      }

      handleCvUpload(candidaturaId, file);
    }
  };

  // Funzione per verificare se è possibile modificare il CV
  const canModifyCv = (stato) => {
    return stato === 'inviata' || stato === 'in valutazione';
  };

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
                
                <div className="cv-section">
                  <div className="cv-buttons-container">
                    {candidatura.cvUrl && (
                      <a
                        href={candidatura.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visualizza CV
                      </a>
                    )}
                    
                    {canModifyCv(candidatura.stato) && (
                      <>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileSelect(candidatura.documentId, e)}
                          style={{ display: 'none' }}
                          id={`cv-upload-${candidatura.id}`}
                          disabled={uploadingCv === candidatura.id}
                        />
                        <label
                          htmlFor={`cv-upload-${candidatura.id}`}
                          className={`cv-upload-button ${uploadingCv === candidatura.id ? 'uploading' : ''}`}
                        >
                          {uploadingCv === candidatura.id ? (
                            <>
                              <span className="upload-spinner"></span>
                              Caricamento...
                            </>
                          ) : (
                            'Modifica CV'
                          )}
                        </label>
                      </>
                    )}
                  </div>
                </div>
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