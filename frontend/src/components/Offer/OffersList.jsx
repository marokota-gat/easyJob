import React, { useState, useEffect, useRef } from 'react';
import OfferCard from './OfferCard';
import './OffersList.css';

const FAVORITES_KEY = 'favorites';

const OffersList = ({ offers = [], onOfferClick, userRole }) => {
  const [favorites, setFavorites] = useState([]);
  const isFirstRun = useRef(true);

  // Carica i preferiti dal localStorage
  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      setFavorites(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Errore nel caricamento dei preferiti:', error);
      setFavorites([]);
    }
  };

  // All'avvio del componente
  useEffect(() => {
    loadFavorites();
  }, []);

  // Salva i preferiti su localStorage quando cambiano, evitando il salvataggio iniziale
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Errore nel salvataggio dei preferiti:', error);
    }
  }, [favorites]);

  // Aggiungi/rimuovi dai preferiti
  const handleToggleFavorite = (offerId) => {
    setFavorites(prev =>
      prev.includes(offerId)
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    );
  };

  // Gestisce il click sull'offerta
  const handleOfferClick = (offerId) => {
    if (onOfferClick) onOfferClick(offerId);
  };

  return (
    <div className="offers-list">
      {offers.length > 0 ? (
        offers.map(offer => (
          <OfferCard
            key={offer.id}
            id={offer.id}
            title={offer.title}
            company={offer.company}
            location={offer.location}
            jobType={offer.jobType}
            postedDate={offer.postedDate}
            closingDate={offer.closingDate}
            description={offer.description}
            isFavorite={favorites.includes(offer.id)}
            onToggleFavorite={() => handleToggleFavorite(offer.id)}
            onClick={() => handleOfferClick(offer.id)}
            userRole={userRole}
          />
        ))
      ) : (
        <div className="no-offers">
          <p>Nessuna offerta di lavoro disponibile al momento.</p>
        </div>
      )}
    </div>
  );
};

export default OffersList;