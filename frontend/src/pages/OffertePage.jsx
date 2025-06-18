import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';
import InputField from '../components/UI/InputField';
import IconComponent from '../components/UI/IconComponent';
import Button from '../components/UI/Button';
import OffersList from '../components/Offer/OffersList';
import OfferDetails from '../components/Offer/OfferDetails';
import CandidaturaModal from '../components/Candidatura/CandidaturaModal';
import axios from 'axios';
import './OffertePage.css';
import { useNavigate } from 'react-router-dom';
import FilterModal from '../components/Filter/FilterModal';

export default function OffertePage() {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favoriteOffers, setFavoriteOffers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCandidaturaModal, setShowCandidaturaModal] =
    useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(
    new Date()
  );
  const [, setRefreshing] = useState(false);
  const jwt = localStorage.getItem('jwt');
  const navigate = useNavigate();

  const [showFilterModal, setShowFilterModal] =
    useState(false);
  const [activeFilters, setActiveFilters] = useState({
    location: '',
    workMode: '',
    contractType: '',
  });
  const [baseOffers, setBaseOffers] = useState([]); // Per mantenere le offerte originali

  // Recupera ruolo utente
  const userStr = localStorage.getItem('user');
  let userRole = null;
  try {
    userRole = userStr
      ? JSON.parse(userStr).role?.toLowerCase()
      : null;
  } catch (e) {
    console.error('errore nel prendere il ruolo', e);
    userRole = null;
  }
  const handleSubmitCandidatura = async (
    cvFile,
    useCvFromProfile
  ) => {
    try {
      if (!selectedOffer) {
        throw new Error('Nessuna offerta selezionata');
      }

      // Controlla se l'utente è autenticato
      if (!jwt) {
        throw new Error('Utente non autenticato');
      }

      // Recupera l'ID utente
      const userStr = localStorage.getItem('user');
      let user = null;
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        throw new Error(
          'Errore nel parsing dei dati utente'
        );
      }

      if (!user || !user.id) {
        throw new Error('Dati utente non validi');
      }

      console.log('Invio candidatura - User ID:', user.id);
      console.log(
        'Invio candidatura - Offerta ID:',
        selectedOffer.id
      );

      // Prepara i dati della candidatura
      const candidaturaData = {
        data: {
          user: user.id,
          offerta: selectedOffer.id,
          stato: 'inviata',
          dataCandidatura: new Date()
            .toISOString()
            .split('T')[0],
        },
      };

      // Aggiungi i metadati del candidato alla candidatura direttamente dal localStorage
      try {
        // Invece di chiamare l'API, usa i dati già salvati nel localStorage
        const userNome =
          localStorage.getItem('userNome') || '';
        const userCognome =
          localStorage.getItem('userCognome') || '';
        const userEmail = user.email || '';

        console.log(
          'Invio candidatura - Dati utente dal localStorage:',
          {
            nome: userNome,
            cognome: userCognome,
            email: userEmail,
          }
        );

        candidaturaData.data.nomeCandidato = userNome;
        candidaturaData.data.cognomeCandidato = userCognome;
        candidaturaData.data.emailCandidato = userEmail;
      } catch (error) {
        console.error(
          'Errore nel recupero dei dati utente dal localStorage:',
          error
        );
        // Continua comunque, i dati utente non sono critici
      }

      console.log(
        'Invio candidatura - Dati da inviare:',
        candidaturaData
      );

      // Crea la candidatura
      const candidaturaResponse = await axios.post(
        'http://localhost:1337/api/candidaturas',
        candidaturaData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(
        'Invio candidatura - Risposta creazione:',
        candidaturaResponse.data
      );

      if (
        !candidaturaResponse.data ||
        !candidaturaResponse.data.data ||
        !candidaturaResponse.data.data.id
      ) {
        throw new Error(
          'Risposta API non valida: ID candidatura mancante'
        );
      }

      const candidaturaId =
        candidaturaResponse.data.data.id;
      console.log(
        'Invio candidatura - ID candidatura creata:',
        candidaturaId
      );

      // Se l'utente ha scelto di utilizzare il CV dal profilo
      if (useCvFromProfile) {
        try {
          console.log(
            'Invio candidatura - Recupero CV dal profilo'
          );
          // Recupera il CV dal profilo
          const profileResponse = await axios.get(
            `http://localhost:1337/api/profilo-candidatos?populate=cv&filters[user][id][$eq]=${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            }
          );

          console.log(
            'Invio candidatura - Risposta profilo:',
            profileResponse.data
          );

          // Verifica se il profilo ha un CV
          let cvId = null;
          if (
            profileResponse.data &&
            profileResponse.data.data &&
            profileResponse.data.data.length > 0
          ) {
            const profiloCandidato =
              profileResponse.data.data[0];

            // Controlla se c'è un CV nel campo cv
            if (
              profiloCandidato.attributes.cv &&
              profiloCandidato.attributes.cv.data
            ) {
              cvId = profiloCandidato.attributes.cv.data.id;
              console.log(
                'Invio candidatura - CV trovato nel campo cv, ID:',
                cvId
              );
            }
            // Controlla anche il campo CV (maiuscolo)
            else if (
              profiloCandidato.attributes.CV &&
              profiloCandidato.attributes.CV.data
            ) {
              cvId = profiloCandidato.attributes.CV.data.id;
              console.log(
                'Invio candidatura - CV trovato nel campo CV, ID:',
                cvId
              );
            } else {
              console.log(
                'Invio candidatura - Nessun CV trovato nel profilo'
              );
            }
          }

          if (cvId) {
            // Collega il CV esistente alla candidatura
            console.log(
              'Invio candidatura - Collegamento CV alla candidatura, CV ID:',
              cvId
            );
            await axios.put(
              `http://localhost:1337/api/candidaturas/${candidaturaId}`,
              {
                data: {
                  CV: cvId,
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${jwt}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            console.log(
              'Invio candidatura - CV collegato con successo'
            );
          } else {
            throw new Error('CV non trovato nel profilo');
          }
        } catch (error) {
          console.error(
            'Errore nel recupero del CV dal profilo:',
            error
          );
          throw new Error(
            'Impossibile utilizzare il CV dal profilo: ' +
              error.message
          );
        }
      } else if (cvFile) {
        // Se l'utente ha caricato un nuovo CV
        console.log(
          'Invio candidatura - Caricamento nuovo CV'
        );
        const formData = new FormData();
        formData.append('files', cvFile);
        formData.append(
          'ref',
          'api::candidatura.candidatura'
        );
        formData.append('refId', candidaturaId);
        formData.append('field', 'CV');

        // Carica il CV
        try {
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
          console.log(
            'Invio candidatura - CV caricato con successo:',
            uploadResponse.data
          );
        } catch (uploadError) {
          console.error(
            'Errore nel caricamento del CV:',
            uploadError
          );
          throw new Error(
            'Errore nel caricamento del CV: ' +
              uploadError.message
          );
        }
      }

      // Chiudi il modal e mostra un messaggio di successo
      setShowCandidaturaModal(false);
      alert('Candidatura inviata con successo!');
    } catch (error) {
      console.error(
        "Errore durante l'invio della candidatura:",
        error
      );
      alert(
        `Errore durante l'invio della candidatura: ${error.message}`
      );
      throw error; // Rilancia l'errore per gestirlo nel componente CandidaturaModal
    }
  };
  const handleDeleteOffer = async (offerId) => {
    if (
      !window.confirm(
        'Sei sicuro di voler eliminare questa offerta?'
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:1337/api/offertas/${offerId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      // Rimuovi l'offerta dalla lista
      const updatedOffers = offers.filter(
        (offer) => offer.id !== offerId
      );
      setOffers(updatedOffers);
      setFilteredOffers(updatedOffers);

      // Se l'offerta eliminata era quella selezionata, deselezionala
      if (selectedOffer && selectedOffer.id === offerId) {
        setSelectedOffer(null);
      }

      alert('Offerta eliminata con successo!');
    } catch (error) {
      console.error(
        "Errore durante l'eliminazione dell'offerta:",
        error
      );
      alert(
        "Errore durante l'eliminazione dell'offerta. Riprova più tardi."
      );
    }
  };

  // Stili per i componenti UI
  const styles = {
    input: {
      width: '100%',
      height: '45px',
      borderRadius: '12px',
      border: '1px solid #ddd',
      fontSize: '16px',
    },
    button: {
      width: '75px',
      height: '45px',
      borderRadius: '12px',
      border: '1px solid #ddd',
      fontSize: '14px',
      backgroundColor: 'white',
      textColor: '#333',
    },
  };

  // Funzione per caricare le offerte dal backend
  const fetchOffers = useCallback(
    async (retryCount = 0) => {
      setRefreshing(true);
      try {
        const response = await axios.get(
          'http://localhost:1337/api/offertas?populate=*',
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(
          'Risposta API completa:',
          response.data
        );

        if (
          !response.data.data ||
          !Array.isArray(response.data.data)
        ) {
          console.error(
            'Formato risposta offerte non valido'
          );
          setError(
            'Formato risposta offerte non valido. Riprova più tardi.'
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // Trasforma i dati dal formato Strapi a quello richiesto dal componente
        const formattedOffers = response.data.data
          .map((offer) => {
            // Log dell'offerta completa per debug
            console.log('Offerta da elaborare:', offer.id);

            // Gestisce sia offerte con attributes che offerte con campi diretti
            // Alcune offerte hanno i campi direttamente nell'oggetto principale,
            // altre hanno i campi nell'oggetto attributes
            const offerData = offer.attributes || offer;

            if (!offerData) {
              console.error('Offerta senza dati:', offer);
              return null;
            }

            // Estrai l'id dell'utente dalla relazione user
            let userId = null;
            let userData = null;

            // Gestisci le diverse strutture possibili per l'utente
            if (offerData.user) {
              if (offerData.user.data) {
                // Formato standard di Strapi
                userId = offerData.user.data.id;
                userData = {
                  id: userId,
                  attributes:
                    offerData.user.data.attributes || {},
                };
              } else if (offerData.user.id) {
                // Formato alternativo diretto
                userId = offerData.user.id;
                userData = offerData.user;
              } else if (
                typeof offerData.user === 'number'
              ) {
                // Solo ID dell'utente
                userId = offerData.user;
                userData = { id: userId };
              }
              console.log(
                'Dati utente trovati:',
                userId,
                userData
              );
            } else {
              console.log(
                "Nessun dato utente associato all'offerta:",
                offer.id
              );
            }

            // Formatta correttamente le date
            let postedDate = 'Data non disponibile';
            let closingDate = 'Non specificata';

            try {
              if (offerData.pubblicazione) {
                postedDate = new Date(
                  offerData.pubblicazione
                ).toLocaleDateString('it-IT');
              }

              if (offerData.scadenza) {
                closingDate = new Date(
                  offerData.scadenza
                ).toLocaleDateString('it-IT');
              }
            } catch (dateError) {
              console.error(
                'Errore nella formattazione delle date:',
                dateError
              );
            }

            return {
              id: offer.id,
              title:
                offerData.Ruolo ||
                'Posizione non specificata',
              company:
                offerData.Azienda ||
                'Azienda non specificata',
              location:
                offerData.Luogo || 'Luogo non specificato',
              jobType:
                offerData.TipoContratto ||
                'Tipo non specificato',
              description:
                offerData.Descrizione ||
                'Nessuna descrizione disponibile',
              postedDate: postedDate,
              closingDate: closingDate,
              userId: userId,
              user: userData,
            };
          })
          .filter((offer) => offer !== null);

        console.log(
          'Offerte formattate correttamente:',
          formattedOffers
        );
        setOffers(formattedOffers);
        setBaseOffers(formattedOffers); // Salva le offerte originali

        // Applica il filtro corrente alle nuove offerte
        if (
          activeFilters.location ||
          activeFilters.workMode ||
          activeFilters.contractType ||
          searchTerm.trim() !== ''
        ) {
          applyFilters(activeFilters);
        } else {
          setFilteredOffers(formattedOffers);
        }

        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
        setError('');
      } catch (err) {
        console.error(
          'Errore nel caricamento delle offerte:',
          err
        );

        if (err.response) {
          // Se l'errore è 403 (Forbidden), potrebbe essere un problema di autorizzazione
          if (err.response.status === 403) {
            setError(
              'Errore di autorizzazione. Verifica di essere correttamente autenticato.'
            );
          } else {
            setError(
              `Errore ${err.response.status}: ${
                err.response.data?.error?.message ||
                'Errore durante il caricamento delle offerte'
              }`
            );
          }
        } else if (err.request) {
          setError(
            'Nessuna risposta dal server. Verifica la connessione e che il server sia in esecuzione.'
          );
        } else {
          setError(`Errore: ${err.message}`);
        }

        // Implementa un meccanismo di retry automatico (massimo 3 tentativi)
        if (retryCount < 2) {
          setTimeout(() => {
            fetchOffers(retryCount + 1);
          }, 3000); // Riprova dopo 3 secondi
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [jwt, searchTerm]
  );

  // Carica le offerte all'avvio e imposta un polling ogni 30 secondi
  useEffect(() => {
    fetchOffers();

    // Polling ogni 30 secondi per mantenere aggiornata la lista
    const pollingInterval = setInterval(() => {
      fetchOffers();
    }, 30000); // 30 secondi

    // Pulisci l'intervallo quando il componente viene smontato
    return () => {
      clearInterval(pollingInterval);
    };
  }, [jwt, fetchOffers]);

  // Carica il profilo utente per verificare se ha già un CV
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!jwt) return;
      // Controlla il ruolo dell'utente
      const userStr = localStorage.getItem('user');
      let user = null;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error(
          'Errore nel parsing dei dati utente',
          e
        );
      }
      if (
        !user ||
        user.role?.toLowerCase() !== 'candidato'
      ) {
        // Se non è candidato, non chiamare l'API del profilo candidato
        return;
      }
      try {
        const response = await axios.get(
          'http://localhost:1337/api/profilo-candidatos?populate=*',
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
        if (
          response.data.data &&
          response.data.data.length > 0
        ) {
          setUserProfile(response.data.data[0]);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error(
          'Errore nel caricamento del profilo:',
          err
        );
      }
    };
    fetchUserProfile();
  }, [jwt]);

  // Funzione per gestire la ricerca con filtri attivi
  const handleSearch = (e) => {
  setSearchTerm(e.target.value);

  // Determina il set di offerte di partenza
  const sourceOffers = showOnlyFavorites ? favoriteOffers : baseOffers;

  // Se non ci sono filtri attivi, usa la logica di ricerca
  if (
    !activeFilters.location &&
    !activeFilters.workMode &&
    !activeFilters.contractType
  ) {
    if (e.target.value.trim() === '') {
      setFilteredOffers(sourceOffers);
    } else {
      const filtered = sourceOffers.filter(
        (offer) =>
          offer.title
            .toLowerCase()
            .includes(e.target.value.toLowerCase()) ||
          offer.company
            .toLowerCase()
            .includes(e.target.value.toLowerCase()) ||
          offer.description
            .toLowerCase()
            .includes(e.target.value.toLowerCase())
      );
      setFilteredOffers(filtered);
    }
  } else {
    // Se ci sono filtri attivi, riapplica tutti i filtri inclusa la nuova ricerca
    applyFilters(activeFilters);
  }
};

  // Funzione per applicare i filtri
  const handleFilter = () => {
    setShowFilterModal(true);
    setSelectedOffer(null);
  };

  // Aggiungi questa nuova funzione per applicare i filtri
  const applyFilters = (filters) => {
  setActiveFilters(filters);

  // Determina il set di offerte di partenza - aggiorna i preferiti prima
  let sourceOffers;
  if (showOnlyFavorites) {
    const favoriteIds = loadFavorites();
    sourceOffers = baseOffers.filter(offer => favoriteIds.includes(offer.id));
  } else {
    sourceOffers = baseOffers;
  }
  
  let filtered = [...sourceOffers];

  // Applica i filtri come prima
  if (filters.location && filters.location !== '') {
    filtered = filtered.filter((offer) =>
      offer.location
        .toLowerCase()
        .includes(filters.location.toLowerCase())
    );
  }

  if (filters.workMode && filters.workMode !== '') {
    filtered = filtered.filter((offer) => {
      const description = offer.description.toLowerCase();
      const location = offer.location.toLowerCase();

      switch (filters.workMode) {
        case 'remoto':
          return (
            description.includes('remoto') ||
            description.includes('remote') ||
            location.includes('remoto')
          );
        case 'ufficio':
          return (
            !description.includes('remoto') &&
            !description.includes('remote') &&
            !location.includes('remoto')
          );
        case 'ibrido':
          return (
            description.includes('ibrido') ||
            description.includes('hybrid') ||
            description.includes('flessibile')
          );
        default:
          return true;
      }
    });
  }

  if (filters.contractType && filters.contractType !== '') {
    filtered = filtered.filter((offer) =>
      offer.jobType
        .toLowerCase()
        .includes(filters.contractType.toLowerCase())
    );
  }

  // Applica la ricerca testuale se presente
  if (searchTerm.trim() !== '') {
    filtered = filtered.filter(
      (offer) =>
        offer.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        offer.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        offer.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }

  setFilteredOffers(filtered);
};

// Funzione per caricare i preferiti dal localStorage
const loadFavorites = useCallback(() => {
  try {
    const favorites = localStorage.getItem('favorites');
    return JSON.parse(favorites);
  } catch (error) {
    console.error('Errore nel caricamento dei preferiti:', error);
    return [];
  }
}, []);

// Funzione per aggiornare la lista dei preferiti
const updateFavoritesList = useCallback(() => {
  const favoriteIds = loadFavorites();
  const favoriteOffersList = filteredOffers.filter(offer => 
    favoriteIds.includes(offer.id)
  );
  setFavoriteOffers(favoriteOffersList);
}, [filteredOffers, loadFavorites]);

// Funzione per gestire il toggle dei preferiti
const handleToggleFavorites = () => {
  const newShowOnlyFavorites = !showOnlyFavorites;
  setShowOnlyFavorites(newShowOnlyFavorites);
  
  if (newShowOnlyFavorites) {
    // Prima aggiorna la lista dei preferiti, poi mostrala
    const favoriteIds = loadFavorites();
    const favoriteOffersList = baseOffers.filter(offer => 
      favoriteIds.includes(offer.id)
    );
    setFavoriteOffers(favoriteOffersList);
    setFilteredOffers(favoriteOffersList);
    console.log("Modalità preferiti attivata, offerte mostrate:", favoriteOffersList.length);
  } else {
    // Mostra tutte le offerte con i filtri attuali
    if (
      !activeFilters.location &&
      !activeFilters.workMode &&
      !activeFilters.contractType &&
      searchTerm.trim() === ''
    ) {
      setFilteredOffers(baseOffers);
    } else {
      applyFilters(activeFilters);
    }
    console.log("Modalità preferiti disattivata, mostrate tutte le offerte");
  }
  
  // Deseleziona l'offerta corrente quando si cambia modalità
  setSelectedOffer(null);
};

const forceUpdateFavorites = () => {
  console.log("Forzato aggiornamento preferiti");
  updateFavoritesList();
  
  // Se siamo in modalità preferiti, aggiorna anche la visualizzazione
  if (showOnlyFavorites) {
    const favoriteIds = loadFavorites();
    const favoriteOffersList = baseOffers.filter(offer => 
      favoriteIds.includes(offer.id)
    );
    setFilteredOffers(favoriteOffersList);
  }
};

useEffect(() => {
  const handleWindowFocus = () => {
    console.log("Finestra tornata in focus, aggiornamento preferiti...");
    forceUpdateFavorites();
  };

  window.addEventListener('focus', handleWindowFocus);
  
  return () => {
    window.removeEventListener('focus', handleWindowFocus);
  };
}, []);

// useEffect per aggiornare i preferiti quando cambiano le offerte
useEffect(() => {
  updateFavoritesList();
}, [offers, updateFavoritesList]);

// useEffect per ascoltare i cambiamenti nel localStorage
useEffect(() => {
  const handleStorageChange = (e) => {
    // Aggiorna solo se il cambiamento riguarda i preferiti
    if (!e || e.key === 'favorites' || e.key === null) {
      console.log("Cambiamento nel localStorage rilevato, aggiornamento preferiti...");
      updateFavoritesList();
    }
  };

  const handleCustomFavoritesChange = () => {
    console.log("Evento personalizzato preferiti ricevuto");
    updateFavoritesList();
  };

  // Ascolta i cambiamenti nel localStorage da altre parti dell'app
  window.addEventListener('storage', handleStorageChange);
  
  // Ascolta un evento personalizzato per i cambiamenti nel localStorage dalla stessa finestra
  window.addEventListener('favoritesChanged', handleCustomFavoritesChange);

  // Forza un aggiornamento iniziale
  updateFavoritesList();

  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('favoritesChanged', handleCustomFavoritesChange);
  };
}, [updateFavoritesList]);

useEffect(() => {
  // Controlla i preferiti ogni 2 secondi solo se la modalità preferiti è attiva
  let favoritesInterval;
  
  if (showOnlyFavorites) {
    favoritesInterval = setInterval(() => {
      const currentFavoriteIds = loadFavorites();
      const currentFavoriteOfferIds = favoriteOffers.map(offer => offer.id);
      
      // Controlla se ci sono differenze
      const hasChanges = currentFavoriteIds.length !== currentFavoriteOfferIds.length ||
        currentFavoriteIds.some(id => !currentFavoriteOfferIds.includes(id));
      
      if (hasChanges) {
        console.log("Differenze rilevate nei preferiti, aggiornamento...");
        updateFavoritesList();
      }
    }, 2000);
  }

  return () => {
    if (favoritesInterval) {
      clearInterval(favoritesInterval);
    }
  };
}, [showOnlyFavorites, favoriteOffers, loadFavorites, updateFavoritesList]);

  // Aggiungi questa funzione per chiudere il modal
  const handleCloseFilterModal = () => {
    setShowFilterModal(false);
  };

  // Funzione per gestire il click su un'offerta
  const handleOfferClick = (offerId) => {
    const offer = offers.find((o) => o.id === offerId);
    setSelectedOffer(offer);
  };

  // Funzione per gestire la candidatura
  const handleApply = () => {
    setShowCandidaturaModal(true);
  };

  // Funzione per chiudere il modal di candidatura
  const handleCloseCandidaturaModal = () => {
    setShowCandidaturaModal(false);
  };

  // Funzione per aggiornare manualmente le offerte
  const handleManualRefresh = () => {
    fetchOffers();
  };

  // Funzione per gestire il click sul pulsante "Pubblica Offerta"
  const handleGestioneOfferte = () => {
    navigate('/dashboard/recruiter');
  };

  return (
    <div className="offerte-page">
      <div className="offerte-header">
        <p>
          Esplora tutte le offerte di lavoro disponibili
        </p>

        <div className="search-container">
          <InputField
            placeholder="Cerca offerte di lavoro..."
            width={styles.input.width}
            height={styles.input.height}
            borderRadius={styles.input.borderRadius}
            border={styles.input.border}
            fontSize={styles.input.fontSize}
            onChange={handleSearch}
            value={searchTerm}
            icon={
              <IconComponent
                iconName="search-icon"
                size={18}
              />
            }
            iconPosition="left"
            leftIconOffset="15px"
          />
          <Button
            text="Filtra"
            width={styles.button.width}
            height={styles.button.height}
            borderRadius={styles.button.borderRadius}
            border={styles.button.border}
            fontSize={styles.button.fontSize}
            backgroundColor={styles.button.backgroundColor}
            textColor={styles.button.textColor}
            onClick={handleFilter}
            icon={
              <IconComponent
                iconName="filter-icon"
                size={18}
              />
            }
          />
          <Button
            text={showOnlyFavorites ? "Tutte" : "Preferite"}
            width={styles.button.width}
            height={styles.button.height}
            borderRadius={styles.button.borderRadius}
            border={styles.button.border}
            fontSize={styles.button.fontSize}
            backgroundColor={showOnlyFavorites ? "#1e3a8a" : styles.button.backgroundColor}
            textColor={showOnlyFavorites ? "white" : styles.button.textColor}
            /* VA INSERITA LA LOGICA MOSTRARE I PREFERITI*/
            onClick={handleToggleFavorites}
          />
          {(activeFilters.location ||
            activeFilters.workMode ||
            activeFilters.contractType) && (
            <div className="active-filters-indicator">
              <span className="filters-count">
                <strong>
                  {
                    [
                      activeFilters.location,
                      activeFilters.workMode,
                      activeFilters.contractType,
                    ].filter(Boolean).length
                  }
                </strong>
                &nbsp;filtri attivi
              </span>
            </div>
          )}
          {showFilterModal && (
            <FilterModal
              isOpen={showFilterModal}
              onClose={handleCloseFilterModal}
              onApplyFilters={applyFilters}
              offers={baseOffers}
            />
          )}
        </div>

        <div className="refresh-button-container">
          <div style={{ display: 'flex', gap: '10px' }}>
            {userRole === 'recruiter' && (
              <Button
                text="Gestione offerte"
                onClick={handleGestioneOfferte}
                backgroundColor="#1e3a8a"
                textColor="white"
                width="160px"
                height="35px"
                fontSize="14px"
                borderRadius="8px"
              />
            )}
          </div>
          {userRole === 'recruiter' && (
            <div className="last-updated">
              Aggiornato alle:{' '}
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-container">
          <div className="error">{error}</div>
          <Button
            text="Riprova"
            onClick={handleManualRefresh}
            backgroundColor="#1e3a8a"
            textColor="white"
            width="120px"
            height="35px"
            fontSize="14px"
            borderRadius="8px"
          />
        </div>
      )}

      {!error && (
        <div className="offerte-content">
          {loading ? (
            <div className="loading">
              Caricamento offerte...
            </div>
          ) : (
            <>
              <OffersList
                offers={filteredOffers}
                onOfferClick={handleOfferClick}
                selectedOfferId={
                  selectedOffer ? selectedOffer.id : null
                }
              />

              <div className="offer-details-container">
                {selectedOffer ? (
                  <OfferDetails
                    offer={selectedOffer}
                    onApply={handleApply}
                    userRole={
                      userRole === 'candidato'
                        ? 'candidato'
                        : 'recruiter'
                    }
                    isOwner={isOfferOwnedByCurrentUser(
                      selectedOffer
                    )}
                    onDelete={handleDeleteOffer}
                  />
                ) : (
                  <div className="no-offer-selected">
                    Seleziona un'offerta per visualizzare i
                    dettagli
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {showCandidaturaModal && (
        <CandidaturaModal
          onClose={handleCloseCandidaturaModal}
          onSubmit={handleSubmitCandidatura}
          offerId={selectedOffer?.id}
          hasProfileCV={
            userProfile &&
            userProfile.attributes &&
            userProfile.attributes.CV &&
            userProfile.attributes.CV.data
          }
        />
      )}
    </div>
  );

  // Funzione per verificare se l'offerta è di proprietà dell'utente corrente
  function isOfferOwnedByCurrentUser(offer) {
    if (!offer || !offer.userId) return false;

    const userStr = localStorage.getItem('user');
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return false;
    }

    if (!user || !user.id) return false;

    return parseInt(offer.userId) === parseInt(user.id);
  }

  // Funzione per eliminare un'offerta

  // Funzione per inviare una candidatura
}
