import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
import SessionPage from './screens/therapist/SessionPage';

const MainLayout = ({ user, userRole, onLogout, children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onLogout={onLogout} userRole={userRole} />
      <main style={{ flexGrow: 1, backgroundColor: '#F9FAFB', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let finalUser = { ...currentUser };
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserRole(userData.role || 'patient');
          finalUser = { ...finalUser, ...userData };
        } else {
          setUserRole('patient');
        }
        setUser(finalUser);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/register/patient" element={<RegisterPage selectedRole="patient" />} />
            <Route path="/register/therapist" element={<RegisterTherapistPage selectedRole="therapist" />} />
            <Route path="/login/:role" element={<LoginPage />} />
            <Route path="/select-role" element={<RoleSelectionScreen />} />
            <Route path="*" element={<Navigate to="/select-role" />} />
          </>
        ) : (
          <>
            {userRole === 'therapist' ? (
              <>
                <Route path="/dashboard" element={<MainLayout user={user} userRole={userRole} onLogout={handleLogout}><TherapistDashboardPage user={user} /></MainLayout>} />
                <Route path="/perfil" element={<MainLayout user={user} userRole={userRole} onLogout={handleLogout}><ProfilePage user={user} /></MainLayout>} />
                <Route path="/sessao/:patientId" element={<MainLayout user={user} userRole={userRole} onLogout={handleLogout}><SessionPage /></MainLayout>} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            ) : (
              <>
                <Route path="/inicio" element={<MainLayout user={user} userRole={userRole} onLogout={handleLogout}><HomePage user={user} /></MainLayout>} />
                <Route path="/agendamentos" element={<MainLayout user={user} userRole={userRole} onLogout={handleLogout}><AgendamentosPage user={user} /></MainLayout>} />
                <Route path="/playlists" element={<MainLayout user={user} userRole={userRole} onLogout={handleLogout}><PlaylistsPage user={user} /></MainLayout>} />
                <Route path="/historico" element={<MainLayout user={user} userRole={userRole} onLogout={handleLogout}><HistoricoPage user={user} /></MainLayout>} />
                <Route path="/perfil" element={<MainLayout user={user} userRole={userRole} onLogout={handleLogout}><ProfilePage user={user} /></MainLayout>} />
                <Route path="*" element={<Navigate to="/inicio" />} />
              </>
            )}
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
