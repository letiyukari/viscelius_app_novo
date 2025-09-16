import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Icons from '../common/Icons';
import AddPatientModal from './AddPatientModal';
import Notification from '../common/Notification';
import PatientDetailModal from './PatientDetailModal';

const DashboardPage = ({ user }) => { 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    useEffect(() => {
        if (!user) return;
        const usersCollectionRef = collection(db, 'users');
        
        // ======================= O ERRO ESTAVA AQUI =======================
        // Corrigido de "usersCollection_ref" para "usersCollectionRef"
        const q = query(usersCollectionRef, where("therapistUid", "==", user.uid));
        // ====================================================================

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const patientsData = [];
            querySnapshot.forEach((doc) => {
                patientsData.push({ id: doc.id, ...doc.data() });
            });
            setPatients(patientsData);
            setLoading(false);
        }, (err) => {
            console.error("Erro ao carregar pacientes:", err);
            setError("Não foi possível carregar os pacientes.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', minHeight: '100vh' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: '0' },
        addButton: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.3s' },
        sectionTitle: { fontSize: '1.5rem', color: '#1F2937', fontWeight: '600', marginBottom: '1.5rem' },
        patientGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
        patientCard: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' },
        cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem' },
        patientAvatar: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
        patientInfo: {},
        patientName: { margin: 0, color: '#1F2937', fontWeight: 600, fontSize: '1.2rem' },
        patientDetails: { margin: '4px 0 0 0', color: '#6B7280', fontSize: '0.9rem' },
    };
    
    const handleCardHover = (e, enter) => { if (enter) { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.08)'; } else { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)'; } };

    return (
        <>
            <div style={styles.pageContainer}>
                <AddPatientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} therapistId={user?.uid} setNotification={setNotification} />
                <PatientDetailModal 
                    patient={viewingPatient} 
                    onClose={() => setViewingPatient(null)} 
                    setNotification={setNotification}
                />
                
                <header style={styles.header}>
                    <h1 style={styles.title}>Painel do Terapeuta</h1>
                    <button style={styles.addButton} onClick={() => setIsAddModalOpen(true)}>
                        <Icons.PlusIcon />
                        <span>Adicionar Paciente</span>
                    </button>
                </header>

                <h2 style={styles.sectionTitle}>Meus Pacientes</h2>
                {loading && <p>Carregando pacientes...</p>}
                {error && <p style={{color: 'red'}}>{error}</p>}

                {!loading && !error && (
                    <div style={styles.patientGrid}>
                        {patients.length > 0 ? patients.map(patient => (
                            <div 
                                key={patient.id} 
                                style={styles.patientCard}
                                onMouseEnter={(e) => handleCardHover(e, true)}
                                onMouseLeave={(e) => handleCardHover(e, false)}
                                onClick={() => setViewingPatient(patient)}
                            >
                                <div style={styles.cardHeader}>
                                    <div style={styles.patientAvatar}><Icons.UserIcon style={{ color: '#8B5CF6' }} /></div>
                                    <div style={styles.patientInfo}>
                                        <h3 style={styles.patientName}>{patient.name}</h3>
                                        <p style={styles.patientDetails}>Idade: {patient.age}</p>
                                    </div>
                                </div>
                            </div>
                        )) : <p>Nenhum paciente encontrado. Clique em "+ Adicionar Paciente" para começar.</p>}
                    </div>
                )}
            </div>
            <Notification message={notification.message} type={notification.type} onDone={() => setNotification({ message: '', type: '' })} />
        </>
    );
};

export default DashboardPage;