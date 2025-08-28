// src/App.js
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase'; // CAMINHO CORRIGIDO
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// --- PÁGINAS E COMPONENTES ---
import RoleSelectionScreen from './screens/RoleSelectionScreen'; // CAMINHO CORRIGIDO
import LoginPage from './screens/auth/LoginPage'; // CAMINHO CORRIGIDO
import Navbar from './components/layout/Navbar'; // CAMINHO CORRIGIDO
import HomePage from './screens/patient/HomePage'; // CAMINHO CORRIGIDO
import AgendamentosPage from './screens/patient/AgendamentosPage'; // CAMINHO CORRIGIDO
import PlaylistsPage from './screens/patient/PlaylistsPage'; // CAMINHO CORRIGIDO
import HistoricoPage from './screens/patient/HistoricoPage'; // CAMINHO CORRIGIDO
import ProfilePage from './screens/patient/ProfilePage'; // CAMINHO CORRIGIDO
import TherapistDashboardPage from './screens/therapist/DashboardPage'; // CAMINHO CORRIGIDO

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const role = userData.role || 'patient';
          setUserRole(role);
          setCurrentPage(role === 'therapist' ? 'dashboard' : 'home');
        } else {
          setUserRole('patient');
          setCurrentPage('home');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
  };

  const handleLogout = () => {
    auth.signOut();
    setSelectedRole(null);
    setCurrentPage('');
  };

  const renderPatientPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage setActivePage={setCurrentPage} />;
      case 'agendamentos': return <AgendamentosPage user={user} />;
      case 'playlists': return <PlaylistsPage user={user} />;
      case 'historico': return <HistoricoPage user={user} />;
      case 'perfil': return <ProfilePage onLogout={handleLogout} />;
      default: return <HomePage setActivePage={setCurrentPage} />;
    }
  };

  const renderTherapistPage = () => {
    switch (currentPage) {
      case 'dashboard':
      default:
        return <TherapistDashboardPage />;
    }
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: '"Inter", sans-serif' }}>Carregando...</div>;
  }

  if (!user) {
    if (!selectedRole) {
      return <RoleSelectionScreen onSelectRole={handleSelectRole} />;
    }
    return <LoginPage onLoginSuccess={() => { /* o onAuthStateChanged cuida de tudo */ }} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar activePage={currentPage} setActivePage={setCurrentPage} onLogout={handleLogout} userRole={userRole} />
      <main style={{ flexGrow: 1, backgroundColor: '#F9FAFB', overflowY: 'auto' }}>
        {userRole === 'therapist' ? renderTherapistPage() : renderPatientPage()}
      </main>
    </div>
  );
}

export default App;