// favoriteUtils.jsAdd commentMore actions
// Utility functions per gestire i preferiti nel localStorage

/**
 * Ottiene la chiave del localStorage per i preferiti dell'utente corrente
 * @returns {string} La chiave per il localStorage
 */
export const getFavoritesKey = () => {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user && user.id
      ? `favorites_${user.id}`
      : 'favorites_guest';
  } catch (error) {
    console.error(
      'Errore nel recupero dei dati utente:',
      error
    );
    return 'favorites_guest';
  }
};

/**
 * Carica i preferiti dal localStorage
 * @returns {number[]} Array di ID delle offerte preferite
 */
export const loadFavorites = () => {
  try {
    const favoritesKey = getFavoritesKey();
    const savedFavorites =
      localStorage.getItem(favoritesKey);

    if (savedFavorites) {
      const parsedFavorites = JSON.parse(savedFavorites);
      // Assicurati che sia un array di numeri
      if (Array.isArray(parsedFavorites)) {
        return parsedFavorites
          .map((id) => Number(id))
          .filter((id) => !isNaN(id));
      }
    }
    return [];
  } catch (error) {
    console.error(
      'Errore nel caricamento dei preferiti:',
      error
    );
    return [];
  }
};

/**
 * Salva i preferiti nel localStorage
 * @param {number[]} favorites - Array di ID delle offerte preferite
 */
export const saveFavorites = (favorites) => {
  try {
    // Assicurati che sia un array di numeri
    const validFavorites = Array.isArray(favorites)
      ? favorites
          .map((id) => Number(id))
          .filter((id) => !isNaN(id))
      : [];

    const favoritesKey = getFavoritesKey();
    localStorage.setItem(
      favoritesKey,
      JSON.stringify(validFavorites)
    );
    console.log('Preferiti salvati:', validFavorites);
  } catch (error) {
    console.error(
      'Errore nel salvataggio dei preferiti:',
      error
    );
  }
};

/**
 * Aggiunge un'offerta ai preferiti
 * @param {number} offerId - ID dell'offerta da aggiungere
 * @returns {number[]} Array aggiornato dei preferiti
 */
export const addToFavorites = (offerId) => {
  const offerIdNum = Number(offerId);
  if (isNaN(offerIdNum)) {
    console.error('ID offerta non valido:', offerId);
    return loadFavorites();
  }

  const currentFavorites = loadFavorites();
  if (!currentFavorites.includes(offerIdNum)) {
    const updatedFavorites = [
      ...currentFavorites,
      offerIdNum,
    ];
    saveFavorites(updatedFavorites);
    console.log(
      `Offerta ${offerIdNum} aggiunta ai preferiti`
    );
    return updatedFavorites;
  }
  return currentFavorites;
};

/**
 * Rimuove un'offerta dai preferiti
 * @param {number} offerId - ID dell'offerta da rimuovere
 * @returns {number[]} Array aggiornato dei preferiti
 */
export const removeFromFavorites = (offerId) => {
  const offerIdNum = Number(offerId);
  if (isNaN(offerIdNum)) {
    console.error('ID offerta non valido:', offerId);
    return loadFavorites();
  }

  const currentFavorites = loadFavorites();
  const updatedFavorites = currentFavorites.filter(
    (id) => id !== offerIdNum
  );
  saveFavorites(updatedFavorites);
  console.log(
    `Offerta ${offerIdNum} rimossa dai preferiti`
  );
  return updatedFavorites;
};

/**
 * Controlla se un'offerta è tra i preferiti
 * @param {number} offerId - ID dell'offerta da controllare
 * @returns {boolean} True se l'offerta è tra i preferiti
 */
export const isFavorite = (offerId) => {
  const offerIdNum = Number(offerId);
  if (isNaN(offerIdNum)) {
    return false;
  }
  const favorites = loadFavorites();
  return favorites.includes(offerIdNum);
};

/**
 * Alterna lo stato di preferito di un'offerta
 * @param {number} offerId - ID dell'offerta
 * @returns {boolean} True se l'offerta è ora tra i preferiti, false altrimenti
 */
export const toggleFavorite = (offerId) => {
  const offerIdNum = Number(offerId);
  if (isNaN(offerIdNum)) {
    console.error('ID offerta non valido:', offerId);
    return false;
  }

  const favorites = loadFavorites();
  if (favorites.includes(offerIdNum)) {
    removeFromFavorites(offerIdNum);
    return false;
  } else {
    addToFavorites(offerIdNum);
    return true;
  }
};

/**
 * Ottiene il numero di offerte preferite
 * @returns {number} Numero di offerte preferite
 */
export const getFavoritesCount = () => {
  return loadFavorites().length;
};

/**
 * Cancella tutti i preferiti dell'utente corrente
 */
export const clearAllFavorites = () => {
  try {
    const favoritesKey = getFavoritesKey();
    localStorage.removeItem(favoritesKey);
    console.log('Tutti i preferiti sono stati cancellati');
  } catch (error) {
    console.error(
      'Errore nella cancellazione dei preferiti:',
      error
    );
  }
};

/**
 * Ottiene tutte le offerte preferite da un array di offerte
 * @param {Object[]} offers - Array di tutte le offerte disponibili
 * @returns {Object[]} Array delle offerte preferite
 */
export const getFavoriteOffers = (offers) => {
  const favoriteIds = loadFavorites();
  return offers.filter((offer) => {
    const offerId = Number(offer.id);
    return favoriteIds.includes(offerId);
  });
};

/**
 * Migra i preferiti da una chiave utente a un'altra (utile per il cambio utente)
 * @param {string} oldUserId - ID del vecchio utente
 * @param {string} newUserId - ID del nuovo utente
 */
export const migrateFavorites = (oldUserId, newUserId) => {
  try {
    const oldKey = `favorites_${oldUserId}`;
    const newKey = `favorites_${newUserId}`;

    const oldFavorites = localStorage.getItem(oldKey);
    if (oldFavorites) {
      localStorage.setItem(newKey, oldFavorites);
      localStorage.removeItem(oldKey);
      console.log(
        `Preferiti migrati da ${oldUserId} a ${newUserId}`
      );
    }
  } catch (error) {
    console.error(
      'Errore nella migrazione dei preferiti:',
      error
    );
  }
};

/**
 * Inizializza i preferiti per l'utente corrente (da chiamare al login)
 * Utile per assicurarsi che i preferiti siano caricati correttamente
 * @returns {number[]} Array dei preferiti dell'utente
 */
export const initializeFavorites = () => {
  const favorites = loadFavorites();
  console.log(
    `Preferiti inizializzati per utente: ${getFavoritesKey()}, ${
      favorites.length
    } preferiti trovati`
  );
  return favorites;
};

/**
 * Debug function - Stampa informazioni sui preferiti (solo per sviluppo)
 */
export const debugFavorites = () => {
  const key = getFavoritesKey();
  const favorites = loadFavorites();
  const count = getFavoritesCount();

  console.log('=== DEBUG PREFERITI ===');
  console.log('Chiave localStorage:', key);
  console.log('Preferiti:', favorites);
  console.log('Numero preferiti:', count);
  console.log('=====================');

  return { key, favorites, count };
};
