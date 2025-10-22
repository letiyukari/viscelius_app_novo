// src/screens/therapist/SessionPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createConsultation } from '../../services/consultations'; // Usando createConsultation
import { getUserProfile } from '../../services/usersService'; // Usando getUserProfile
import BackButton from '../../components/common/BackButton';
import Notification from '../../components/common/Notification';

const SessionPage = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const therapistId = user?.uid;

    const [patient, setPatient] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Carregar Dados do Paciente
    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            return;
        }

        const loadPatient = async () => {
            try {
                const patientData = await getUserProfile(patientId);
                setPatient(patientData);
            } catch (error) {
                console.error("Erro ao carregar dados do paciente:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPatient();
    }, [patientId]);

    // Função de Salvar Sessão (Simplificada)
    const handleSaveSession = async () => {
        if (!notes.trim()) {
            setNotification({ message: 'As anotações da sessão não podem estar vazias.', type: 'error' });
            return;
        }
        if (!therapistId || !patientId) {
            setNotification({ message: 'Erro de autenticação. Tente fazer login novamente.', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            const consultationData = {
                therapistId: therapistId,
                patientId: patientId,
                notes: notes,
                completedAt: new Date(),
                // Removida a parte de playlists
            };

            await createConsultation(consultationData);
            
            setNotification({ message: 'Sessão registrada com sucesso!', type: 'success' });
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error) {
            console.error("Erro ao salvar sessão:", error);
            setNotification({ message: `Erro ao salvar sessão: ${error.message || 'Verifique o console.'}`, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Estilos (Simplificados)
    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', minHeight: '100vh' },
        header: { marginBottom: '2rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: '0' },
        subtitle: { fontSize: '1.2rem', color: '#6B7280', margin: '0.5rem 0 0 0' },
        textarea: {
            width: '100%',
            minHeight: '300px',
            padding: '1rem',
            fontSize: '1rem',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            resize: 'vertical',
            boxSizing: 'border-box',
        },
        saveButton: {
            backgroundColor: '#8B5CF6',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            marginTop: '1.5rem',
            transition: 'background-color 0.3s',
        },
    };

    if (loading) {
        return <div style={styles.pageContainer}><p>Carregando...</p></div>;
    }
    
    const patientName = patient?.displayName || 'Paciente Desconhecido';

    return (
        <div style={styles.pageContainer}>
            <Notification
                message={notification.message}
                type={notification.type}
                onDone={() => setNotification({ message: '', type: '' })}
            />
            
            <BackButton onClick={() => navigate('/dashboard')}>Voltar para o Painel</BackButton>

            <header style={styles.header}>
                <h1 style={styles.title}>Registro de Sessão</h1>
                <p style={styles.subtitle}>com {patientName}</p>
            </header>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#1F2937' }}>Anotações da Sessão</h2>
                <textarea
                    style={styles.textarea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Descreva as atividades, reações e progresso do paciente durante a sessão..."
                    disabled={saving}
                />
            </section>

            <button
                style={styles.saveButton}
                onClick={handleSaveSession}
                disabled={saving}
            >
                {saving ? 'Salvando...' : 'Salvar Sessão'}
            </button>
        </div>
    );
};

export default SessionPage;
