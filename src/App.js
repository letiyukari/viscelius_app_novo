// src/App.js
import React, { useState, useEffect } from 'react';
// IMPORTAÇÕES DO FIREBASE
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- PÁGINAS E COMPONENTES ---
// Agora todas as nossas páginas e componentes principais são importados de seus próprios arquivos
import LoginPage from './screens/auth/LoginPage';
import Navbar from './components/layout/Navbar';
import HomePage from './screens/patient/HomePage';
import AgendamentosPage from './screens/patient/AgendamentosPage';
import PlaylistsPage from './screens/patient/PlaylistsPage';
import HistoricoPage from './screens/patient/HistoricoPage';
import ProfilePage from './screens/patient/ProfilePage';


// --- COMPONENTE PRINCIPAL APP ---
// Agora ele só controla qual página mostrar e se o usuário está logado.
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setCurrentPage('home');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentPage('home');
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage setActivePage={setCurrentPage} />;
      case 'agendamentos': return <AgendamentosPage user={user} />;
      case 'playlists': return <PlaylistsPage user={user} />;
      case 'historico': return <HistoricoPage />;
      case 'perfil': return <ProfilePage onLogout={handleLogout} />;
      default: return <HomePage setActivePage={setCurrentPage} />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar activePage={currentPage} setActivePage={setCurrentPage} onLogout={handleLogout} />
      <main style={{ flexGrow: 1, backgroundColor: '#F9FAFB', overflowY: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;