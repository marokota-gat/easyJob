import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CompletaProfiloRecruiter.css';
import Footer from '../components/Layout/Footer';
import Button from '../components/UI/Button';
import InputField from '../components/UI/InputField';

export default function CompletaProfiloRecruiter() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    dataNascita: '',
    nomeAzienda: '',
  });
  const [logoAzienda, setLogoAzienda] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const jwt = localStorage.getItem('jwt');
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!jwt) {
      window.location.replace('/login');
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
        const userStr = localStorage.getItem('user');
        let user;
        
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.error('Errore nel parsing dei dati utente');
          setCheckingProfile(false);
          setProfileChecked(true);
          return;
        }
        
        if (!user || !user.id) {
          console.error('Dati utente non validi');
          setCheckingProfile(false);
          setProfileChecked(true);
          return;
        }
        
        // Verifica se l'utente ha già un profilo
        const profiloResponse = await axios.get(
          `http://localhost:1337/api/profilo-recruiters?populate=*&filters[user][id][$eq]=${user.id}`,
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
          
          console.log('Profilo già esistente, reindirizzamento alla dashboard');
          localStorage.setItem('profileCompleted', 'true');
          window.location.replace('/dashboard/recruiter');
        } else {
          console.log('Nessun profilo trovato, rimanere nella pagina di compilazione');
          localStorage.setItem('profileCompleted', 'false');
        }
      } catch (error) {
        console.error('Errore nella verifica del profilo:', error);
        // In caso di errore, assumiamo che il profilo non esista
        localStorage.setItem('profileCompleted', 'false');
      } finally {
        setCheckingProfile(false);
        setProfileChecked(true);
      }
    };
    
    checkProfileStatus();
  }, [jwt, navigate, profileChecked]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoAzienda(file);

      // Verifica che il formato dell'immagine sia supportato
      const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!supportedImageTypes.includes(file.type)) {
        console.warn('Formato immagine non ottimale. Formati consigliati: JPG, PNG, WebP');
        // Continuiamo comunque con il caricamento
      }

      // Crea un'anteprima del logo
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      
      console.log('Creazione profilo per utente ID:', user.id);
      console.log('Dati del form:', formData);
      console.log('Dati completi da inviare:', {
        ...formData,
        user: user.id
      });
      
      // 1. Create profilo recruiter entry, collegandolo all'utente
      const profiloResponse = await axios.post(
        'http://localhost:1337/api/profilo-recruiters',
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

      console.log('Profilo creato con successo, risposta completa:', profiloResponse);
      console.log('Dati del profilo creato:', profiloResponse.data);
      
      if (!profiloResponse.data || !profiloResponse.data.data || !profiloResponse.data.data.id) {
        throw new Error('Risposta API non valida: ID del profilo mancante');
      }
      
      const profiloId = profiloResponse.data.data.id;

      // Verifichiamo subito se il profilo è stato correttamente collegato all'utente
      try {
        const verificaResponse = await axios.get(
          `http://localhost:1337/api/profilo-recruiters/${profiloId}?populate=user`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
        console.log('Verifica collegamento profilo-utente:', verificaResponse.data);
        
        // Verifica che il profilo sia effettivamente collegato all'utente
        const profiloData = verificaResponse.data.data;
        if (!profiloData || 
            !profiloData.attributes || 
            !profiloData.attributes.user || 
            !profiloData.attributes.user.data ||
            profiloData.attributes.user.data.id != user.id) {
          console.error('Il profilo non risulta correttamente collegato all\'utente');
          // Tentiamo di aggiornare il profilo per collegarlo all'utente
          try {
            await axios.put(
              `http://localhost:1337/api/profilo-recruiters/${profiloId}`,
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
            console.log('Collegamento profilo-utente corretto manualmente');
          } catch (updateError) {
            console.error('Errore nel tentativo di correggere il collegamento:', updateError);
          }
        } else {
          console.log('Profilo correttamente collegato all\'utente');
        }
      } catch (verificaError) {
        console.error('Errore nella verifica del collegamento:', verificaError);
      }

      // 2. Upload logo if present
      if (logoAzienda) {
        console.log('Caricamento logo azienda:', logoAzienda.name, 'Tipo:', logoAzienda.type);
        
        const formDataFiles = new FormData();
        formDataFiles.append(
          'ref',
          'api::profilo-recruiter.profilo-recruiter'
        );
        formDataFiles.append('refId', profiloId);
        formDataFiles.append('field', 'logoAzienda');
        formDataFiles.append('files', logoAzienda);

        console.log('FormData per logo azienda:', {
          ref: 'api::profilo-recruiter.profilo-recruiter',
          refId: profiloId,
          field: 'logoAzienda',
          filename: logoAzienda.name,
          size: logoAzienda.size,
          type: logoAzienda.type
        });

        try {
          const uploadResponse = await axios.post(
            'http://localhost:1337/api/upload',
            formDataFiles,
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          console.log('Logo caricato con successo:', uploadResponse.data);
          
          // Salva l'URL del logo nel localStorage per un accesso più rapido
          if (uploadResponse.data && uploadResponse.data.length > 0) {
            const logoUrl = uploadResponse.data[0].url;
            localStorage.setItem('userLogoAzienda', `http://localhost:1337${logoUrl}`);
            console.log('URL logo azienda salvato in localStorage:', `http://localhost:1337${logoUrl}`);
          }
          
          // Verifica che il logo sia stato associato correttamente
          try {
            console.log('Verifica dell\'associazione del logo al profilo');
            const verifyLogoResponse = await axios.get(
              `http://localhost:1337/api/profilo-recruiters/${profiloId}?populate=logoAzienda`,
              {
                headers: {
                  Authorization: `Bearer ${jwt}`,
                },
              }
            );
            console.log('Risultato verifica logo azienda:', verifyLogoResponse.data);
            
            // Se il logo non è associato, tentiamo di forzare l'associazione
            if (!verifyLogoResponse.data.data.attributes.logoAzienda ||
                !verifyLogoResponse.data.data.attributes.logoAzienda.data) {
              console.log('Tentativo di forzare associazione logo azienda');
              
              // Ottieni l'ID del logo caricato
              const uploadedLogoId = uploadResponse.data[0].id;
              
              // Forza l'associazione tramite update esplicito
              await axios.put(
                `http://localhost:1337/api/profilo-recruiters/${profiloId}`,
                {
                  data: {
                    logoAzienda: uploadedLogoId
                  }
                },
                {
                  headers: {
                    Authorization: `Bearer ${jwt}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              console.log('Associazione forzata logo azienda completata');
            }
          } catch (verifyError) {
            console.error('Errore nella verifica dell\'associazione del logo:', verifyError);
          }
        } catch (uploadError) {
          console.error('Errore nel caricamento del logo:', uploadError);
          if (uploadError.response) {
            console.error('Dettagli errore logo:', uploadError.response.data);
          }
          // Continuiamo comunque, il logo non è essenziale
        }
      }

      // 3. Salva i dati nel localStorage per mostrarli subito nella navbar
      localStorage.setItem('userNome', formData.nome);
      localStorage.setItem('userCognome', formData.cognome);
      localStorage.setItem(
        'userNomeAzienda',
        formData.nomeAzienda
      );
      localStorage.setItem('profileCompleted', 'true');
      
      console.log('Profilo completato e flag impostato nel localStorage');
      
      // 4. Verifica finale che tutto sia stato salvato correttamente
      try {
        const finalCheck = await axios.get(
          `http://localhost:1337/api/profilo-recruiters?populate=*`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
        
        console.log('Verifica finale del profilo - tutti i profili:', finalCheck.data);
        
        // Filtriamo manualmente per trovare il profilo dell'utente
        const profiloUtente = finalCheck.data.data.find(item => {
          return item.attributes && 
                 item.attributes.user && 
                 item.attributes.user.data && 
                 item.attributes.user.data.id === user.id;
        });
        
        if (profiloUtente) {
          console.log('Profilo verificato con successo nel database:', profiloUtente);
          localStorage.setItem('profileCompleted', 'true');
        } else {
          console.error('Profilo non trovato nella verifica finale');
          
          // Ultimo tentativo di correzione
          try {
            console.log('Tentativo finale di correzione del collegamento profilo-utente');
            await axios.put(
              `http://localhost:1337/api/profilo-recruiters/${profiloId}`,
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
            console.log('Collegamento profilo-utente corretto nel tentativo finale');
            localStorage.setItem('profileCompleted', 'true');
          } catch (finalUpdateError) {
            console.error('Errore nel tentativo finale di correzione:', finalUpdateError);
            // Nonostante l'errore, impostiamo comunque il profilo come completato
            // perché abbiamo già creato il profilo con successo
            localStorage.setItem('profileCompleted', 'true');
          }
        }
      } catch (finalCheckError) {
        console.error('Errore nella verifica finale:', finalCheckError);
        // In caso di errore, assumiamo che il profilo sia stato creato poiché abbiamo ricevuto una risposta positiva dalla creazione
        localStorage.setItem('profileCompleted', 'true');
      }

      // 5. Redirect to offerte page
      window.location.replace('/dashboard/recruiter');
      return; // Importante: interrompe l'esecuzione dopo il reindirizzamento
    } catch (err) {
      console.error(
        'Errore nel completamento del profilo:',
        err
      );
      if (err.response) {
        console.error(
          'Dettagli errore:',
          err.response.data
        );
        console.error('Status:', err.response.status);
        console.error('Headers:', err.response.headers);
        setError(
          `Errore ${err.response.status}: ${
            err.response.data?.error?.message ||
            'Errore durante il salvataggio del profilo'
          }. Riprova.`
        );
      } else if (err.request) {
        console.error(
          'Nessuna risposta ricevuta:',
          err.request
        );
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
            profilo recruiter
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
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="nomeAzienda">
                  Nome azienda*
                </label>
                <input
                  type="text"
                  id="nomeAzienda"
                  name="nomeAzienda"
                  value={formData.nomeAzienda}
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
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="cognome">Cognome*</label>
                <input
                  type="text"
                  id="cognome"
                  name="cognome"
                  value={formData.cognome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="logoAzienda">
                  Logo azienda
                </label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="logoAzienda"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label
                    htmlFor="logoAzienda"
                    className="file-label"
                  >
                    Scegli file
                  </label>
                  <span className="file-name">
                    {logoAzienda
                      ? logoAzienda.name
                      : 'Nessun file selezionato'}
                  </span>
                </div>
                {logoPreview && (
                  <div className="image-preview">
                    <img
                      src={logoPreview}
                      alt="Anteprima logo"
                    />
                  </div>
                )}
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
              'Salva profilo'
            )}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
