import React from 'react';
import './FooterStyles.css';

export default function Footer() {
  const logo = '/logoInverted.svg';

  return (
    <div className="footer-container">
      <div className="footer">
        <div className="footer-up">
          <div className="footer-up-left">
            <img src={logo} alt="logo" />
            <div className="footer-up-left-text">
              <h1>easyJob</h1>
              <p>
                Stanco di inviare CV a raffica? Con easyJob
                ti candidi in un &nbsp;
                <span id="click">click</span>.
              </p>
            </div>
            <div className="footer-up-right">
              <ul className="footer-links">
                <li>
                  <a href="#chi-siamo">Chi siamo</a>
                </li>
                <li>
                  <a href="#cosa-offriamo">Cosa offriamo</a>
                </li>
              </ul>
              <ul className="footer-links">
                <li>
                  <a href="#career">Career</a>
                </li>
                <li>
                  <a href="#support">Support</a>
                </li>
              </ul>
              <ul className="footer-links">
                <li>
                  <a href="#donate">Donate Us</a>
                </li>
                <li>
                  <a href="#privacy">Privacy</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="divider" />
      <div className="footer-down">
        <p>
          Copyright © 2025&nbsp;<span> easyJob </span>
          &nbsp;
          {/* &nbsp; serve per aggiungere uno spazio tra i due elementi */}
          - All rights reserved.
        </p>
      </div>
    </div>
  );
}
