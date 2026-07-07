import { BrowserRouter } from "react-router-dom";
import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Players from "./pages/Players";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";

import "./styles/index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div className="main">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/players" element={<Players />} />

          <Route path="/tournaments" element={<Tournaments />} />

          <Route path="/tournaments/:id" element={<TournamentDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
