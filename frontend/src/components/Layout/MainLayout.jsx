import React from 'react';
import NavBar from './NavBar';
import { Outlet } from 'react-router-dom';
import './MainLayout.css';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div>
      <NavBar />
      <div className="container">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
