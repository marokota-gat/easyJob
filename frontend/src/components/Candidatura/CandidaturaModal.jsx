import React, { useState } from 'react';
import './CandidaturaModal.css';

const CandidaturaModal = ({
  onClose,
  onSubmit,
  hasProfileCV,
}) => {
  const [cvFile, setCvFile] = useState(null);
  const [useCvFromProfile, setUseCvFromProfile] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
      setUseCvFromProfile(false);
    }
  };

  const handleUseCvFromProfile = () => {
    setCvFile(null);
    setUseCvFromProfile(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!useCvFromProfile && !cvFile) {
      setError(
        'Per favore carica un CV o utilizza quello del tuo profilo'
      );
      setLoading(false);
      return;
    }

    try {
      await onSubmit(cvFile, useCvFromProfile);
    } catch (err) {
      setError("Errore nell'invio della candidatura");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidatura-modal-overlay">
      <div className="candidatura-modal">
        <div className="candidatura-modal-header">
          <h2>Invia la tua candidatura</h2>
          <button
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="candidatura-form"
        >
          <div className="form-group">
            <label>
              Curriculum Vitae (formati accettati: .pdf,
              .doc, .docx, .txt)
            </label>

            {hasProfileCV && (
              <div className="profile-cv-option">
                <input
                  type="checkbox"
                  id="useCvFromProfile"
                  checked={useCvFromProfile}
                  onChange={handleUseCvFromProfile}
                />
                <label htmlFor="useCvFromProfile">
                  Usa il CV dal tuo profilo
                </label>
              </div>
            )}

            {!useCvFromProfile && (
              <>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  required={!hasProfileCV}
                />
                <small className="file-help">
                  Seleziona un file non vuoto (.pdf, .doc,
                  .docx, .txt)
                </small>
              </>
            )}
          </div>

          {error && (
            <p className="error-message">{error}</p>
          )}

          <div className="candidatura-actions">
            <button
              type="button"
              className="buttons"
              id="cancel-button"
              onClick={onClose}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="buttons"
              id="submit-button"
              disabled={
                loading || (!useCvFromProfile && !cvFile)
              }
            >
              {loading ? 'Invio in corso...' : 'Invia '}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidaturaModal;
