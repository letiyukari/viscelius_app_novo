// src/screens/therapist/PatientPlaylistsManagement.js
import React, { useState, useEffect, useCallback } from 'react';
// CORREÇÃO: Removido o ponto final extra depois de 'useNavigate'
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import Notification from '../../components/common/Notification';
import BackButton from '../../components/common/BackButton';

const PatientPlaylistsManagement = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { user: therapistUser } = useAuth(); // Pega o terapeuta logado
    
    const [patient, setPatient] = useState(null);
    const [therapistPlaylists, setTherapistPlaylists] = useState([]);
    const [assignedPlaylistIds, setAssignedPlaylistIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // 1. Buscar dados do paciente e suas playlists já atribuídas
    const fetchPatientData = useCallback(async () => {
        try {
            const patientDocRef = doc(db, 'users', patientId);
            const patientSnap = await getDoc(patientDocRef);

            if (patientSnap.exists()) {
                const patientData = patientSnap.data();
                setPatient(patientData);
                // Inicializa o Set com as playlists que o paciente já possui
                setAssignedPlaylistIds(new Set(patientData.assignedPlaylists || []));
            } else {
                setNotification({ message: 'Paciente não encontrado.', type: 'error' });
            }
        } catch (error) {
            console.error("Erro ao buscar paciente:", error);
            setNotification({ message: 'Erro ao carregar dados do paciente.', type: 'error' });
        }
    }, [patientId]);

    // 2. Buscar todas as playlists do terapeuta logado
    useEffect(() => {
        if (!therapistUser?.uid) return;

        setLoading(true);
        const q = query(
            collection(db, 'playlists'),
            where("therapistUid", "==", therapistUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const playlistsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTherapistPlaylists(playlistsData);
            
            // Só paramos o loading depois de buscar o paciente também
            fetchPatientData().then(() => {
                setLoading(false);
            });

        }, (error) => {
            console.error("Erro ao buscar playlists:", error);
            setNotification({ message: 'Erro ao carregar suas playlists.', type: 'error' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [therapistUser, fetchPatientData]);

    // 3. Função para marcar/desmarcar a checkbox
    const handleTogglePlaylist = (playlistId) => {
        setAssignedPlaylistIds(prevSet => {
            const newSet = new Set(prevSet);
            if (newSet.has(playlistId)) {
                newSet.delete(playlistId);
            } else {
                newSet.add(playlistId);
            }
            return newSet;
        });
    };

    // 4. Função para salvar as mudanças no perfil do paciente
    const handleSaveAssignments = async () => {
        setSaving(true);
        try {
            const patientDocRef = doc(db, 'users', patientId);
            // Converte o Set de volta para um array para salvar no Firestore
            const assignedPlaylistsArray = Array.from(assignedPlaylistIds);
            
            await updateDoc(patientDocRef, {
                assignedPlaylists: assignedPlaylistsArray
            });

            setNotification({ message: 'Playlists do paciente atualizadas!', type: 'success' });
            setTimeout(() => navigate('/dashboard'), 1500); // Volta ao painel

        } catch (error) {
            console.error("Erro ao salvar atribuições:", error);
            setNotification({ message: 'Erro ao salvar. Tente novamente.', type: 'error' });
            setSaving(false);
        }
    };

    // Estilos (similares aos de outras páginas)
    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', minHeight: '100vh' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: 0 },
        patientName: { color: '#6D28D9', fontStyle: 'italic' },
        listContainer: { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
        playlistItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #E5E7EB' },
        playlistInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
        playlistImage: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' },
        playlistName: { fontSize: '1rem', fontWeight: '600', color: '#1F2937' },
        checkbox: { transform: 'scale(1.5)', cursor: 'pointer' },
        footer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' },
        saveButton: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', opacity: saving ? 0.7 : 1 },
        cancelButton: { backgroundColor: '#E5E7EB', color: '#374151', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
    };

    if (loading) {
        return <div style={styles.pageContainer}>Carregando...</div>;
    }

    return (
        <div style={styles.pageContainer}>
            <Notification
                message={notification.message}
                type={notification.type}
                onDone={() => setNotification({ message: '', type: '' })}
            />
            <div style={{ marginBottom: '1rem' }}>
                <BackButton />
            </div>
            
            <header style={styles.header}>
                <h1 style={styles.title}>
                    Gerenciar Playlists de <span style={styles.patientName}>{patient?.displayName || 'Paciente'}</span>
                </h1>
            </header>

            <div style={styles.listContainer}>
                {therapistPlaylists.length === 0 ? (
                    <p>Você ainda não criou nenhuma playlist. Vá para "Minhas Playlists" para criar uma.</p>
                ) : (
                    therapistPlaylists.map(playlist => (
                        <div key={playlist.id} style={styles.playlistItem}>
                            <div style={styles.playlistInfo}>
                                <img src={playlist.image || playlist.imageUrl} alt={playlist.name} style={styles.playlistImage} />
                                <div>
                                    <h3 style={styles.playlistName}>{playlist.name}</h3>
                                    <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>{playlist.desc}</p>
                                </div>
                            </div>
                            <input 
                                type="checkbox"
                                style={styles.checkbox}
                                checked={assignedPlaylistIds.has(playlist.id)}
                                onChange={() => handleTogglePlaylist(playlist.id)}
                            />
                        </div>
                    ))
                )}
            </div>

            <div style={styles.footer}>
                <button style={styles.cancelButton} onClick={() => navigate('/dashboard')} disabled={saving}>
                    Cancelar
                </button>
                <button style={styles.saveButton} onClick={handleSaveAssignments} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
};

export default PatientPlaylistsManagement;