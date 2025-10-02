// src/screens/therapist/DashboardPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import Icons from '../../components/common/Icons';
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
  const [viewingPatient, setViewingPatient] = useState(null);
  const [patients, setPatients] = useState([]); // Armazena a lista completa de pacientes da plataforma
  const [filteredPatients, setFilteredPatients] = useState([]); // Armazena a lista filtrada pela busca
  const [searchTerm, setSearchTerm] = useState(''); // Armazena o texto da busca
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

  // carrega TODOS os pacientes da plataforma
  useEffect(() => {
    setLoading(true);
    setError(null);
    const usersCollectionRef = collection(db, 'users');
    
    // ================== CORREÇÃO APLICADA AQUI ==================
    // Antes estava: where('perfil', '==', 'paciente')
    // Corrigido para: where('role', '==', 'patient'), conforme a estrutura do seu Firebase.
    const q = query(usersCollectionRef, where('role', '==', 'patient'));
    // ==========================================================

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const patientsData = [];
        querySnapshot.forEach((doc) => {
          // Garante que o próprio terapeuta (se tiver role 'patient' por algum erro) não apareça na lista
          if (doc.id !== therapistUid) { 
            patientsData.push({ id: doc.id, ...doc.data() });
          }
        });
        setPatients(patientsData);
        setFilteredPatients(patientsData); // Inicialmente, a lista filtrada é igual à completa
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao carregar pacientes:', err);
        setError('Nao foi possivel carregar os pacientes.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [therapistUid]); // Adicionado therapistUid para refiltrar se o usuário mudar

  // Filtra os pacientes conforme o usuário digita na busca
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPatients(patients);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const newFilteredList = patients.filter(patient =>
        (patient.displayName || '').toLowerCase().includes(lowercasedTerm)
      );
      setFilteredPatients(newFilteredList);
    }
  }, [searchTerm, patients]);


  const styles = {
    pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    titleGroup: { display: 'flex', flexDirection: 'column' },
    backWrap: { marginBottom: '1rem' },
    helloSmall: { color: '#6B7280', margin: 0 },
    helloBig: { color: '#1F2937', fontSize: '2.4rem', fontWeight: 800, margin: 0 },
    sectionTitle: { fontSize: '1.5rem', color: '#1F2937', fontWeight: 800, marginBottom: '1.5rem' },
    searchBar: { // Estilo para a barra de busca
        width: '100%',
        padding: '12px 16px',
        fontSize: '1rem',
        marginBottom: '2rem',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        boxSizing: 'border-box'
    },
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
      </header>

      {/* TÍTULO E BARRA DE BUSCA ATUALIZADOS */}
      <h2 style={styles.sectionTitle}>Pacientes na Plataforma</h2>
      <input
        type="text"
        placeholder="Buscar paciente por nome..."
        style={styles.searchBar}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading && <p>Carregando pacientes...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.patientGrid}>
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
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
                    <h3 style={styles.patientName}>{patient.displayName || 'Paciente sem nome'}</h3>
                    <p style={styles.patientDetails}>
                      {patient.age ? `Idade: ${patient.age}` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum paciente encontrado com este nome.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TherapistDashboardPage;