// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import RoleSelectionScreen from './screens/RoleSelectionScreen';
import LoginPage from './screens/auth/LoginPage';
import RegisterPage from './screens/auth/RegisterPage';
import RegisterTherapistPage from './screens/auth/RegisterTherapistPage';
import Navbar from './components/layout/Navbar';
import HomePage from './screens/patient/HomePage';
import AgendaPage from './screens/patient/AgendaPage';
import PlaylistsPage from './screens/patient/PlaylistsPage';
import HistoricoPage from './screens/patient/HistoricoPage';
import ProfilePage from './screens/patient/ProfilePage';
import TherapistDashboardPage from './screens/therapist/DashboardPage';
import TherapistPlaylistsPage from './screens/therapist/PlaylistsPage';
import SessionPage from './screens/therapist/SessionPage';
import AgendaConfigPage from './screens/therapist/AgendaConfigPage';

// ADICIONADO: Import da nova página
import PatientPlaylistsManagement from './screens/therapist/PatientPlaylistsManagement'; 

import RequireRole from './routes/RequireRole';
import { useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import MiniPlayer from './components/player/MiniPlayer';

const MainLayout = ({ userRole, onLogout, children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Navbar onLogout={onLogout} userRole={userRole} />
    <main style={{ flexGrow: 1, backgroundColor: '#F9FAFB', overflowY: 'auto' }}>
      {children}
    </main>
  </div>
);

function App() {
  const { user, userRole, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregando...
      </div>
    );
  }

  return (
    <PlayerProvider>
      <BrowserRouter>
        <>
          <Routes>
            {!user ? (
              <>
                <Route path="/register/:role" element={<RegisterPage />} />
                <Route path="/register-therapist/:role" element={<RegisterTherapistPage />} />
                <Route path="/login/:role" element={<LoginPage />} />
                <Route path="/select-role" element={<RoleSelectionScreen />} />
                <Route path="*" element={<Navigate to="/select-role" replace />} />
              </>
            ) : (
              <>
                <Route
                  path="/dashboard"
                  element={
                    <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                      <MainLayout userRole={userRole} onLogout={logout}>
                        <TherapistDashboardPage user={user} />
                      </MainLayout>
                    </RequireRole>
                  }
                />

                <Route
                  path="/agenda"
                  element={
                    <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                      <MainLayout userRole={userRole} onLogout={logout}>
                        <AgendaConfigPage />
                      </MainLayout>
                    </RequireRole>
                  }
                />

                <Route
                  path="/sessao/:patientId"
                  element={
                    <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                      <MainLayout userRole={userRole} onLogout={logout}>
                        <SessionPage />
                      </MainLayout>
                    </RequireRole>
                  }
                />

                {/* ADICIONADO: Nova rota para gerenciamento de playlists do paciente */}
                <Route
                  path="/therapist/patient/:patientId/playlists"
                  element={
                    <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                      <MainLayout userRole={userRole} onLogout={logout}>
                        <PatientPlaylistsManagement />
                      </MainLayout>
                    </RequireRole>
                  }
                />
                
                {/* ... (Rotas do Paciente) ... */}

                <Route
                  path="/inicio"
                  element={
                    <RequireRole userRole={userRole} requiredRole="patient" redirectTo="/dashboard">
                      <MainLayout userRole={userRole} onLogout={logout}>
                        <HomePage user={user} />
                      </MainLayout>
                    </RequireRole>
                  }
                />

                <Route
                  path="/agendamentos"
                  element={
                    <RequireRole userRole={userRole} requiredRole="patient" redirectTo="/dashboard">
                      <MainLayout userRole={userRole} onLogout={logout}>
                        <AgendaPage user={user} />
                      </MainLayout>
                    </RequireRole>
                  }
                />

                <Route
                  path="/historico"
                  element={
                    <RequireRole userRole={userRole} requiredRole="patient" redirectTo="/dashboard">
                      <MainLayout userRole={userRole} onLogout={logout}>
                        <HistoricoPage user={user} />
                      </MainLayout>
                    </RequireRole>
                  }
                />

                <Route
                  path="/playlists"
                  element={
                    userRole === 'therapist' ? (
                      <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                        <MainLayout userRole={userRole} onLogout={logout}>
                          <TherapistPlaylistsPage user={user} />
                        </MainLayout>
                      </RequireRole>
                    ) : (
                      <RequireRole userRole={userRole} requiredRole="patient" redirectTo="/dashboard">
                        <MainLayout userRole={userRole} onLogout={logout}>
                          <PlaylistsPage user={user} />
                        </MainLayout>
                      </RequireRole>
                    )
                  }
                />

                <Route
                  path="/perfil"
                  element={
                    <RequireRole
                      userRole={userRole}
                      requiredRole={userRole === 'therapist' ? 'therapist' : 'patient'}
                      redirectTo={userRole === 'therapist' ? '/dashboard' : '/inicio'}
                    >
                      <MainLayout userRole={userRole} onLogout={logout}>
                        <ProfilePage user={user} onLogout={logout} />
                      </MainLayout>
                    </RequireRole>
                  }
                />

                <Route
                  path="*"
                  element={<Navigate to={userRole === 'therapist' ? '/dashboard' : '/inicio'} replace />}
                />
              </>
            )}
          </Routes>
          <MiniPlayer />
        </>
      </BrowserRouter>
    </PlayerProvider>
  );
}

export default App;