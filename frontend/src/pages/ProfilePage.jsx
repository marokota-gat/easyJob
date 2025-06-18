import React from 'react';
import './ProfilePage.css';

export default function ProfilePage() {
  return (
    <div className="container-profile">
      <div className="header-profile">
        <img src="/photoProfile.svg" alt="immagine profilo" />
        <div className="header-name">
          <div className="list-attributes">
            <p className="name">
              {/* logica nome e cognome  */}
              Mario Rossi
            </p>
            <p className="attributes-profile">
              {/* logica data di nascita  */}
              04/12/2004
            </p>
            <p className="attributes-profile">
              {/* logica mail  */}
              mario.rossi@gmail.com
            </p>
            <p className="attributes-profile">
              {/* logica cellulare  */}
              +39 3334445556
            </p>
          </div>
        </div>
        <div className="registration-date">
          <p className="attributes-profile">
            {/* logica data di registrazione su easyjob */}
            Mario usa easyJob dal: <br />12/06/2025
          </p>
        </div>
      </div>
      <div className="divider-profile" />
      <div className="footer-profile">
        <div className="description-profile">
          {/* logica Descrizione profilo */}
          Sono Mario, mi piacciono le patatine con cacio e pepe, bei maschi e tanto altro.
        </div>
        <button className="look-resume-button">
          {/* logica Guarda CV */}
          Guarda CV
        </button>
      </div>
    </div>
  );
}
