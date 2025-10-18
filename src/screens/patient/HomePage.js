// src/screens/patient/HomePage.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Icons from '../../components/common/Icons';
import BackButton from '../../components/common/BackButton';
import NextSessionCard from '../../components/patient/NextSessionCard';
import AppointmentDetailModal from '../../components/patient/AppointmentDetailModal';
import BreathingExercise from '../../components/wellness/BreathingExercise';

function niceNameFromEmail(email) {
  if (!email) return '';
  const left = email.split('@')[0] || '';
  const parts = left.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return left;
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

const HomePage = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const breathingSectionRef = useRef(null);
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

  useEffect(() => {
    if (!isModalOpen) return;
    setSelectedAppointment(currentAppointment);
    if (!currentAppointment) {
      setModalOpen(false);
    }
  }, [currentAppointment, isModalOpen]);

  useEffect(() => {
    if (showBreathing && breathingSectionRef.current) {
      breathingSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showBreathing]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
  };

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
    textCard: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.5rem' },
    wellnessSection: { marginTop: '2.5rem' },
    musicTherapySection: { marginTop: '2.5rem', display: 'grid', gap: '1.5rem' },
    missionBlock: {
      background: '#EEF2FF',
      borderRadius: 16,
      padding: '1.5rem',
      border: '1px solid #C7D2FE',
      color: '#1E1B4B',
    },
    faqGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1rem',
    },
    faqCard: {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
    },
    faqQuestion: { margin: 0, fontWeight: 700, color: '#1F2937' },
    faqAnswer: { margin: 0, color: '#6B7280', lineHeight: 1.5 },
    missionTitle: { margin: 0, fontWeight: 800, fontSize: '1.25rem' },
    missionItem: {
      margin: '0.5rem 0 0 0',
      color: '#312E81',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
    },
    missionBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: '#6366F1',
      color: '#FFFFFF',
      fontWeight: 700,
    },
    introCard: {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      padding: '1.5rem',
      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
    },
    introText: { margin: '0.5rem 0 0 0', color: '#4B5563', lineHeight: 1.6 },
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
        onViewDetails={(appointment) => {
          if (appointment) {
            setSelectedAppointment(appointment);
            setModalOpen(true);
          } else {
            navigate('/agendamentos');
          }
        }}
        onOpenAgenda={() => navigate('/agendamentos')}
        onSchedule={() => navigate('/agendamentos')}
        onSessionChange={setCurrentAppointment}
      />

      <AppointmentDetailModal
        open={isModalOpen && !!selectedAppointment}
        appointment={selectedAppointment}
        onClose={handleCloseModal}
      />

      {/* Acesso rápido */}
      <h3 style={styles.sectionTitle}>Acesso Rápido</h3>
      <div style={styles.grid}>
        <div
          style={{ ...styles.card, cursor: 'pointer', transition: 'transform 0.2s ease' }}
          onClick={() => navigate('/playlists')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigate('/playlists');
            }
          }}
        >
          <Icons.PlayIcon />
          <div>
            <p style={styles.cardTitle}>Ouvir suas Playlists</p>
            <p style={styles.cardSub}>Sons e músicas para o seu dia.</p>
          </div>
        </div>
        <div
          style={{ ...styles.card, cursor: 'pointer', transition: 'transform 0.2s ease' }}
          onClick={() => setShowBreathing(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setShowBreathing(true);
            }
          }}
        >
          <Icons.WindIcon />
          <div>
            <p style={styles.cardTitle}>Exercício de Respiração</p>
            <p style={styles.cardSub}>Encontre seu foco e calma.</p>
          </div>
        </div>
      </div>

      {showBreathing && (
        <section ref={breathingSectionRef} style={styles.wellnessSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={styles.sectionTitle}>Respiração guiada</h3>
            <button
              type="button"
              onClick={() => setShowBreathing(false)}
              style={{
                background: 'transparent',
                border: '1px solid #D1D5DB',
                borderRadius: 999,
                padding: '0.5rem 1rem',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Fechar
            </button>
          </div>
          <BreathingExercise />
        </section>
      )}

      <section style={styles.musicTherapySection}>
        <div style={styles.introCard}>
          <h3 style={styles.sectionTitle}>Como a musicoterapia ajuda</h3>
          <p style={styles.introText}>
            A música atua diretamente no sistema nervoso, ajudando a regular o humor, reduzir o estresse e criar
            espaços seguros para expressar emoções. Pequenas doses diárias podem trazer leveza e clareza para a rotina.
          </p>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#111827', fontWeight: 800 }}>Perguntas frequentes</h4>
          <div style={styles.faqGrid}>
            <div style={styles.faqCard}>
              <p style={styles.faqQuestion}>A musicoterapia serve só para relaxar?</p>
              <p style={styles.faqAnswer}>
                Não. Ela também fortalece memória, foco e a conexão com as próprias emoções, usando ritmo, voz e movimento.
              </p>
            </div>
            <div style={styles.faqCard}>
              <p style={styles.faqQuestion}>Preciso praticar com instrumentos?</p>
              <p style={styles.faqAnswer}>
                Não. Nosso foco é ouvir as playlists orientadas pelo seu terapeuta e perceber como o corpo responde a cada som.
              </p>
            </div>
            <div style={styles.faqCard}>
              <p style={styles.faqQuestion}>Como saber se está funcionando?</p>
              <p style={styles.faqAnswer}>
                Observe como você se sente após cada prática. Pequenos sinais, como dormir melhor ou respirar com calma, já contam.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.missionBlock}>
          <h4 style={styles.missionTitle}>Missão da semana</h4>
          <p style={{ margin: '0.75rem 0 0 0', color: '#312E81' }}>
            Experimente um mini-ritual para nutrir corpo e mente:
          </p>
          <div style={styles.missionItem}>
            <span style={styles.missionBadge}>1</span>
            <span>Reserve 10 minutos para ouvir a playlist <strong>“Relaxar”</strong> em um ambiente tranquilo.</span>
          </div>
          <div style={styles.missionItem}>
            <span style={styles.missionBadge}>2</span>
            <span>Após a música, realize 4 ciclos completos da respiração guiada 4-7-8.</span>
          </div>
          <div style={styles.missionItem}>
            <span style={styles.missionBadge}>3</span>
            <span>Anote como se sentiu antes e depois. Consistência fortalece o efeito terapêutico.</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
