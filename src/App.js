// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Rotas & telas
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
import TherapistPlaylistsPage from './screens/therapist/PlaylistsPage';
import SessionPage from './screens/therapist/SessionPage';
import AgendaConfigPage from './screens/therapist/AgendaConfigPage'; // <<< NOVO

import RequireRole from './routes/RequireRole';
import { useAuth } from './context/AuthContext';

// Layout principal com navbar
const MainLayout = ({ user, userRole, onLogout, children }) => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onLogout={onLogout} userRole={userRole} navigate={navigate} />
      <main style={{ flexGrow: 1, backgroundColor: '#F9FAFB', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

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
    <BrowserRouter>
      <Routes>
        {/* ROTAS PÚBLICAS */}
        {!user ? (
          <>
            <Route path="/register/:role" element={<RegisterPage />} />
            <Route path="/register-therapist/:role" element={<RegisterTherapistPage />} />
            <Route path="/login/:role" element={<LoginPage />} />
            <Route path="/select-role" element={<RoleSelectionScreen />} />
            <Route path="*" element={<Navigate to="/select-role" />} />
          </>
        ) : (
          <>
            {/* ROTAS TERAPEUTA */}
            <Route
              path="/dashboard"
              element={
                <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                  <MainLayout user={user} userRole={userRole} onLogout={logout}>
                    <TherapistDashboardPage user={user} />
                  </MainLayout>
                </RequireRole>
              }
            />
            <Route
              path="/playlists"
              element={
                userRole === 'therapist' ? (
                  <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                    <MainLayout user={user} userRole={userRole} onLogout={logout}>
                      <TherapistPlaylistsPage user={user} />
                    </MainLayout>
                  </RequireRole>
                ) : (
                  <RequireRole userRole={userRole} requiredRole="patient" redirectTo="/dashboard">
                    <MainLayout user={user} userRole={userRole} onLogout={logout}>
                      <PlaylistsPage user={user} />
                    </MainLayout>
                  </RequireRole>
                )
              }
            />
            <Route
              path="/sessao/:patientId"
              element={
                <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                  <MainLayout user={user} userRole={userRole} onLogout={logout}>
                    <SessionPage />
                  </MainLayout>
                </RequireRole>
              }
            />
            {/* NOVO: configurar agenda do terapeuta */}
            <Route
              path="/agenda"
              element={
                <RequireRole userRole={userRole} requiredRole="therapist" redirectTo="/inicio">
                  <MainLayout user={user} userRole={userRole} onLogout={logout}>
                    <AgendaConfigPage />
                  </MainLayout>
                </RequireRole>
              }
            />

            {/* ROTAS PACIENTE */}
            <Route
              path="/inicio"
              element={
                <RequireRole userRole={userRole} requiredRole="patient" redirectTo="/dashboard">
                  <MainLayout user={user} userRole={userRole} onLogout={logout}>
                    <HomePage user={user} />
                  </MainLayout>
                </RequireRole>
              }
            />
            <Route
              path="/agendamentos"
              element={
                <RequireRole userRole={userRole} requiredRole="patient" redirectTo="/dashboard">
                  <MainLayout user={user} userRole={userRole} onLogout={logout}>
                    <AgendamentosPage user={user} />
                  </MainLayout>
                </RequireRole>
              }
            />
            <Route
              path="/historico"
              element={
                <RequireRole userRole={userRole} requiredRole="patient" redirectTo="/dashboard">
                  <MainLayout user={user} userRole={userRole} onLogout={logout}>
                    <HistoricoPage user={user} />
                  </MainLayout>
                </RequireRole>
              }
            />

            {/* WILDCARD: manda para a home correta */}
            <Route
              path="*"
              element={<Navigate to={userRole === 'therapist' ? '/dashboard' : '/inicio'} replace />}
            />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
