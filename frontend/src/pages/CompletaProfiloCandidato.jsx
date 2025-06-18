import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CompletaProfiloCandidato.css';
import Footer from '../components/Layout/Footer';

export default function CompletaProfiloCandidato() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    dataNascita: '',
    telefono: '',
  });
  const [immagineProfilo, setImmagineProfilo] =
    useState(null);
  const [cv, setCv] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const jwt = localStorage.getItem('jwt');
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!jwt) {
      window.location.replace('/login');
      return;
    }

    // Limitiamo il numero di tentativi per evitare loop infiniti
    if (checkAttempts > 3) {
      setCheckingProfile(false);
      setProfileChecked(true);
      return;
    }

    // Evita di verificare più volte il profilo
    if (profileChecked) {
      return;
    }

    // Utente ha già completato il profilo? Se sì, lo reindirizza
    const checkProfileStatus = async () => {
      try {
        setCheckingProfile(true);
        setCheckAttempts(prevAttempts => prevAttempts + 1);
        
        const userStr = localStorage.getItem('user');
        
        let user;
        
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          setCheckingProfile(false);
          setProfileChecked(true);
          return;
        }
        
        if (!user || !user.id) {
          setCheckingProfile(false);
          setProfileChecked(true);
          return;
        }
        
        // Verifica se l'utente ha già un profilo
        const url = `http://localhost:1337/api/profilo-candidatos?populate=*&filters[user][id][$eq]=${user.id}`;
        
        const profiloResponse = await axios.get(
          url,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
        
        // Verifica se ci sono dati nella risposta
        if (profiloResponse.data && 
            profiloResponse.data.data && 
            Array.isArray(profiloResponse.data.data) &&
            profiloResponse.data.data.length > 0) {
          
          // Salva i dati del profilo nel localStorage
          const profilo = profiloResponse.data.data[0].attributes;
          if (profilo.nome) localStorage.setItem('userNome', profilo.nome);
          if (profilo.cognome) localStorage.setItem('userCognome', profilo.cognome);
          
          localStorage.setItem('profileCompleted', 'true');
          window.location.replace('/dashboard/offerte');
        } else {
          localStorage.setItem('profileCompleted', 'false');
        }
      } catch (error) {
        // In caso di errore, assumiamo che il profilo non esista
        localStorage.setItem('profileCompleted', 'false');
      } finally {
        setCheckingProfile(false);
        setProfileChecked(true);
      }
    };
    
    checkProfileStatus();
  }, [jwt, navigate, profileChecked, checkAttempts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, fileType) => {
    if (e.target.files && e.target.files[0]) {
      if (fileType === 'immagineProfilo') {
        const file = e.target.files[0];
        setImmagineProfilo(file);

        // Crea un'anteprima dell'immagine
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else if (fileType === 'cv') {
        setCv(e.target.files[0]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userStr = localStorage.getItem('user');
      let user;
      
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        setError('Errore nel parsing dei dati utente');
        setLoading(false);
        return;
      }
      
      if (!user || !user.id) {
        setError('Dati utente non validi. Effettua nuovamente il login.');
        setLoading(false);
        return;
      }
      
      // 1. Create profilo candidato entry, collegandolo all'utente
      const profiloResponse = await axios.post(
        'http://localhost:1337/api/profilo-candidatos',
        {
          data: {
            ...formData,
            user: user.id  // Collegamento esplicito all'utente
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!profiloResponse.data || !profiloResponse.data.data || !profiloResponse.data.data.id) {
        throw new Error('Risposta API non valida: ID del profilo mancante');
      }
      
      const profiloId = profiloResponse.data.data.id;

      // Verifichiamo subito se il profilo è stato correttamente collegato all'utente
      try {
        const verificaResponse = await axios.get(
          `http://localhost:1337/api/profilo-candidatos/${profiloId}?populate=user`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
        
        // Verifica che il profilo sia effettivamente collegato all'utente
        const profiloData = verificaResponse.data.data;
        if (!profiloData || 
            !profiloData.attributes || 
            !profiloData.attributes.user || 
            !profiloData.attributes.user.data ||
            profiloData.attributes.user.data.id != user.id) {
          // Tentiamo di aggiornare il profilo per collegarlo all'utente
          try {
            await axios.put(
              `http://localhost:1337/api/profilo-candidatos/${profiloId}`,
              {
                data: {
                  user: user.id
                }
              },
              {
                headers: {
                  Authorization: `Bearer ${jwt}`,
                  'Content-Type': 'application/json',
                },
              }
            );
          } catch (updateError) {
            // Continuiamo anche se fallisce
          }
        }
      } catch (verificaError) {
        // Continuiamo anche se fallisce la verifica
      }

      // 2. Upload files if present
      if (immagineProfilo || cv) {
        try {
          // Carica l'immagine profilo separatamente
          if (immagineProfilo) {
            const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            
            const imageFormData = new FormData();
            imageFormData.append('files', immagineProfilo);
            imageFormData.append('ref', 'api::profilo-candidato.profilo-candidato');
            imageFormData.append('refId', profiloId);
            imageFormData.append('field', 'immagineProfilo');
            
            try {
              // Caricamento dell'immagine profilo
              const uploadResponse = await axios.post(
                'http://localhost:1337/api/upload',
                imageFormData,
                {
                  headers: {
                    Authorization: `Bearer ${jwt}`,
                    'Content-Type': 'multipart/form-data',
                  },
                }
              );
              
              if (uploadResponse.data && uploadResponse.data.length > 0) {
                // Salva l'URL dell'immagine nel localStorage per un accesso più rapido
                const imageUrl = uploadResponse.data[0].url;
                localStorage.setItem('userProfileImage', `http://localhost:1337${imageUrl}`);
                
                // Verifica che l'immagine sia stata associata correttamente
                try {
                  const verifyImageResponse = await axios.get(
                    `http://localhost:1337/api/profilo-candidatos/${profiloId}?populate=immagineProfilo`,
                    {
                      headers: {
                        Authorization: `Bearer ${jwt}`,
                      },
                    }
                  );
                  
                  // Se l'immagine non è associata, tentiamo di forzare l'associazione
                  if (!verifyImageResponse.data.data.attributes.immagineProfilo ||
                      !verifyImageResponse.data.data.attributes.immagineProfilo.data) {
                    
                    // Ottieni l'ID dell'immagine caricata
                    const uploadedImageId = uploadResponse.data[0].id;
                    
                    // Forza l'associazione tramite update esplicito
                    await axios.put(
                      `http://localhost:1337/api/profilo-candidatos/${profiloId}`,
                      {
                        data: {
                          immagineProfilo: uploadedImageId
                        }
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${jwt}`,
                          'Content-Type': 'application/json',
                        },
                      }
                    );
                  }
                } catch (verifyError) {
                  // Continuiamo anche se fallisce
                }
              }
            } catch (uploadError) {
              setError(`Errore nel caricamento dell'immagine profilo: ${uploadError.message}`);
            }
          }
          
          // Carica il CV separatamente
          if (cv) {
            const cvFormData = new FormData();
            cvFormData.append('files', cv);
            cvFormData.append('ref', 'api::profilo-candidato.profilo-candidato');
            cvFormData.append('refId', profiloId);
            cvFormData.append('field', 'cv');
            
            const cvUploadResponse = await axios.post(
              'http://localhost:1337/api/upload',
              cvFormData,
              {
                headers: {
                  Authorization: `Bearer ${jwt}`,
                  'Content-Type': 'multipart/form-data',
                },
              }
            );
          }
        } catch (uploadError) {
          // Continuiamo comunque, i file non sono essenziali
        }
      }

      // 3. Salva i dati nel localStorage per mostrarli subito nella navbar
      localStorage.setItem('userNome', formData.nome);
      localStorage.setItem('userCognome', formData.cognome);
      localStorage.setItem('profileCompleted', 'true');
      
      // 4. Verifica finale che tutto sia stato salvato correttamente
      try {
        const finalCheck = await axios.get(
          `http://localhost:1337/api/profilo-candidatos?populate=*&filters[user][id][$eq]=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
        
        // Verifica se ci sono dati nella risposta
        if (finalCheck.data && 
            finalCheck.data.data && 
            Array.isArray(finalCheck.data.data) &&
            finalCheck.data.data.length > 0) {
          
          localStorage.setItem('profileCompleted', 'true');
        } else {
          // Ultimo tentativo di correzione
          try {
            await axios.put(
              `http://localhost:1337/api/profilo-candidatos/${profiloId}`,
              {
                data: {
                  user: user.id
                }
              },
              {
                headers: {
                  Authorization: `Bearer ${jwt}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            localStorage.setItem('profileCompleted', 'true');
          } catch (finalUpdateError) {
            // Nonostante l'errore, impostiamo comunque il profilo come completato
            // perché abbiamo già creato il profilo con successo
            localStorage.setItem('profileCompleted', 'true');
          }
        }
      } catch (finalCheckError) {
        // In caso di errore, assumiamo che il profilo sia stato creato poiché abbiamo ricevuto una risposta positiva dalla creazione
        localStorage.setItem('profileCompleted', 'true');
      }

      // 5. Redirect to offerte page
      window.location.replace('/dashboard/offerte');
      return; // Importante: interrompe l'esecuzione dopo il reindirizzamento
    } catch (err) {
      if (err.response) {
        setError(
          `Errore ${err.response.status}: ${
            err.response.data?.error?.message ||
            'Errore durante il salvataggio del profilo'
          }. Riprova.`
        );
      } else if (err.request) {
        setError(
          'Nessuna risposta dal server. Verifica la connessione.'
        );
      } else {
        setError(`Errore: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return <div className="loading-profile">Verifica profilo in corso...</div>;
  }

  return (
    <div className="page-container">
      <div className="completa-profilo-container">
        <div className="profilo-header">
          <p id="h1">Completa il tuo profilo</p>
          <p>
            Inserisci le informazioni per completare il tuo
            profilo candidato
          </p>
          {error && (
            <div className="error-notification">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="profilo-form"
        >
          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="nome">Nome*</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder="Inserire il tuo nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cognome">Cognome*</label>
                <input
                  type="text"
                  id="cognome"
                  name="cognome"
                  placeholder="Inserire il tuo cognome"
                  value={formData.cognome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dataNascita">
                  Data di nascita*
                </label>
                <input
                  type="date"
                  id="dataNascita"
                  name="dataNascita"
                  value={formData.dataNascita}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">
                  Numero di telefono*
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  placeholder="Insere il numero di telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="immagineProfilo">
                  Immagine profilo
                </label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="immagineProfilo"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(e, 'immagineProfilo')
                    }
                    className="file-input"
                  />
                  <label
                    htmlFor="immagineProfilo"
                    className="file-label"
                  >
                    Scegli file
                  </label>
                  <span className="file-name">
                    {immagineProfilo
                      ? immagineProfilo.name
                      : 'Nessun file selezionato'}
                  </span>
                </div>
                {imagePreview && (
                  <div className="image-preview">
                    <img
                      src={imagePreview}
                      alt="Anteprima"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="cv">
                  CV (formati: .pdf, .doc, .docx, .txt)
                </label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="cv"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) =>
                      handleFileChange(e, 'cv')
                    }
                    className="file-input"
                  />
                  <label
                    htmlFor="cv"
                    className="file-label"
                  >
                    Scegli file
                  </label>
                  <span className="file-name">
                    {cv
                      ? cv.name
                      : 'Nessun file selezionato'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Salvataggio in corso...
              </>
            ) : (
              'Salva'
            )}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
