// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ensureUserDocAndRole, normalizeRole } from '../services/userService';

const AuthContext = createContext({
  user: null,
  userRole: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // user combinado (Auth + Firestore)
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Observa o Firebase Auth e garante doc/role no Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setUser(null);
          setUserRole(null);
          return;
        }

        // Lê “dica” de role (vinda do fluxo de cadastro) para evitar corrida
        const desiredRoleHint = sessionStorage.getItem('viscelius_desired_role');

        const ensured = await ensureUserDocAndRole({
          uid: currentUser.uid,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          desiredRole: desiredRoleHint ?? null,
        });

        // dica já foi usada; limpar
        sessionStorage.removeItem('viscelius_desired_role');

        // Combina Auth + Firestore (Auth tem prioridade p/ nome/foto)
        const combined = {
          ...ensured,
          uid: currentUser.uid,
          email: currentUser.email ?? ensured.email ?? null,
          displayName: currentUser.displayName ?? ensured.displayName ?? null,
          photoURL: currentUser.photoURL ?? ensured.photoURL ?? null,
        };

        setUser(combined);
        setUserRole(normalizeRole(ensured.role));
      } catch (e) {
        console.error('AuthContext: erro ao sincronizar usuário', e);
        setUser(currentUser || null);
        setUserRole(currentUser ? 'patient' : null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  // Força re-sincronização manual (se precisar)
  const refresh = async () => {
    const current = auth.currentUser;
    if (!current) return;
    const ensured = await ensureUserDocAndRole({
      uid: current.uid,
      email: current.email ?? null,
      displayName: current.displayName ?? null,
      desiredRole: null,
    });
    const combined = {
      ...ensured,
      uid: current.uid,
      email: current.email ?? ensured.email ?? null,
      displayName: current.displayName ?? ensured.displayName ?? null,
      photoURL: current.photoURL ?? ensured.photoURL ?? null,
    };
    setUser(combined);
    setUserRole(normalizeRole(ensured.role));
  };

  const value = useMemo(
    () => ({ user, userRole, loading, logout, refresh }),
    [user, userRole, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
