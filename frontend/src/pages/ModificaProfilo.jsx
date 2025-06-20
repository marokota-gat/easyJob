import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ModificaProfilo.css';

const ModificaProfilo = () => {
  const [formData, setFormData] = useState({
            nome: '',
            cognome: '',
            dataNascita: '',
        });
  const [profileId, setProfileId] = useState(null);
  const [ruolo, setRuolo] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    if (!user || !token) return;

    const fetchUserAndProfile = async () => {
      try {
        const ruoloCorrente = user.role;
        setRuolo(ruoloCorrente);
        
        // Inizializza il form in base al ruolo
        setFormData(ruoloCorrente === "Candidato" ? {
            nome: '',
            cognome: '',
            dataNascita: '',
            telefono: '',
            immagineProfilo: null
        } : {
            nome: '',
            cognome: '',
            dataNascita: '',
            nomeAzienda: '',
            logoAzienda: null
        });

        // Recupera il profilo usando l'ID utente direttamente
        const endpoint = ruoloCorrente === 'Recruiter' ? 'profilo-recruiters' : 'profilo-candidatos';

        const profileRes = await fetch(
          `http://localhost:1337/api/${endpoint}?filters[user][id][$eq]=${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const profileData = await profileRes.json();

        if (profileData.data && profileData.data.length > 0) {
            const profilo = profileData.data[0];  
            setProfileId(profilo.id);
            setFormData(profilo.attributes);
        } else {
          alert('Nessun profilo trovato per questo utente.');
        }
      } catch (err) {
        console.error('Errore nel recupero profilo:', err);
      }
    };

    fetchUserAndProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
        setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const endpoint = ruolo === 'Recruiter' ? 'profilo-recruiters' : 'profilo-candidatos';

  try {
    // Costruisci il body con FormData
    const form = new FormData();
    form.append('data', JSON.stringify({
      nome: formData.nome,
      cognome: formData.cognome,
      dataNascita: formData.dataNascita,
      telefono: formData.telefono,
      nomeAzienda: formData.nomeAzienda,
    }));

    // Se i file esistono, allegali con i campi corretti
    if (formData.logoAzienda) {
      console.log('ModificaProfilo - Uploading logoAzienda:', formData.logoAzienda);
      form.append('files.logoAzienda', formData.logoAzienda);
    }

    if (formData.immagineProfilo) {
      console.log('ModificaProfilo - Uploading immagineProfilo:', formData.immagineProfilo);
      form.append('files.immagineProfilo', formData.immagineProfilo);
    }

    // Debug: mostra tutti i campi del FormData
    console.log('ModificaProfilo - FormData contents:');
    for (let [key, value] of form.entries()) {
      console.log(`  ${key}:`, value);
    }

    const res = await fetch(`http://localhost:1337/api/${endpoint}/${profileId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('ModificaProfilo - Errore PUT:', result);
      alert(`Errore: ${result.error?.message || 'PUT fallita'}`);
    } else {
      console.log('ModificaProfilo - Profilo aggiornato con successo:', result);
      console.log('ModificaProfilo - Dettagli risposta completa:', JSON.stringify(result, null, 2));
      
      // Verifica se l'immagine è stata associata
      if (result.data?.attributes?.immagineProfilo) {
        console.log('ModificaProfilo - Immagine profilo associata:', result.data.attributes.immagineProfilo);
      } else {
        console.warn('ModificaProfilo - ATTENZIONE: Immagine profilo NON associata nel risultato');
      }
      
      alert('Profilo aggiornato con successo!');
      navigate('/dashboard/profile');
    }
  } catch (err) {
    console.error('Errore durante aggiornamento:', err);
  }
};

  const handleDelete = async () => {
    const conferma = window.confirm('Sei sicuro di voler eliminare il tuo profilo e account?');
    if (!conferma) return;

    const endpoint = ruolo === 'Recruiter' ? 'profilo-recruiters' : 'profilo-candidatos';

    try {
      // 1. Elimina il profilo
      await fetch(`http://localhost:1337/api/${endpoint}/${profileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. Elimina l'utente
      await fetch(`http://localhost:1337/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Account e profilo eliminati con successo.');
      localStorage.clear();
      navigate('/');
    } catch (err) {
      console.error('Errore durante eliminazione:', err);
      alert('Errore durante l\'eliminazione del profilo.');
    }
  };

  return (
    <div className="modifica-profilo-container">
      <h2>Modifica Profilo</h2>
      <form onSubmit={handleSubmit} className="modifica-profilo-form">
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          value={formData.nome || ''}
          onChange={handleChange}
          className="modifica-profilo-input"
        />
        <input
          type="text"
          name="cognome"
          placeholder="Cognome"
          value={formData.cognome || ''}
          onChange={handleChange}
          className="modifica-profilo-input"
        />
        <input
          type="date"
          name="dataNascita"
          placeholder="Data di nascita"
          value={formData.dataNascita || ''}
          onChange={handleChange}
          className="modifica-profilo-input"
        />

        {ruolo === 'Recruiter' && (
          <>
            <input
              type="text"
              name="nomeAzienda"
              placeholder="Nome azienda"
              value={formData.nomeAzienda || ''}
              onChange={handleChange}
              className="modifica-profilo-input"
            />
            
            <input
                type="file"
                name="logoAzienda"
                accept="image/*"
                onChange={handleChange}
                className="modifica-profilo-input"
            />
          </>
        )}

        {ruolo === 'Candidato' && (
          <>
            <input
              type="text"
              name="telefono"
              placeholder="Telefono"
              value={formData.telefono || ''}
              onChange={handleChange}
              className="modifica-profilo-input"
            />

            <input
                type="file"
                name="immagineProfilo"
                accept="image/*"
                onChange={handleChange}
                className="modifica-profilo-input"
            />
          </>
        )}

        <button type="submit" className="modifica-profilo-button">
          Salva modifiche
        </button>
      </form>

      <button onClick={handleDelete} className="modifica-profilo-delete">
        Elimina Profilo
      </button>
    </div>
  );
};

export default ModificaProfilo;