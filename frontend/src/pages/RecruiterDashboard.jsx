import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';
import './RecruiterDashboard.css';
import axios from 'axios';
import { Navigate } from 'react-router-dom';

export default function RecruiterDashboard() {
  const [job, setJob] = useState({
    Ruolo: '',
    Azienda: '',
    Luogo: '',
    TipoContratto: '',
    Descrizione: '',
    Scadenza: '',
  });

  const [jwt, setJwt] = useState(
    localStorage.getItem('jwt')
  );
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pubblica'); // 'pubblica' o 'gestisci' o 'candidature'
  const [offerte, setOfferte] = useState([]);
  const [selectedOfferta, setSelectedOfferta] =
    useState(null);
  const [candidature, setCandidature] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedCandidatura, setSelectedCandidatura] =
    useState(null);
  const userStr = localStorage.getItem('user');
  const user = JSON.parse(userStr)

  // Definire fetchOfferte con useCallback per poterlo usare come dipendenza in useEffect
  const fetchOfferte = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:1337/api/offertas?populate[0]=user&populate[1]=candidaturas`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(response.data.data)
      if (
        !response.data.data ||
        !Array.isArray(response.data.data)
      ) {
        console.error(
          'Formato risposta offerte non valido'
        );
        setError('Formato risposta offerte non valido');
        setLoading(false);
        return;
      }

      // Trasforma i dati dal formato Strapi a quello richiesto dal componente
      const offerteRecruiter = response.data.data
        .map((offerta) => {
          const attrs = offerta.attributes || offerta; // fallback ai dati flat
          if (
            !attrs.Ruolo ||
            !attrs.Azienda ||
            !attrs.Luogo ||
            !attrs.TipoContratto ||
            !attrs.Descrizione
          ) {
            console.error(
              'Offerta mancante di attributi richiesti'
            );
            return null;
          }


          if (attrs.user.email !== user.email) {
            return null
          }

          return {
            id: offerta.id,
            ruolo: attrs.Ruolo,
            azienda: attrs.Azienda,
            luogo: attrs.Luogo,
            tipoContratto: attrs.TipoContratto,
            descrizione: attrs.Descrizione,
            pubblicazione: attrs.pubblicazione
              ? new Date(
                  attrs.pubblicazione
                ).toLocaleDateString('it-IT')
              : 'Data non disponibile',
            scadenza: attrs.scadenza
              ? new Date(attrs.scadenza).toLocaleDateString(
                  'it-IT'
                )
              : 'Data non disponibile',
            userId: attrs.user?.data?.id || null,
          };
        })
        .filter((item) => item !== null);

      setOfferte(offerteRecruiter);
      if (offerteRecruiter.length === 0) {
        setError(
          'Nessuna offerta  trovata.'
        );
      }
      setLoading(false);
    } catch (err) {
      console.error(
        'Errore nel caricamento delle offerte:',
        err
      );

      if (err.response) {
        setError(
          `Errore ${err.response.status}: ${
            err.response.data?.error?.message ||
            'Errore durante il caricamento delle offerte'
          }`
        );
      } else if (err.request) {
        setError(
          'Nessuna risposta dal server. Verifica la connessione e che il server sia in esecuzione.'
        );
      } else {
        setError(`Errore: ${err.message}`);
      }

      setLoading(false);
    }
  }, [jwt]);

  // Carica le offerte del recruiter
  useEffect(() => {
    if (jwt && activeTab === 'gestisci') {
      fetchOfferte();
    }
  }, [jwt, activeTab, fetchOfferte]);

  // Carica le candidature per l'offerta selezionata
  const fetchCandidature = async (offertaId) => {
    try {
      // Usa il filtro diretto per offerta ID
      const endpoint = `http://localhost:1337/api/candidaturas?filters[offerta][id]=${offertaId}&populate=*`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      console.log('Risposta candidature raw:', response.data);

      // Verifica se ci sono candidature con dati mancanti e aggiornale
      if (
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        for (const candidatura of response.data.data) {
          // Verifica se la candidatura ha una struttura valida
          if (!candidatura) {
            console.error('Candidatura non valida:', candidatura);
            continue;
          }
          
          // Supporta sia il formato con attributes che il formato flat
          const attrs = candidatura.attributes || candidatura;
          console.log('Candidatura da elaborare:', candidatura.id, attrs);
          
          // Verifica se mancano i metadati del candidato
          if (
            !attrs.nomeCandidato ||
            !attrs.cognomeCandidato ||
            !attrs.emailCandidato
          ) {
            await aggiornaMetadatiCandidatura(candidatura);
          }
        }

        // Ricarica i dati aggiornati se sono state fatte modifiche
        let updatedResponse = response;
        if (
          response.data.data.some((c) => {
            // Supporta sia il formato con attributes che il formato flat
            const attrs = c.attributes || c;
            return (
              !attrs.nomeCandidato ||
              !attrs.cognomeCandidato ||
              !attrs.emailCandidato
            );
          })
        ) {
          updatedResponse = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          });
        }

        // Carica gli stati salvati dal localStorage
        let statiSalvati = {};
        try {
          const statiSalvatiJSON = localStorage.getItem(
            'candidatureStati'
          );
          if (statiSalvatiJSON) {
            statiSalvati = JSON.parse(statiSalvatiJSON);
          }
        } catch (e) {
          console.error(
            'Errore nel caricamento degli stati dal localStorage:',
            e
          );
          statiSalvati = {};
        }

        // Carica i feedback salvati dal localStorage
        let feedbackSalvati = {};
        try {
          const feedbackSalvatiJSON = localStorage.getItem(
            'candidatureFeedback'
          );
          if (feedbackSalvatiJSON) {
            feedbackSalvati = JSON.parse(
              feedbackSalvatiJSON
            );
          }
        } catch (e) {
          console.error(
            'Errore nel caricamento dei feedback dal localStorage:',
            e
          );
          feedbackSalvati = {};
        }

        // Mantieni gli stati precedenti per evitare che vengano sovrascritti
        const statoAttuale = {};
        const feedbackAttuale = {};
        candidature.forEach((c) => {
          statoAttuale[c.id] = c.stato;
          if (c.feedback) {
            feedbackAttuale[c.id] = c.feedback;
          }
        });

        // Usa la risposta aggiornata se disponibile
        const dataToProcess =
          updatedResponse.data.data || response.data.data;

        // Formatta i dati delle candidature con controlli di sicurezza
        const formattedCandidature = dataToProcess
          .filter((item) => item !== null)
          .map((candidatura) => {
            if (!candidatura) {
              console.error('Candidatura non valida');
              return null;
            }
            
            // Supporta sia il formato con attributes che il formato flat
            const attrs = candidatura.attributes || candidatura;
            console.log('Formattazione candidatura:', candidatura.id, attrs);

            // Ottieni il percorso del CV se presente, con controlli aggiuntivi per evitare errori
            let cvUrl = null;
            try {
              // Controlla sia il formato standard che quello alternativo
              if (attrs && attrs.CV) {
                cvUrl = `http://localhost:1337${attrs.CV.url}`;
              } 
            } catch (e) {
              console.error(
                "Errore nell'accesso ai dati CV:",
                e
              );
            }

            // Ottieni i dati dell'utente candidato
            let userData = {};
            let candidatoNome = '';
            let candidatoCognome = '';
            let candidatoEmail = '';

            // Prima controlla i campi diretti nella candidatura
            try {
              // Controlla i campi diretti (nomeCandidato, cognomeCandidato, emailCandidato)
              if (attrs) {
                candidatoNome = attrs.nomeCandidato || attrs.nome || '';
                candidatoCognome = attrs.cognomeCandidato || attrs.cognome || '';
                candidatoEmail = attrs.emailCandidato || attrs.email || '';
              }
            } catch (e) {
              console.error(
                "Errore nell'accesso ai campi diretti:",
                e
              );
            }

            // Se non abbiamo trovato dati nei campi diretti, prova dalla relazione user
            if (!candidatoNome || !candidatoEmail) {
              try {
                if (
                  attrs &&
                  attrs.user &&
                  attrs.user.data
                ) {
                  userData =
                    attrs.user.data.attributes || {};

                  // Cerca i campi con diversi possibili nomi (case-sensitive e case-insensitive)
                  if (!candidatoEmail) {
                    candidatoEmail =
                      userData.email ||
                      userData.Email ||
                      '';
                  }

                  // Cerca il nome in vari possibili campi
                  if (!candidatoNome) {
                    candidatoNome =
                      userData.Nome ||
                      userData.nome ||
                      userData.name ||
                      userData.Name ||
                      userData.username ||
                      userData.Username ||
                      '';
                  }

                  // Cerca il cognome in vari possibili campi
                  if (!candidatoCognome) {
                    candidatoCognome =
                      userData.Cognome ||
                      userData.cognome ||
                      userData.surname ||
                      userData.Surname ||
                      userData.lastName ||
                      userData.LastName ||
                      '';
                  }
                }
              } catch (e) {
                console.error(
                  "Errore nell'accesso ai dati utente:",
                  e
                );
              }
            }

            // Usa lo stato salvato se disponibile, altrimenti usa quello dal database
            const savedStato =
              statiSalvati[candidatura.id] ||
              statoAttuale[candidatura.id] ||
              attrs.stato ||
              'inviata';
            const savedFeedback =
              feedbackSalvati[candidatura.id] ||
              feedbackAttuale[candidatura.id] ||
              attrs.feedback ||
              '';

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

            // Restituisci l'oggetto candidatura formattato
            return {
              id: candidatura.id,
              nome: candidatoNome || 'Nome non disponibile',
              cognome: candidatoCognome || '',
              email: candidatoEmail || 'Email non disponibile',
              cv: cvUrl,
              stato: savedStato,
              feedback: savedFeedback,
              dataCandidatura: dataCandidatura,
              documentId: attrs.documentId || null
            };
          })
          .filter((c) => c !== null);

        console.log('Candidature formattate:', formattedCandidature);
        // Aggiorna lo stato con le candidature formattate
        setCandidature(formattedCandidature);
      } else {
        setCandidature([]);
      }
    } catch (err) {
      console.error(
        'Errore nel caricamento delle candidature:',
        err
      );
      setCandidature([]);
    }
  };

  // Seleziona un'offerta e carica le sue candidature
  const handleSelectOfferta = async (offerta) => {
    console.log('Offerta selezionata:', offerta);
    setSelectedOfferta(offerta);

    // Prima di caricare le candidature, assicuriamoci che l'offerta abbia un ID valido
    if (offerta && offerta.id) {
      console.log(
        'Caricamento candidature per offerta ID:',
        offerta.id
      );
      await fetchCandidature(offerta.id);
    } else {
      console.error(
        'Impossibile caricare candidature: offerta senza ID valido'
      );
      setCandidature([]);
    }
  };

  // Funzione per aggiornare i dati mancanti di una candidatura su Strapi
  const aggiornaMetadatiCandidatura = async (
    candidatura
  ) => {
    try {
      // Verifica che candidatura esista
      if (!candidatura) {
        console.error('Candidatura non valida:', candidatura);
        return;
      }

      // Supporta sia il formato con attributes che il formato flat
      const attrs = candidatura.attributes || candidatura;
      console.log('Aggiornamento metadati candidatura:', candidatura.id, attrs);

      // Se la candidatura ha già i dati completi, non fare nulla
      if (
        (attrs.nomeCandidato || attrs.nome) &&
        (attrs.cognomeCandidato || attrs.cognome) &&
        (attrs.emailCandidato || attrs.email)
      ) {
        console.log(
          'La candidatura ha già tutti i dati, non serve aggiornarla:',
          candidatura.id
        );
        return;
      }

      // Prepara i dati da aggiornare
      const updateData = {
        data: {
          nomeCandidato: attrs.nomeCandidato || attrs.nome || '',
          cognomeCandidato: attrs.cognomeCandidato || attrs.cognome || '',
          emailCandidato: attrs.emailCandidato || attrs.email || ''
        }
      };

      // Se la candidatura ha una relazione con l'utente, prendi i dati da lì
      if (
        attrs.user &&
        attrs.user.data
      ) {
        const userData =
          attrs.user.data.attributes || {};
        console.log(
          'Dati utente trovati per aggiornare la candidatura:',
          userData
        );

        // Aggiorna con i dati dell'utente se disponibili
        if (userData.username) updateData.data.nomeCandidato = userData.username;
        if (userData.Nome) updateData.data.nomeCandidato = userData.Nome;
        if (userData.nome) updateData.data.nomeCandidato = userData.nome;
        if (userData.Cognome) updateData.data.cognomeCandidato = userData.Cognome;
        if (userData.cognome) updateData.data.cognomeCandidato = userData.cognome;
        if (userData.email) updateData.data.emailCandidato = userData.email;
        if (userData.Email) updateData.data.emailCandidato = userData.Email;
      } 
      // Se non c'è un utente collegato, prova a recuperare i dati dal localStorage
      else {
        const userNome = localStorage.getItem('userNome') || '';
        const userCognome = localStorage.getItem('userCognome') || '';
        const userEmail = localStorage.getItem('userEmail') || '';
        
        if (userNome) updateData.data.nomeCandidato = userNome;
        if (userCognome) updateData.data.cognomeCandidato = userCognome;
        if (userEmail) updateData.data.emailCandidato = userEmail;
      }

      // Se abbiamo dei dati da aggiornare
      if (
        updateData.data.nomeCandidato ||
        updateData.data.cognomeCandidato ||
        updateData.data.emailCandidato
      ) {
        console.log(
          'Aggiornamento candidatura con ID:',
          candidatura.id,
          'Dati:',
          updateData
        );

        // Aggiorna la candidatura su Strapi
        try {
          const response = await axios.put(
            `http://localhost:1337/api/candidaturas/${candidatura.id}`,
            updateData,
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log(
            'Candidatura aggiornata con successo:',
            response.data
          );
        } catch (updateError) {
          console.error(
            "Errore nell'aggiornamento della candidatura:",
            updateError
          );
          
          // Prova un approccio alternativo con l'endpoint personalizzato
          try {
            console.log('Tentativo con endpoint personalizzato');
            const response = await axios({
              method: 'put',
              url: `http://localhost:1337/api/candidatura/${candidatura.id}/metadata`,
              data: {
                nome: updateData.data.nomeCandidato,
                cognome: updateData.data.cognomeCandidato,
                email: updateData.data.emailCandidato
              },
              headers: {
                Authorization: `Bearer ${jwt}`,
                'Content-Type': 'application/json',
              },
            });
            
            console.log(
              'Candidatura aggiornata con successo tramite endpoint personalizzato:',
              response.data
            );
          } catch (customError) {
            console.error(
              "Errore anche con l'endpoint personalizzato:",
              customError
            );
          }
        }
      } else {
        console.log('Nessun dato utente trovato per aggiornare la candidatura:', candidatura.id);
      }
    } catch (err) {
      console.error(
        "Errore nell'aggiornamento dei metadati della candidatura:",
        err
      );
    }
  };

  // Cambiamento input offerte
  const handleChange = (e) => {
    const { name, value } = e.target;
    setJob({ ...job, [name]: value });
  };

  // Invio offerta
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validazione campi obbligatori
    if (
      !job.Ruolo.trim() ||
      !job.Azienda.trim() ||
      !job.Luogo.trim() ||
      !job.TipoContratto.trim() ||
      !job.Descrizione.trim() ||
      !job.Scadenza.trim()
    ) {
      alert(
        "Tutti i campi sono obbligatori. Compila tutti i dati prima di pubblicare l'offerta."
      );
      return;
    }
    try {
      // Aggiungi la data di pubblicazione (oggi)
      const dataOggi = new Date()
        .toISOString()
        .split('T')[0]; // Formato YYYY-MM-DD

      const offerData = {
        Ruolo: job.Ruolo,
        Azienda: job.Azienda,
        Luogo: job.Luogo,
        TipoContratto: job.TipoContratto,
        Descrizione: job.Descrizione,
        pubblicazione: dataOggi,
        scadenza: job.Scadenza,
        user: user.id
      };

      console.log('Invio offerta con dati:', offerData);

      const res = await axios.post(
        'http://localhost:1337/api/offertas',
        { data: offerData },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(
        'Risposta dalla creazione offerta:',
        res.data
      );

      alert('Offerta pubblicata con successo!');
      setJob({
        Ruolo: '',
        Azienda: '',
        Luogo: '',
        TipoContratto: '',
        Descrizione: '',
        Scadenza: '',
      });

      // Aggiorna la lista delle offerte se siamo nella tab di gestione
      if (activeTab === 'gestisci') {
        fetchOfferte();
      }

      // Passa alla tab di gestione offerte
      setActiveTab('gestisci');

      // Attendi un attimo e poi aggiorna le offerte anche nella tab di gestione
      setTimeout(() => {
        fetchOfferte();
      }, 1000);
    } catch (err) {
      console.error('Errore nella pubblicazione:', err);

      // Log dettagliato dell'errore
      if (err.response) {
        console.error(
          'Dettagli errore:',
          err.response.data
        );
        console.error(
          'Status errore:',
          err.response.status
        );
        console.error(
          'Headers errore:',
          err.response.headers
        );
        alert(
          `Errore ${err.response.status}: ${
            err.response.data?.error?.message ||
            "Errore durante la pubblicazione dell'offerta"
          }`
        );
      } else if (err.request) {
        console.error(
          'Nessuna risposta ricevuta:',
          err.request
        );
        alert(
          'Nessuna risposta dal server. Verifica la connessione.'
        );
      } else {
        console.error(
          'Errore di configurazione:',
          err.message
        );
        alert(`Errore: ${err.message}`);
      }
    }
  };

  const handleUpdateCandidatura = async (
    candidaturaId,
    nuovoStato
  ) => {
    try {
      console.log(
        `Tentativo di aggiornamento candidatura ID: ${candidaturaId} a stato: ${nuovoStato}`
      );

      // Verifica che l'ID sia valido
      if (
        !candidaturaId ||
        candidaturaId === 'ID non disponibile'
      ) {
        console.error(
          'ID candidatura non valido:',
          candidaturaId
        );
        alert('Errore: ID candidatura non valido');
        return;
      }

      // Stampa il token JWT per debug (oscurato per sicurezza)
      if (jwt) {
        console.log(
          'JWT disponibile:',
          jwt.substring(0, 10) +
            '...' +
            jwt.substring(jwt.length - 10)
        );
      } else {
        console.error('JWT non disponibile!');
      }

      // Assicurati che l'ID sia un numero
      const numericId = parseInt(candidaturaId, 10);
      if (isNaN(numericId)) {
        console.error(
          'ID candidatura non è un numero valido:',
          candidaturaId
        );
        alert(
          'Errore: ID candidatura non è un numero valido'
        );
        return;
      }

      // Trova la candidatura corrente nell'array delle candidature
      const candidaturaCorrente = candidature.find(
        (c) => c.id === numericId || c.id === candidaturaId
      );
      if (!candidaturaCorrente) {
        console.error(
          `Candidatura con ID ${numericId} non trovata nell'array delle candidature caricate:`,
          candidature.map((c) => c.id)
        );
        alert(
          `Errore: Candidatura con ID ${numericId} non trovata. Ricarica la pagina e riprova.`
        );
        return;
      }

      // Usa l'ID corretto dal database se disponibile
      const idEffettivo =
        candidaturaCorrente.idCorretto || numericId;
      console.log(
        `Usando ID effettivo per l'aggiornamento: ${idEffettivo} (originale: ${numericId})`
      );

      // Usa il nuovo endpoint personalizzato
      const url = `http://localhost:1337/api/candidatura/${idEffettivo}/status`;
      console.log('URL endpoint personalizzato:', url);

      // Dati semplificati per l'endpoint personalizzato
      const requestData = {
        stato: nuovoStato,
      };
      console.log(
        "Dati inviati all'endpoint personalizzato:",
        JSON.stringify(requestData)
      );

      // Chiamata all'endpoint personalizzato
      const response = await axios({
        method: 'put',
        url: url,
        data: requestData,
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(
        'Risposta aggiornamento stato:',
        response.data
      );

      // Aggiorna lo stato della candidatura localmente
      setCandidature((prevCandidature) =>
        prevCandidature.map((c) =>
          c.id === candidaturaId
            ? { ...c, stato: nuovoStato }
            : c
        )
      );

      // Salva lo stato nel localStorage
      try {
        // Carica gli stati esistenti
        let statiSalvati = {};
        const statiSalvatiJSON = localStorage.getItem(
          'candidatureStati'
        );
        if (statiSalvatiJSON) {
          statiSalvati = JSON.parse(statiSalvatiJSON);
        }

        // Aggiorna lo stato per questa candidatura
        statiSalvati[candidaturaId] = nuovoStato;

        // Salva nel localStorage
        localStorage.setItem(
          'candidatureStati',
          JSON.stringify(statiSalvati)
        );
        console.log(
          'Stato candidatura salvato nel localStorage:',
          { id: candidaturaId, stato: nuovoStato }
        );
      } catch (e) {
        console.error(
          'Errore nel salvataggio dello stato nel localStorage:',
          e
        );
      }

      alert(
        `Stato della candidatura aggiornato a: ${nuovoStato}`
      );
    } catch (err) {
      console.error(
        "Errore nell'aggiornamento dello stato:",
        err
      );

      // Log dettagliato dell'errore
      if (err.response) {
        console.error(
          'Status errore:',
          err.response.status
        );
        console.error(
          'Dati errore completi:',
          err.response.data
        );

        if (err.response.status === 404) {
          alert(
            "Errore: Candidatura non trovata nel database. Potrebbe essere stata eliminata o l'ID potrebbe essere cambiato."
          );
        } else if (err.response.status === 403) {
          alert(
            'Errore: Non hai i permessi necessari per modificare questa candidatura. Verifica i permessi su Strapi.'
          );
        } else {
          alert(
            `Errore ${err.response.status}: ${
              err.response.data?.error?.message ||
              "Errore durante l'aggiornamento dello stato"
            }`
          );
        }
      } else if (err.request) {
        console.error(
          'Nessuna risposta ricevuta:',
          err.request
        );
        alert(
          'Nessuna risposta dal server. Verifica la connessione.'
        );
      } else {
        console.error(
          'Errore di configurazione:',
          err.message
        );
        alert(`Errore: ${err.message}`);
      }
    }
  };

  const handleInviaFeedback = async (candidaturaId) => {
    if (!feedback.trim()) {
      alert('Inserisci un feedback prima di inviare');
      return;
    }

    try {
      console.log(
        `Tentativo di inviare feedback per candidatura ID: ${candidaturaId}`
      );

      // Verifica che l'ID sia valido
      if (
        !candidaturaId ||
        candidaturaId === 'ID non disponibile'
      ) {
        console.error(
          'ID candidatura non valido:',
          candidaturaId
        );
        alert('Errore: ID candidatura non valido');
        return;
      }

      // Assicurati che l'ID sia un numero
      const numericId = parseInt(candidaturaId, 10);
      if (isNaN(numericId)) {
        console.error(
          'ID candidatura non è un numero valido:',
          candidaturaId
        );
        alert(
          'Errore: ID candidatura non è un numero valido'
        );
        return;
      }

      // Trova la candidatura corrente nell'array delle candidature
      const candidaturaCorrente = candidature.find(
        (c) => c.id === numericId || c.id === candidaturaId
      );
      if (!candidaturaCorrente) {
        console.error(
          `Candidatura con ID ${numericId} non trovata nell'array delle candidature caricate:`,
          candidature.map((c) => c.id)
        );
        alert(
          `Errore: Candidatura con ID ${numericId} non trovata. Ricarica la pagina e riprova.`
        );
        return;
      }

      // Usa l'ID corretto dal database se disponibile
      const idEffettivo =
        candidaturaCorrente.idCorretto || numericId;
      console.log(
        `Usando ID effettivo per l'invio del feedback: ${idEffettivo} (originale: ${numericId})`
      );

      // Usa il nuovo endpoint personalizzato
      const url = `http://localhost:1337/api/candidatura/${idEffettivo}/feedback`;
      console.log(
        'URL endpoint personalizzato per feedback:',
        url
      );

      // Dati semplificati per l'endpoint personalizzato
      const requestData = {
        feedback: feedback,
      };
      console.log(
        "Dati feedback inviati all'endpoint personalizzato:",
        JSON.stringify(requestData)
      );

      // Chiamata all'endpoint personalizzato
      const response = await axios({
        method: 'put',
        url: url,
        data: requestData,
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(
        'Risposta invio feedback:',
        response.data
      );

      // Aggiorna il feedback della candidatura localmente
      setCandidature((prevCandidature) =>
        prevCandidature.map((c) =>
          c.id === candidaturaId
            ? { ...c, feedback: feedback }
            : c
        )
      );

      // Salva il feedback nel localStorage
      try {
        // Carica i feedback esistenti
        let feedbackSalvati = {};
        const feedbackSalvatiJSON = localStorage.getItem(
          'candidatureFeedback'
        );
        if (feedbackSalvatiJSON) {
          feedbackSalvati = JSON.parse(feedbackSalvatiJSON);
        }

        // Aggiorna il feedback per questa candidatura
        feedbackSalvati[candidaturaId] = feedback;

        // Salva nel localStorage
        localStorage.setItem(
          'candidatureFeedback',
          JSON.stringify(feedbackSalvati)
        );
        console.log(
          'Feedback candidatura salvato nel localStorage:',
          { id: candidaturaId, feedback }
        );
      } catch (e) {
        console.error(
          'Errore nel salvataggio del feedback nel localStorage:',
          e
        );
      }

      // Resetta il campo feedback
      setFeedback('');
      setSelectedCandidatura(null);

      alert('Feedback inviato con successo');
    } catch (err) {
      console.error("Errore nell'invio del feedback:", err);

      // Log dettagliato dell'errore
      if (err.response) {
        console.error(
          'Status errore feedback:',
          err.response.status
        );
        console.error(
          'Dati errore feedback:',
          err.response.data
        );
        alert(
          `Errore ${err.response.status}: ${
            err.response.data?.error?.message ||
            "Errore durante l'invio del feedback"
          }`
        );
      } else if (err.request) {
        console.error(
          'Nessuna risposta ricevuta:',
          err.request
        );
        alert(
          'Nessuna risposta dal server. Verifica la connessione.'
        );
      } else {
        console.error(
          'Errore di configurazione:',
          err.message
        );
        alert(`Errore: ${err.message}`);
      }
    }
  };

  const handleDeleteOfferta = async (offertaId) => {
    if (
      !window.confirm(
        'Sei sicuro di voler eliminare questa offerta?'
      )
    )
      return;

    try {
      // Verifica che l'offerta sia di proprietà del recruiter loggato
      // eslint-disable-next-line no-unused-vars
      const offerta = offerte.find(
        (o) => o.id === offertaId
      );

      // In una implementazione reale, dovremmo verificare che l'utente corrente
      // sia il creatore dell'offerta prima di permettere l'eliminazione
      // Per ora, permettiamo l'eliminazione di tutte le offerte

      await axios.delete(
        `http://localhost:1337/api/offertas/${offertaId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      // Aggiorna la lista delle offerte
      fetchOfferte();

      // Se l'offerta eliminata era quella selezionata, deselezionala
      if (
        selectedOfferta &&
        selectedOfferta.id === offertaId
      ) {
        setSelectedOfferta(null);
        setCandidature([]);
      }

      alert('Offerta eliminata con successo');
    } catch (err) {
      console.error(
        "Errore durante l'eliminazione dell'offerta:",
        err
      );
      alert("Errore durante l'eliminazione dell'offerta");
    }
  };

  // Se non c'è JWT, mostra la pagina di login
  if (!jwt) {
    <Navigate to="/login" />;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <p id="h1">Dashboard Recruiter</p>
        <div className="tabs">
          <button
            className={`tab-button ${
              activeTab === 'pubblica' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('pubblica')}
          >
            Pubblica Nuova Offerta
          </button>
          <button
            className={`tab-button ${
              activeTab === 'gestisci' ? 'active' : ''
            }`}
            onClick={() => {
              setActiveTab('gestisci');
              fetchOfferte();
            }}
          >
            Offerte
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'pubblica' && (
          <div className="pubblica-offerta">
            <h2>Pubblica una nuova offerta di lavoro</h2>
            <form
              onSubmit={handleSubmit}
              className="job-form"
            >
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Ruolo">
                    Ruolo/Posizione*
                  </label>
                  <input
                    type="text"
                    id="Ruolo"
                    name="Ruolo"
                    value={job.Ruolo}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Azienda">
                    Nome Azienda*
                  </label>
                  <input
                    type="text"
                    id="Azienda"
                    name="Azienda"
                    value={job.Azienda}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Luogo">
                    Luogo di lavoro*
                  </label>
                  <input
                    type="text"
                    id="Luogo"
                    name="Luogo"
                    value={job.Luogo}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="TipoContratto">
                    Tipo di contratto*
                  </label>
                  <select
                    id="TipoContratto"
                    name="TipoContratto"
                    value={job.TipoContratto}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleziona...</option>
                    <option value="Tempo indeterminato">
                      Tempo indeterminato
                    </option>
                    <option value="Tempo determinato">
                      Tempo determinato
                    </option>
                    <option value="Apprendistato">
                      Apprendistato
                    </option>
                    <option value="Stage/Tirocinio">
                      Stage/Tirocinio
                    </option>
                    <option value="Freelance/P.IVA">
                      Freelance/P.IVA
                    </option>
                    <option value="Consulenza">
                      Consulenza
                    </option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="Scadenza">
                  Data di scadenza*
                </label>
                <input
                  type="date"
                  id="Scadenza"
                  name="Scadenza"
                  value={job.Scadenza}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="Descrizione">
                  Descrizione offerta*
                </label>
                <textarea
                  id="Descrizione"
                  name="Descrizione"
                  value={job.Descrizione}
                  onChange={handleChange}
                  rows="6"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="submit-button"
              >
                Pubblica Offerta
              </button>
            </form>
          </div>
        )}

        {activeTab === 'gestisci' && (
          <div className="gestisci-offerte">
            <div className="offerte-section">
              <h2>Le tue offerte di lavoro</h2>
              {loading ? (
                <div className="loading">
                  Caricamento offerte...
                </div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : offerte.length === 0 ? (
                <div className="no-data">
                  Nessuna offerta pubblicata. Vai alla tab
                  "Pubblica Nuova Offerta" per iniziare.
                </div>
              ) : (
                <div className="offerte-list">
                  <div className="offerta-header">
                    <div className="offerta-cell">
                      Ruolo
                    </div>
                    <div className="offerta-cell">
                      Azienda
                    </div>
                    <div className="offerta-cell">
                      Luogo
                    </div>
                    <div className="offerta-cell">Tipo</div>
                    <div className="offerta-cell">
                      Pubblicata
                    </div>
                    <div className="offerta-cell">
                      Scadenza
                    </div>
                    <div className="offerta-cell">
                      Azioni
                    </div>
                  </div>
                  {offerte.map((offerta) => (
                    <div
                      key={offerta.id}
                      className={`offerta-row ${
                        selectedOfferta &&
                        selectedOfferta.id === offerta.id
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        handleSelectOfferta(offerta)
                      }
                    >
                      <div className="offerta-cell">
                        {offerta.ruolo}
                      </div>
                      <div className="offerta-cell">
                        {offerta.azienda}
                      </div>
                      <div className="offerta-cell">
                        {offerta.luogo}
                      </div>
                      <div className="offerta-cell">
                        {offerta.tipoContratto}
                      </div>
                      <div className="offerta-cell">
                        {offerta.pubblicazione}
                      </div>
                      <div className="offerta-cell">
                        {offerta.scadenza}
                      </div>
                      <div className="offerta-cell actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOfferta(offerta.id);
                          }}
                          className="delete-button"
                          
                          title={
                            'Elimina offerta'
                            }
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedOfferta && (
              <div className="candidature-section">
                <h3>
                  Candidature per: {selectedOfferta.ruolo} -{' '}
                  {selectedOfferta.azienda}
                </h3>
                {candidature.length === 0 ? (
                  <div className="no-data">
                    Nessuna candidatura ricevuta per questa
                    offerta.
                  </div>
                ) : (
                  <div className="candidature-table">
                    {/* Intestazione blu a tutta larghezza */}
                    <div className="tabella-candidature-header">
                      <div className="header-cell">
                        Data
                      </div>
                      <div className="header-cell">
                        Candidato
                      </div>
                      <div className="header-cell">CV</div>
                      <div className="header-cell">
                        Stato
                      </div>
                      <div className="header-cell">
                        Azioni
                      </div>
                    </div>

                    {/* Righe di dati sotto l'intestazione */}
                    {candidature.map((candidatura) => (
                      <div
                        key={candidatura.id}
                        className="tabella-candidature-row"
                      >
                        {/* Cella Data */}
                        <div className="tabella-candidature-cell">
                          {candidatura.dataCandidatura}
                        </div>

                        {/* Cella Candidato */}
                        <div className="tabella-candidature-cell">
                          {candidatura.nome !==
                            'Nome non disponibile' &&
                          candidatura.nome ? (
                            `${candidatura.nome} ${
                              candidatura.cognome || ''
                            }`
                          ) : (
                            <span className="missing-data">
                              Dati candidato non disponibili
                            </span>
                          )}
                          <div className="candidato-email">
                            {candidatura.email &&
                            candidatura.email !==
                              'Email non disponibile' ? (
                              candidatura.email
                            ) : (
                              <span className="missing-data">
                                Email non disponibile
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cella CV */}
                        <div className="tabella-candidature-cell">
                          {candidatura.cv ? (
                            <a
                              href={candidatura.cv}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cv-link"
                            >
                              Visualizza CV
                            </a>
                          ) : (
                            <span className="no-cv">
                              CV non disponibile
                            </span>
                          )}
                        </div>

                        {/* Cella Stato */}
                        <div className="tabella-candidature-cell">
                          <span
                            className={`stato ${candidatura.stato}`}
                          >
                            {candidatura.stato}
                          </span>
                        </div>

                        {/* Cella Azioni */}
                        <div className="tabella-candidature-cell">
                          <div className="stato-buttons">
                            <button
                              onClick={() =>
                                handleUpdateCandidatura(
                                  candidatura.id,
                                  'in valutazione'
                                )
                              }
                              className="stato-button valutazione"
                              disabled={
                                candidatura.stato ===
                                'in valutazione'
                              }
                            >
                              In valutazione
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateCandidatura(
                                  candidatura.id,
                                  'accettata'
                                )
                              }
                              className="stato-button accettata"
                              disabled={
                                candidatura.stato ===
                                'accettata'
                              }
                            >
                              Accettata
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateCandidatura(
                                  candidatura.id,
                                  'rifiutata'
                                )
                              }
                              className="stato-button rifiutata"
                              disabled={
                                candidatura.stato ===
                                'rifiutata'
                              }
                            >
                              Rifiutata
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedCandidatura(
                                candidatura.id ===
                                  selectedCandidatura
                                  ? null
                                  : candidatura.id
                              )
                            }
                            className="feedback-button"
                          >
                            {candidatura.id ===
                            selectedCandidatura
                              ? 'Chiudi'
                              : 'Feedback'}
                          </button>

                          {/* Feedback form and existing feedback */}
                          {candidatura.id ===
                            selectedCandidatura && (
                            <div className="feedback-form">
                              <textarea
                                value={feedback}
                                onChange={(e) =>
                                  setFeedback(
                                    e.target.value
                                  )
                                }
                                placeholder="Scrivi un feedback per il candidato..."
                              ></textarea>
                              <button
                                onClick={() =>
                                  handleInviaFeedback(
                                    candidatura.id
                                  )
                                }
                              >
                                Invia Feedback
                              </button>
                            </div>
                          )}
                          {candidatura.feedback && (
                            <div className="existing-feedback">
                              <div className="feedback-label">
                                Feedback inviato:
                              </div>
                              <div className="feedback-text">
                                {candidatura.feedback}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
