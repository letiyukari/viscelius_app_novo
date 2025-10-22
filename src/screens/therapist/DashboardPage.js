// src/screens/therapist/DashboardPage.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { UserIcon } from '../../common/Icons'; // Ícones necessários
import Notification from '../../components/common/Notification'; // Assumindo components/common
import PatientDetailModal from '../../components/therapist/PatientDetailModal';
import BackButton from '../../components/common/BackButton';
import { useNavigate } from 'react-router-dom';

function niceNameFromEmail(email) {
  if (!email) return '';
  const left = email.split('@')[0] || '';
  const parts = left.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return left;
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

const FILTER_MODES = {
  MY_PATIENTS: 'MY_PATIENTS',
  ALL_PATIENTS: 'ALL_PATIENTS',
};

// Função auxiliar para formatar a data (Assumindo que você tem uma)
const formatDate = (date) => {
    if (!date) return 'Nenhuma';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TherapistDashboardPage = ({ user }) => {
  const navigate = useNavigate();
  const therapistUid = user?.uid;
  const [viewingPatient, setViewingPatient] = useState(null);
  const [patients, setPatients] = useState([]); // Lista completa de pacientes da plataforma
  const [filteredPatients, setFilteredPatients] = useState([]); // Lista filtrada pela busca
  const [searchTerm, setSearchTerm] = useState(''); // Texto da busca
  const [filterMode, setFilterMode] = useState(FILTER_MODES.MY_PATIENTS); // Modo de filtro
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [activityCache, setActivityCache] = useState({}); // Cache de atividade

  // Função para buscar a atividade (última consulta/próximo agendamento)
  // Assumindo que você tem uma função fetchPatientActivity no activityService.js
  const fetchActivity = useCallback(async (patientId) => {
    // Para simplificar a reversão, vamos apenas retornar um objeto vazio
    // Você pode reintroduzir a lógica do activityService.js aqui
    return { nextAppointment: null, lastConsultation: null };
  }, []);

  // Efeito para carregar pacientes
  useEffect(() => {
    if (!therapistUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let q;
    
    // Query condicional para filtrar por modo
    if (filterMode === FILTER_MODES.MY_PATIENTS) {
      q = query(
        collection(db, 'users'),
        where('role', '==', 'patient'),
        where('therapistUid', '==', therapistUid)
      );
    } else {
      q = query(
        collection(db, 'users'),
        where('role', '==', 'patient')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        displayName: doc.data().displayName || niceNameFromEmail(doc.data().email),
      }));
      setPatients(patientList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar pacientes:", error);
      setNotification({ message: 'Erro ao carregar pacientes.', type: 'error' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [therapistUid, filterMode]);

  // Efeito para carregar atividades (mantido, mas simplificado na fetchActivity)
  useEffect(() => {
    if (patients.length > 0) {
      patients.forEach(patient => {
        if (!activityCache[patient.id]) {
          fetchActivity(patient.id).then(activity => {
            setActivityCache(prev => ({ ...prev, [patient.id]: activity }));
          });
        }
      });
    }
  }, [patients, fetchActivity, activityCache]);

  // Efeito para filtrar pacientes por busca
  useEffect(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = patients.filter(patient => 
      patient.displayName.toLowerCase().includes(lowerCaseSearch) ||
      patient.email.toLowerCase().includes(lowerCaseSearch)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const handleToggleFilter = () => {
    setFilterMode(prev => 
      prev === FILTER_MODES.MY_PATIENTS 
        ? FILTER_MODES.ALL_PATIENTS 
        : FILTER_MODES.MY_PATIENTS
    );
    setSearchTerm(''); // Limpa a busca ao trocar de modo
  };

  const renderActivity = (patientId) => {
    const activity = activityCache[patientId];
    if (!activity) return <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>Carregando atividade...</p>;

    return (
      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6B7280' }}>
        <p style={{ margin: 0 }}>
          Próxima Sessão: {formatDate(activity.nextAppointment?.slotStartsAt)}
        </p>
        <p style={{ margin: 0 }}>
          Última Consulta: {formatDate(activity.lastConsultation?.completedAt)}
        </p>
      </div>
    );
  };

  // Estilos (Revertidos para o essencial)
  const styles = {
    pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: 0 },
    searchFilterContainer: { display: 'flex', gap: '10px', marginBottom: '1.5rem', alignItems: 'center' },
    searchBar: {
      flexGrow: 1,
      padding: '12px 15px',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      fontSize: '1rem',
    },
    filterButton: {
      padding: '12px 20px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '1rem',
      backgroundColor: filterMode === FILTER_MODES.MY_PATIENTS ? '#8B5CF6' : '#E5E7EB',
      color: filterMode === FILTER_MODES.MY_PATIENTS ? 'white' : '#1F2937',
      transition: 'background-color 0.3s, color 0.3s',
    },
    patientGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
    },
    patientCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      transition: 'transform 0.1s, box-shadow 0.1s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
      },
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
    },
    patientAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#F3F4F6',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '15px',
    },
    patientName: {
      fontSize: '1.1rem',
      fontWeight: '600',
      margin: 0,
      color: '#1F2937',
    },
    patientDetails: {
      fontSize: '0.9rem',
      color: '#6B7280',
      margin: 0,
    },
    // Removidos estilos de actionButton e agendaButton
  };

  return (
    <div style={styles.pageContainer}>
      <Notification
        message={notification.message}
        type={notification.type}
        onDone={() => setNotification({ message: '', type: '' })}
      />
      
      <header style={styles.header}>
        <h1 style={styles.title}>
          {filterMode === FILTER_MODES.MY_PATIENTS ? 'Meus Pacientes Ativos' : 'Todos os Pacientes da Plataforma'}
        </h1>
      </header>

      <div style={styles.searchFilterContainer}>
        <input
          type="text"
          style={styles.searchBar}
          placeholder="Buscar paciente por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          style={styles.filterButton}
          onClick={handleToggleFilter}
        >
          {filterMode === FILTER_MODES.MY_PATIENTS ? 'Ver Todos' : 'Ver Meus Pacientes'}
        </button>
      </div>

      {loading ? (
        <p>Carregando pacientes...</p>
      ) : (
        <div style={styles.patientGrid}>
          {filteredPatients.length > 0 ? (
            filteredPatients.map(patient => (
              <div 
                key={patient.id} 
                style={styles.patientCard}
                onClick={() => setViewingPatient(patient)}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.patientAvatar}>
                    <UserIcon style={{ color: '#6D28D9' }} />
                  </div>
                  <div>
                    <h3 style={styles.patientName}>{patient.displayName || 'Paciente sem nome'}</h3>
                    <p style={styles.patientDetails}>
                      {patient.age ? `Idade: ${patient.age}` : '—'}
                    </p>
                  </div>
                </div>
                {renderActivity(patient.id)}
              </div>
            ))
          ) : (
            <p>
              {filterMode === FILTER_MODES.MY_PATIENTS 
                ? 'Você ainda não tem pacientes ativos. Use o botão "Ver Todos" para buscar.' 
                : 'Nenhum paciente encontrado com este nome.'
              }
            </p>
          )}
        </div>
      )}

      {viewingPatient && (
        <PatientDetailModal
          isOpen={!!viewingPatient}
          onClose={() => setViewingPatient(null)}
          patient={viewingPatient}
          therapistId={therapistUid}
          setNotification={setNotification}
        />
      )}
    </div>
  );
};

export default TherapistDashboardPage;
