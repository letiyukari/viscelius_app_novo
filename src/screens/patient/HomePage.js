// src/screens/patient/HomePage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Icons from '../../components/common/Icons';
import BackButton from '../../components/common/BackButton';
import NextSessionCard from '../../components/patient/NextSessionCard';

function niceNameFromEmail(email) {
  if (!email) return '';
  const left = email.split('@')[0] || '';
  const parts = left.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return left;
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

const HomePage = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    async function load() {
      if (!user?.uid) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (live && snap.exists()) setUserData(snap.data());
    }
    load();
    return () => { live = false; };
  }, [user?.uid]);

  const displayName = useMemo(() => {
    const fromFirestore = (userData?.displayName || '').trim();
    const fromAuth = (user?.displayName || '').trim();
    return fromFirestore || fromAuth || niceNameFromEmail(user?.email) || 'Paciente';
  }, [userData?.displayName, user?.displayName, user?.email]);

  const styles = {
    page: { padding: '2rem 3.5rem', background: '#F9FAFB', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
    header: { marginBottom: '1rem' },
    backWrap: { marginBottom: '1rem' },
    helloSmall: { color: '#6B7280', margin: '0 0 .5rem 0' },
    helloBig: { color: '#1F2937', fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1.2 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' },
    card: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.25rem', display: 'flex', gap: 12, alignItems: 'center' },
    cardTitle: { margin: 0, fontWeight: 700, color: '#111827' },
    cardSub: { margin: 0, color: '#6B7280' },
    sectionTitle: { margin: '1.75rem 0 1rem 0', color: '#111827', fontWeight: 800, fontSize: '1.5rem' },
    textCard: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.5rem' }
  };

  return (
    <div style={styles.page}>
      <div style={styles.backWrap}>
        <BackButton />
      </div>

      <header style={styles.header}>
        <p style={styles.helloSmall}>Bem-vindo(a) de volta,</p>
        <h1 style={styles.helloBig}>{displayName}</h1>
      </header>

      <NextSessionCard
        patientId={user?.uid}
        onViewDetails={() => navigate('/agendamentos')}
        onOpenAgenda={() => navigate('/agendamentos')}
        onSchedule={() => navigate('/agendamentos')}
      />

      {/* Acesso rápido */}
      <h3 style={styles.sectionTitle}>Acesso Rápido</h3>
      <div style={styles.grid}>
        <div style={styles.card}>
          <Icons.PlayIcon />
          <div>
            <p style={styles.cardTitle}>Ouvir suas Playlists</p>
            <p style={styles.cardSub}>Sons e músicas para o seu dia.</p>
          </div>
        </div>
        <div style={styles.card}>
          <Icons.WindIcon />
          <div>
            <p style={styles.cardTitle}>Exercício de Respiração</p>
            <p style={styles.cardSub}>Encontre seu foco e calma.</p>
          </div>
        </div>
      </div>

      {/* Conteúdo educativo (mock) */}
      <div style={styles.textCard}>
        <h3 style={styles.sectionTitle}>O que é Musicoterapia?</h3>
        <p style={styles.cardSub}>
          A musicoterapia é o uso profissional da música e seus elementos como uma intervenção
          para otimizar qualidade de vida e bem-estar.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
