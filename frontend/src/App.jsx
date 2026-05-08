import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Players from './pages/Players';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import './App.css'

export default function App() {
  return (
    // Wrap everything in BrowserRouter so routing works
    <BrowserRouter>

      {/* Navbar appears on every page, outside the Routes */}
      <Navbar />

      {/* main is the scrollable content area below the navbar */}
      <main className="main">
        <Routes>
          {/* Each Route maps a URL path to a page component */}
          <Route path="/"               element={<Home />} />
          <Route path="/players"        element={<Players />} />
          <Route path="/tournaments"    element={<Tournaments />} />

          {/* :id is a dynamic segment — e.g. /tournaments/3 */}
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
        </Routes>
      </main>

    </BrowserRouter>
  );
}
