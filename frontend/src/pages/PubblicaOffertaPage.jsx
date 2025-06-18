import React, { useState } from 'react';
import Button from '../components/UI/Button';
import axios from 'axios';
import './OffertePage.css';
import { useNavigate } from 'react-router-dom';

export default function PubblicaOffertaPage() {
  const [job, setJob] = useState({
    Ruolo: '',
    Azienda: '',
    Luogo: '',
    TipoContratto: '',
    Descrizione: '',
    Scadenza: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const jwt = localStorage.getItem('jwt');
  const navigate = useNavigate();

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

    setLoading(true);

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
      };

      await axios.post(
        'http://localhost:1337/api/offertas',
        { data: offerData },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        }
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

      // Reindirizza alla pagina delle offerte
      navigate('/dashboard/offerte');
    } catch (err) {
      console.error('Errore nella pubblicazione:', err);

      // Log dettagliato dell'errore
      if (err.response) {
        console.error(
          'Dettagli errore:',
          err.response.data
        );
        setError(
          `Errore ${err.response.status}: ${err.response.data?.error?.message ||
          "Errore durante la pubblicazione dell'offerta"
          }`
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

  // Funzione per tornare alla pagina delle offerte
  const handleTornaAlleOfferte = () => {
    navigate('/dashboard/offerte');
  };

  return (
    <div className="offerte-page">
      <div className="offerte-header">
        <p>Pubblica una nuova offerta di lavoro</p>

        <div className="refresh-button-container">
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              text="Torna alle offerte"
              onClick={handleTornaAlleOfferte}
              backgroundColor="#1e3a8a"
              textColor="white"
              width="160px"
              height="35px"
              fontSize="14px"
              borderRadius="8px"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <div className="error">{error}</div>
        </div>
      )}

      <div className="form-job-form">
        <form onSubmit={handleSubmit} id="job-form">
          <div className="form-row header-row">
            <div className="form-field">
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
            <div className="form-field">
              <label htmlFor="Azienda">Nome Azienda*</label>
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

          <div className="form-row alternate-row">
            <div className="form-field">
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
            <div className="form-field">
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

          <div className="form-row alternate-row">
            <div className="form-field date-field">
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
          </div>

          <div className="form-row alternate-row">
            <div className="form-field description-field">
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
          </div>

          <div className="form-row button-row">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading
                ? 'Pubblicazione in corso...'
                : 'Pubblica Offerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
