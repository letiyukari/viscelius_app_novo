import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Importa a instância do Firestore
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { PlusIcon, UserIcon } from '../../common/Icons'; // Reutiliza seus ícones

// Este é o Painel de Controle do Musicoterapeuta
const TherapistDashboardPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect para buscar os pacientes do Firestore em tempo real
    useEffect(() => {
        // Acessa a coleção 'users' e filtra por perfil 'patient'
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where("role", "==", "patient")); // Filtra apenas por usuários com o perfil 'patient'

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const patientsData = [];
            querySnapshot.forEach((doc) => {
                patientsData.push({ id: doc.id, ...doc.data() });
            });
            setPatients(patientsData);
            setLoading(false);
        }, (err) => {
            console.error("Erro ao carregar pacientes:", err);
            setError("Não foi possível carregar os pacientes. Verifique as regras do Firestore.");
            setLoading(false);
        });

        return () => unsubscribe(); // Limpeza do listener
    }, []);

    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: '0' },
        addButton: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.3s' },
        sectionTitle: { fontSize: '1.5rem', color: '#1F2937', fontWeight: '600', marginBottom: '1.5rem' },
        patientGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
        patientCard: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s, box-shadow 0.2s' },
        cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
        patientAvatar: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        patientInfo: {},
        patientName: { margin: 0, color: '#1F2937', fontWeight: 600, fontSize: '1.2rem' },
        patientEmail: { margin: 0, color: '#6B7280', fontSize: '0.9rem' },
        cardBody: { display: 'flex', justifyContent: 'space-around', color: '#4B5563', borderTop: '1px solid #F3F4F6', paddingTop: '1rem' },
        infoBox: { textAlign: 'center' },
        infoValue: { fontWeight: '600', fontSize: '1.2rem', color: '#1F2937', margin: '0 0 4px 0' },
        infoLabel: { fontSize: '0.8rem', margin: 0 },
        loadingOrErrorText: { textAlign: 'center', color: '#6B7280', fontSize: '1.2rem', marginTop: '3rem' },
    };

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <h1 style={styles.title}>Painel do Terapeuta</h1>
                <button style={styles.addButton} onClick={() => alert('Função para adicionar paciente a ser implementada!')}>
                    <PlusIcon />
                    <span>Adicionar Paciente</span>
                </button>
            </header>

            <h2 style={styles.sectionTitle}>Meus Pacientes</h2>

            {loading && <p style={styles.loadingOrErrorText}>Carregando pacientes...</p>}
            {error && <p style={{...styles.loadingOrErrorText, color: '#EF4444'}}>{error}</p>}

            {!loading && !error && (
                <div style={styles.patientGrid}>
                    {patients.length > 0 ? patients.map(patient => (
                        <div key={patient.id} style={styles.patientCard}>
                            <div style={styles.cardHeader}>
                                <div style={styles.patientAvatar}>
                                    <UserIcon style={{ color: '#8B5CF6' }} />
                                </div>
                                <div style={styles.patientInfo}>
                                    <h3 style={styles.patientName}>{patient.name || 'Nome não cadastrado'}</h3>
                                    <p style={styles.patientEmail}>{patient.email}</p>
                                </div>
                            </div>
                            <div style={styles.cardBody}>
                                <div style={styles.infoBox}>
                                    <p style={styles.infoValue}>8</p>
                                    <p style={styles.infoLabel}>Sessões Totais</p>
                                </div>
                                <div style={styles.infoBox}>
                                    <p style={styles.infoValue}>2</p>
                                    <p style={styles.infoLabel}>Próximas</p>
                                </div>
                            </div>
                        </div>
                    )) : <p>Nenhum paciente encontrado.</p>}
                </div>
            )}
        </div>
    );
};

export default TherapistDashboardPage;