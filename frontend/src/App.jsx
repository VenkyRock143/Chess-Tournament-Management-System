import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Players from './pages/Players';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import './styles.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
