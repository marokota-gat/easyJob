import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import Button from '../UI/Button';
import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import './NavBarStyles.css';
import axios from 'axios';

// importare il logo da figma
// tutorial su come creare navbar in react

export default function NavBar() {
  // eslint-disable-next-line no-unused-vars
  const [userInfo, setUserInfo] = useState(null);
  const [role, setRole] = useState(null);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [nomeAzienda, setNomeAzienda] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [imageRetryCount, setImageRetryCount] = useState(0);
  const [apiCallFailed, setApiCallFailed] = useState(false); // Flag per tracciare se la chiamata API ha fallito
  const navigate = useNavigate();
  const location = useLocation();
  const jwt = localStorage.getItem('jwt');

  // Creiamo l'array navItems usando useMemo per ricalcolarlo solo quando role cambia
  const navItems = useMemo(() => {
    const items = [];
    items.push({
      label: 'Feed',
      to: '/dashboard/feed',
      show: true,
    });
    items.push({
      label: 'Offerte',
      to: '/dashboard/offerte',
      show: true,
    });

    // Verifica più permissiva del ruolo candidato
    const isCandidato =
      role &&
      (role.toLowerCase() === 'candidato' ||
        role.toLowerCase() === 'candidate' ||
        role.toLowerCase().includes('cand'));

    if (isCandidato) {
      items.push({
        label: 'Candidature',
        to: '/dashboard/candidature',
        show: true,
      });
    }

    // Verifica più permissiva del ruolo recruiter
    const isRecruiter =
      role &&
      (role.toLowerCase() === 'recruiter' ||
        role.toLowerCase() === 'reclutatore' ||
        role.toLowerCase().includes('recr'));

    if (isRecruiter) {
      items.push({
        label: 'vuota',
        to: '/dashboard',
        show: true,
      });
    }

    // Se abbiamo un JWT ma non abbiamo un ruolo chiaro, assumiamo sia un candidato
    if (jwt && !isCandidato && !isRecruiter) {
      items.push({
        label: 'Candidature',
        to: '/dashboard/candidature',
        show: true,
      });
    }

    return items;
  }, [role, jwt]); // L'array viene ricalcolato solo quando role cambia

  // Definire fetchProfileImage con useCallback per poterlo usare come dipendenza in useEffect
  const fetchProfileImage = useCallback(
    async (userRole) => {
      setLoading(true);
      try {
        if (!jwt) {
          setLoading(false);
          return;
        }

        // Verifica prima se il profilo è completo usando il flag nel localStorage
        const profileCompleted = localStorage.getItem('profileCompleted');
        
        // Endpoint diversi in base al ruolo
        let endpoint = '';
        const isRecruiter = userRole?.toLowerCase() === 'recruiter';
        const isCandidato = userRole?.toLowerCase() === 'candidato';
        
        if (isCandidato) {
          endpoint = 'http://localhost:1337/api/profilo-candidatos?populate=*';
        } else if (isRecruiter) {
          endpoint = 'http://localhost:1337/api/profilo-recruiters?populate=*';
        } else {
          setLoading(false);
          return;
        }

        try {
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          });

          if (
            response.data.data &&
            response.data.data.length > 0
          ) {
            const profilo = response.data.data[0];
            
            let imageUrl = null;

            // Per candidato, usa l'immagine profilo
            if (isCandidato) {
              // Gestisce sia la struttura vecchia che quella nuova per immagineProfilo
              let candidatoImageUrl = null;
              if (profilo.attributes.immagineProfilo?.data?.attributes?.url) {
                // Struttura vecchia: { data: { attributes: { url: "..." } } }
                candidatoImageUrl = profilo.attributes.immagineProfilo.data.attributes.url;
              } else if (profilo.attributes.immagineProfilo?.url) {
                // Struttura nuova: { url: "...", id: ..., etc }
                candidatoImageUrl = profilo.attributes.immagineProfilo.url;
              }
              
              if (candidatoImageUrl) {
                imageUrl = `http://localhost:1337${candidatoImageUrl}`;

              }
            }
            // Per recruiter, usa il logo azienda
            else if (isRecruiter) {
              // Gestisce sia la struttura vecchia che quella nuova per logoAzienda
              let recruiterImageUrl = null;
              if (profilo.attributes.logoAzienda?.data?.attributes?.url) {
                // Struttura vecchia: { data: { attributes: { url: "..." } } }
                recruiterImageUrl = profilo.attributes.logoAzienda.data.attributes.url;
              } else if (profilo.attributes.logoAzienda?.url) {
                // Struttura nuova: { url: "...", id: ..., etc }
                recruiterImageUrl = profilo.attributes.logoAzienda.url;
              }
              
              if (recruiterImageUrl) {
                imageUrl = `http://localhost:1337${recruiterImageUrl}`;

              }
            }

            if (imageUrl) {
              // Verifica che l'URL dell'immagine sia accessibile prima di impostarla
              try {
                // Usa fetch invece di Image per verificare se l'URL è valido
                fetch(imageUrl, { method: 'HEAD' })
                  .then(response => {
                    if (response.ok) {
                      setProfileImage(imageUrl);
                      setImageRetryCount(0);
                      setApiCallFailed(false);
                    } else {
                      // Prova a correggere l'URL se sembra essere un problema di formattazione
                      let correctedUrl = imageUrl;
                      
                      // Correggi URL senza barra dopo il dominio
                      if (imageUrl.includes('http://localhost:1337uploads')) {
                        correctedUrl = imageUrl.replace('http://localhost:1337uploads', 'http://localhost:1337/uploads');
                      }
                      
                      // Prova a cambiare l'estensione se è un formato meno comune
                      if (imageUrl.toLowerCase().endsWith('.avif')) {
                        const baseUrl = imageUrl.substring(0, imageUrl.lastIndexOf('.'));
                        const pngUrl = baseUrl + '.png';
                        const jpgUrl = baseUrl + '.jpg';
                        
                        // Prova prima con PNG
                        fetch(pngUrl, { method: 'HEAD' })
                          .then(pngResponse => {
                            if (pngResponse.ok) {
                              setProfileImage(pngUrl);
                              setImageRetryCount(0);
                              setApiCallFailed(false);
                            } else {
                              // Prova con JPG
                              fetch(jpgUrl, { method: 'HEAD' })
                                .then(jpgResponse => {
                                  if (jpgResponse.ok) {
                                    setProfileImage(jpgUrl);
                                    setImageRetryCount(0);
                                    setApiCallFailed(false);
                                  } else {
                                    // Se nessuna alternativa funziona, prova l'URL corretto
                                    tryCorrectUrl();
                                  }
                                })
                                .catch(() => tryCorrectUrl());
                            }
                          })
                          .catch(() => tryCorrectUrl());
                      } else {
                        tryCorrectUrl();
                      }
                      
                      function tryCorrectUrl() {
                        // Verifica l'URL corretto
                        fetch(correctedUrl, { method: 'HEAD' })
                          .then(response => {
                            if (response.ok) {
                              setProfileImage(correctedUrl);
                              setImageRetryCount(0);
                              setApiCallFailed(false);
                            } else {
                              // Ultimo tentativo: usa un placeholder invece dell'immagine
                              setProfileImage(null);
                              setApiCallFailed(true);
                            }
                          })
                          .catch(finalError => {
                            setProfileImage(null);
                            setApiCallFailed(true);
                          });
                      }
                    }
                  })
                  .catch(error => {
                    setProfileImage(null);
                    setApiCallFailed(true);
                  });
              } catch (error) {
                setProfileImage(null);
                setApiCallFailed(true);
              }
            } else {
              setProfileImage(null);
              setApiCallFailed(true);
            }

            // Se non abbiamo nome/cognome, prendiamoli dal profilo
            if (isCandidato) {
              if (!nome || !cognome) {
                setNome(profilo.attributes.nome || '');
                setCognome(profilo.attributes.cognome || '');
                localStorage.setItem(
                  'userNome',
                  profilo.attributes.nome || ''
                );
                localStorage.setItem(
                  'userCognome',
                  profilo.attributes.cognome || ''
                );
              }
            } else if (isRecruiter) {
              if (!nome || !cognome || !nomeAzienda) {
                setNome(profilo.attributes.nome || '');
                setCognome(profilo.attributes.cognome || '');
                setNomeAzienda(
                  profilo.attributes.nomeAzienda || ''
                );
                localStorage.setItem(
                  'userNome',
                  profilo.attributes.nome || ''
                );
                localStorage.setItem(
                  'userCognome',
                  profilo.attributes.cognome || ''
                );
                localStorage.setItem(
                  'userNomeAzienda',
                  profilo.attributes.nomeAzienda || ''
                );
              }
            }
          } else {
            setApiCallFailed(true);
          }
        } catch (apiError) {
          // Continuiamo ad usare i dati in localStorage
          setApiCallFailed(true);
        }
      } catch (error) {
        setApiCallFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [jwt, nome, cognome, nomeAzienda]
  );

  useEffect(() => {
    // Recupera dati utente e ruolo da localStorage
    const userStr = localStorage.getItem('user');

    let parsedUser = null;
    if (userStr) {
      try {
        parsedUser = JSON.parse(userStr);

        setUserInfo(parsedUser);
        setRole(parsedUser.role);

        // Recupera nome e cognome sia dai campi diretti dell'utente che da localStorage
        const storedNome = localStorage.getItem('userNome');
        const storedCognome =
          localStorage.getItem('userCognome');
        const storedNomeAzienda = localStorage.getItem(
          'userNomeAzienda'
        );

        setNome(storedNome || parsedUser?.Nome || '');
        setCognome(
          storedCognome || parsedUser?.Cognome || ''
        );
        setNomeAzienda(
          storedNomeAzienda || parsedUser?.nomeAzienda || ''
        );

        // Dopo aver caricato i dati utente, carica l'immagine profilo
        fetchProfileImage(parsedUser.role);
        
      } catch (e) {
        setUserInfo(null);
        setRole(null);
        setLoading(false);
      }
    } else {
      setUserInfo(null);
      setRole(null);
      setNome('');
      setCognome('');
      setNomeAzienda('');
      setLoading(false);
    }
  }, [location.pathname, fetchProfileImage]); // Aggiunta fetchProfileImage come dipendenza

  // Effetto per gestire i tentativi di recupero dell'immagine profilo
  useEffect(() => {
    // Se la chiamata API è fallita o non abbiamo un'immagine profilo, ma abbiamo un JWT e un ruolo
    if ((apiCallFailed || !profileImage) && jwt && role && imageRetryCount < 3) {
      const retryTimer = setTimeout(() => {
        setImageRetryCount(prevCount => prevCount + 1);
        fetchProfileImage(role);
      }, 3000); // Riprova dopo 3 secondi
      
      return () => clearTimeout(retryTimer);
    }
  }, [apiCallFailed, profileImage, jwt, role, imageRetryCount, fetchProfileImage]);



  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Nome visualizzato
  let displayName = '';
  if (role?.toLowerCase() === 'recruiter' && nomeAzienda) {
    displayName = nomeAzienda;
  } else if (nome && cognome) {
    displayName = `${nome} ${cognome}`;
  } else if (role) {
    displayName = `${
      role.charAt(0).toUpperCase() + role.slice(1)
    }`;
  } else {
    displayName = 'Utente';
  }

  // Ruolo mostrato sotto il nome
  let displayRole = '';
  if (role) {
    displayRole = `${
      role.charAt(0).toUpperCase() + role.slice(1)
    }`;
  }

  // STYLES
  const srcImages = {
    name: '/easyJobTitle.svg',
    logo: '/logo.svg',
    bell: '/Bell.svg',
  };

  // Funzione per determinare se un percorso è attivo
  const isActivePath = (itemPath) => {
    const currentPath = location.pathname;
    return currentPath === itemPath;
  };

  return (
    <div className="header">
      <div className="container">
        <div className="header-left">
          <img src={srcImages.logo} id="logo" alt="Logo" />
          <h1>easyJob</h1>
        </div>
        <div className="header-buttons">
          {navItems &&
            navItems.length > 0 &&
            navItems
              .filter((item) => item.show)
              .map((item, idx) => (
                <React.Fragment key={item.label}>
                  <Link to={item.to}>
                    <Button
                      text={item.label}
                      width="150px"
                      height="50px"
                      fontSize="24px"
                      fontWeight="550"
                      backgroundColor="transparent"
                      textColor={
                        isActivePath(item.to) ? '#FFFFFF' : '#9C9C9C'
                      }
                    />
                  </Link>
                </React.Fragment>
              ))}
        </div>
        <div className="header-right">
          <img
            src={srcImages.bell}
            alt="notifications"
            id="bell"
          />
          <Link
            to="/dashboard/profile"
            className="profile-link"
          >
            <div
              className="profile"
              onClick={() => navigate('/dashboard/profile')}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="profile-image"
                  onError={(e) => {
                    // Estrai l'estensione del file dall'URL
                    const fileExtension = profileImage.split('.').pop().toLowerCase();
                    
                    // Se l'estensione è avif, prova a caricare una versione PNG o JPG
                    if (fileExtension === 'avif') {
                      const baseUrl = profileImage.substring(0, profileImage.lastIndexOf('.'));
                      const newUrl = baseUrl + '.png'; // Prova con PNG
                      e.target.src = newUrl;
                      
                      // Aggiungi un secondo handler per gestire anche il fallimento di questo tentativo
                      e.target.onerror = () => {
                        const jpgUrl = baseUrl + '.jpg'; // Prova con JPG
                        e.target.src = jpgUrl;
                        
                        // Se anche questo fallisce, mostra il placeholder
                        e.target.onerror = () => {
                          showPlaceholder(e.target);
                        };
                      };
                    } 
                    // Se l'estensione è png, prova con jpg
                    else if (fileExtension === 'png') {
                      const baseUrl = profileImage.substring(0, profileImage.lastIndexOf('.'));
                      const jpgUrl = baseUrl + '.jpg'; // Prova con JPG
                      e.target.src = jpgUrl;
                      
                      // Se anche questo fallisce, mostra il placeholder
                      e.target.onerror = () => {
                        showPlaceholder(e.target);
                      };
                    }
                    // Se l'estensione è jpg/jpeg, prova con png
                    else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
                      const baseUrl = profileImage.substring(0, profileImage.lastIndexOf('.'));
                      const pngUrl = baseUrl + '.png'; // Prova con PNG
                      e.target.src = pngUrl;
                      
                      // Se anche questo fallisce, mostra il placeholder
                      e.target.onerror = () => {
                        showPlaceholder(e.target);
                      };
                    }
                    else {
                      // Per altre estensioni o URL senza estensione, vai direttamente al placeholder
                      showPlaceholder(e.target);
                    }
                    
                    function showPlaceholder(imgElement) {
                      // Nascondi l'elemento immagine che ha causato l'errore
                      imgElement.style.display = 'none';
                      imgElement.className = 'profile-image-error';
                      
                      // Crea un elemento placeholder con le iniziali
                      const placeholderDiv = document.createElement('div');
                      placeholderDiv.className = 'profile-placeholder';
                      placeholderDiv.textContent = nome && cognome
                        ? `${nome.charAt(0)}${cognome.charAt(0)}`
                        : role
                        ? role.charAt(0).toUpperCase()
                        : 'U';
                      
                      // Sostituisci l'immagine con il placeholder
                      imgElement.parentNode.appendChild(placeholderDiv);
                    }
                  }}
                />
              ) : (
                <div className="profile-placeholder">
                  {nome && cognome
                    ? `${nome.charAt(0)}${cognome.charAt(0)}`
                    : role
                    ? role.charAt(0).toUpperCase()
                    : 'U'}
                </div>
              )}
            </div>
          </Link>
          <div className="profile-info">
            <div className="profile-name">
              {displayName}
            </div>
            <div className="profile-role">
              {displayRole}
            </div>
          </div>

          <button onClick={handleLogout} id="logout-button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
