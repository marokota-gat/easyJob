import React from 'react';
import './OfferDetails.css';

const OfferDetails = ({
  offer = null,
  onApply = () => {},
  userRole,
  onDelete,
  isOwner,
}) => {
  if (!offer) {
    return (
      <div className="offer-details-placeholder">
        <p>
          Seleziona un'offerta per visualizzare i dettagli
        </p>
      </div>
    );
  }

  // Funzione per rimuovere tag HTML dalla descrizione
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  // Descrizione formattata
  const cleanDescription = stripHtml(offer.description);

  return (
    <div className="offer-details">
      <div className="offer-details-header">
        <div className="offer-logo">
          {/* da inserire l'immagine dell'offerta */}
          <img src="/person-run.svg" alt={offer.company} />
        </div>
        <div className="offer-details-title">
          <h2>{offer.title}</h2>
          <div className="company-link">
            <a
              href="#company-profile"
              className="company-name"
            >
              {offer.company}
            </a>
            {offer.companyUrl && (
              <a
                href={offer.companyUrl}
                className="company-url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/link-icon.svg" alt="Link" />
              </a>
            )}
            <div className="header-detail">
              <div className="offer-info">
                <div className="info-row">
                  <span className="info-label">Luogo:</span>
                  <span className="info-value">
                    {offer.location}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Tipo:</span>
                  <span className="info-value highlight">
                    {offer.jobType}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">
                    Pubblicato il:
                  </span>
                  <span className="info-value">
                    {offer.postedDate}
                  </span>
                </div>
                <div className="info-row-last">
                  <span className="info-label">
                    Scadenza il:
                  </span>
                  <span className="info-value">
                    {offer.closingDate}
                  </span>
                </div>
              </div>
              <div className="offer-actions">
                {userRole === 'candidato' ? (
                  <button
                    className="apply-button"
                    onClick={onApply}
                  >
                    Candidati
                  </button>
                ) : isOwner ? (
                  <button
                    className="delete-button"
                    onClick={() => onDelete(offer.id)}
                  >
                    Elimina
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <button className="favorite-button">
          <span className="star-icon">★</span>
        </button>
      </div>

      <div className="divider" />
      <div className="offer-details-section">
        <h3>Descrizione:</h3>
        <p>
          {cleanDescription || 'Nessuna descrizione disponibile per questa offerta.'}
        </p>
      </div>
    </div>
  );
};

export default OfferDetails;
