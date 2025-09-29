// src/screens/therapist/DashboardPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import Icons from '../../components/common/Icons';
import AddPatientModal from '../../components/therapist/AddPatientModal';
import Notification from '../../components/common/Notification';
import PatientDetailModal from '../../components/therapist/PatientDetailModal';
import BackButton from '../../components/common/BackButton';

function niceNameFromEmail(email) {
  if (!email) return '';
  const left = email.split('@')[0] || '';
  const parts = left.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return left;
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

const TherapistDashboardPage = ({ user }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [userData, setUserData] = useState(null);
  const therapistUid = user?.uid;

  // pega o displayName no Firestore
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

  const therapistName = useMemo(() => {
    const fsName = (userData?.displayName || '').trim();
    const authName = (user?.displayName || '').trim();
    return fsName || authName || niceNameFromEmail(user?.email) || 'Profissional';
  }, [userData?.displayName, user?.displayName, user?.email]);

  // carrega pacientes do terapeuta
  useEffect(() => {
    if (!therapistUid) {
      setPatients([]);
      setLoading(false);
      setError(null);
      return undefined;
    }
    setLoading(true);
    setError(null);
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('therapistUid', '==', therapistUid));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const patientsData = [];
        querySnapshot.forEach((doc) => {
          patientsData.push({ id: doc.id, ...doc.data() });
        });
        setPatients(patientsData);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao carregar pacientes:', err);
        setError('Nao foi possivel carregar os pacientes.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [therapistUid]);

  const styles = {
    pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    titleGroup: { display: 'flex', flexDirection: 'column' },
    backWrap: { marginBottom: '1rem' },
    helloSmall: { color: '#6B7280', margin: 0 },
    helloBig: { color: '#1F2937', fontSize: '2.4rem', fontWeight: 800, margin: 0 },
    addButton: {
      backgroundColor: '#6D28D9', color: 'white', border: 'none', padding: '12px 20px',
      borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
      display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity .2s'
    },
    sectionTitle: { fontSize: '1.5rem', color: '#1F2937', fontWeight: 800, marginBottom: '1.5rem' },
    patientGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
    patientCard: {
      backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px',
      border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer'
    },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem' },
    patientAvatar: {
      width: 50, height: 50, borderRadius: '50%', backgroundColor: '#EDE9FE',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    },
    patientName: { margin: 0, color: '#1F2937', fontWeight: 600, fontSize: '1.2rem' },
    patientDetails: { margin: '4px 0 0 0', color: '#6B7280', fontSize: '.9rem' },
  };

  const handleCardHover = (e, enter) => {
    if (enter) {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
    } else {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
    }
  };

  return (
    <div style={styles.pageContainer}>
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        therapistId={user?.uid}
        setNotification={setNotification}
      />
      <PatientDetailModal patient={viewingPatient} onClose={() => setViewingPatient(null)} />
      <Notification
        message={notification.message}
        type={notification.type}
        onDone={() => setNotification({ message: '', type: '' })}
      />

      <div style={styles.backWrap}>
        <BackButton />
      </div>

      <header style={styles.header}>
        <div style={styles.titleGroup}>
          <p style={styles.helloSmall}>Bem-vindo(a) de volta,</p>
          <h1 style={styles.helloBig}>{therapistName}</h1>
        </div>
        <button style={styles.addButton} onClick={() => setIsAddModalOpen(true)}>
          <Icons.PlusIcon />
          <span>Adicionar Paciente</span>
        </button>
      </header>

      <h2 style={styles.sectionTitle}>Meus Pacientes</h2>
      {loading && <p>Carregando pacientes...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.patientGrid}>
          {patients.length > 0 ? (
            patients.map((patient) => (
              <div
                key={patient.id}
                style={styles.patientCard}
                onMouseEnter={(e) => handleCardHover(e, true)}
                onMouseLeave={(e) => handleCardHover(e, false)}
                onClick={() => setViewingPatient(patient)}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.patientAvatar}>
                    <Icons.UserIcon style={{ color: '#6D28D9' }} />
                  </div>
                  <div>
                    <h3 style={styles.patientName}>{patient.name || 'Paciente sem nome'}</h3>
                    <p style={styles.patientDetails}>
                      {patient.age ? `Idade: ${patient.age}` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum paciente encontrado. Clique em “Adicionar Paciente” para começar.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TherapistDashboardPage;
