import React, { useState, useEffect } from 'react';
import './FilterModal.css';

const FilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  offers,
}) => {
  const [filters, setFilters] = useState({
    location: '',
    workMode: '',
    contractType: '',
  });

  const [availableOptions, setAvailableOptions] = useState({
    locations: [],
    contractTypes: [],
  });

  // Estrai le opzioni uniche dalle offerte disponibili
  useEffect(() => {
    if (offers && offers.length > 0) {
      const uniqueLocations = [
        ...new Set(
          offers
            .map((offer) => offer.location)
            .filter(Boolean)
        ),
      ];
      const uniqueContractTypes = [
        ...new Set(
          offers
            .map((offer) => offer.jobType)
            .filter(Boolean)
        ),
      ];

      setAvailableOptions({
        locations: uniqueLocations,
        contractTypes: uniqueContractTypes,
      });
    }
  }, [offers]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      location: '',
      workMode: '',
      contractType: '',
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal">
        <div className="filter-modal-header">
          <p id="header-name">Filtra Offerte</p>
          <button
            className="close-button"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <div className="filter-modal-content">
          <div className="filter-group">
            <label htmlFor="location-filter">Sede</label>
            <select
              id="location-filter"
              value={filters.location}
              onChange={(e) =>
                handleFilterChange(
                  'location',
                  e.target.value
                )
              }
            >
              <option value="">Tutte le sedi</option>
              {availableOptions.locations.map(
                (location, index) => (
                  <option key={index} value={location}>
                    {location}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="work-mode-filter">
              Modalità di lavoro
            </label>
            <select
              id="work-mode-filter"
              value={filters.workMode}
              onChange={(e) =>
                handleFilterChange(
                  'workMode',
                  e.target.value
                )
              }
            >
              <option value="">Tutte le modalità</option>
              <option value="remoto">Remoto</option>
              <option value="ufficio">In ufficio</option>
              <option value="ibrido">Ibrido</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="contract-type-filter">
              Tipo di contratto
            </label>
            <select
              id="contract-type-filter"
              value={filters.contractType}
              onChange={(e) =>
                handleFilterChange(
                  'contractType',
                  e.target.value
                )
              }
            >
              <option value="">Tutti i contratti</option>
              {availableOptions.contractTypes.map(
                (contractType, index) => (
                  <option key={index} value={contractType}>
                    {contractType}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="filter-modal-actions">
          <button
            className="clear-filters-button"
            onClick={handleClearFilters}
          >
            Cancella filtri
          </button>
          <button
            className="apply-filters-button"
            onClick={handleApplyFilters}
          >
            Applica filtri
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
