import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Importação das telas, incluindo as novas de registro
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import LoginPage from './screens/auth/LoginPage';
import RegisterPage from './screens/auth/RegisterPage';
import RegisterTherapistPage from './screens/auth/RegisterTherapistPage';
import Navbar from './components/layout/Navbar';
import HomePage from './screens/patient/HomePage';
import AgendamentosPage from './screens/patient/AgendamentosPage';
import PlaylistsPage from './screens/patient/PlaylistsPage';
import HistoricoPage from './screens/patient/HistoricoPage';
import ProfilePage from './screens/patient/ProfilePage';
import TherapistDashboardPage from './screens/therapist/DashboardPage';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('');
  const [authScreen, setAuthScreen] = useState('login'); // 'login' ou 'register'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const role = userDocSnap.data().role || 'patient';
          setUserRole(role);
          setCurrentPage(role === 'therapist' ? 'dashboard' : 'home');
        } else {
          setUserRole(selectedRole || 'patient');
          setCurrentPage('home');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedRole]);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
  };

  const handleLogout = () => {
    auth.signOut();
    setSelectedRole(null);
    setCurrentPage('');
    setAuthScreen('login');
  };

  const renderPatientPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage user={user} setActivePage={setCurrentPage} />;
      case 'agendamentos': return <AgendamentosPage user={user} />;
      case 'playlists': return <PlaylistsPage user={user} />;
      case 'historico': return <HistoricoPage user={user} />;
      case 'perfil': return <ProfilePage user={user} onLogout={handleLogout} />;
      default: return <HomePage user={user} setActivePage={setCurrentPage} />;
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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

  // Lógica principal para telas de não-logado
  if (!user) {
    // Se nenhum perfil foi escolhido, mostra a tela de seleção
    if (!selectedRole) {
      return <RoleSelectionScreen onSelectRole={handleSelectRole} />;
    }
    
    // Se um perfil foi escolhido, decide entre a tela de Login ou Cadastro
    if (authScreen === 'login') {
        return <LoginPage 
            onLoginSuccess={() => {}} 
            selectedRole={selectedRole} 
            onNavigateToRegister={() => setAuthScreen('register')} 
        />;
    } else { // authScreen === 'register'
        // Decide qual página de CADASTRO mostrar
        if (selectedRole === 'patient') {
            return <RegisterPage 
                selectedRole={selectedRole} 
                onNavigateToLogin={() => setAuthScreen('login')} 
            />;
        } else { // selectedRole === 'therapist'
            return <RegisterTherapistPage 
                selectedRole={selectedRole} 
                onNavigateToLogin={() => setAuthScreen('login')} 
            />;
        }
    }
  }

  // Se o usuário está logado, mostra a interface principal
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