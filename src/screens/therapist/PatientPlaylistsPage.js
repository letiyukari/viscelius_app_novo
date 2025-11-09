// src/screens/therapist/PatientPlaylistsPage.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { PlusIcon, MusicIcon, XIcon } from '../../common/Icons'; 
import AddPlaylistModal from '../../components/therapist/AddPlaylistModal';
import PlaylistContentModal from '../../components/therapist/PlaylistContentModal';
import Notification from '../../components/common/Notification';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/common/BackButton';

const PatientPlaylistsPage = () => {
    const { patientId } = useParams(); // Pega o ID do paciente da URL
    const navigate = useNavigate();
    const { user } = useAuth(); // Pega o terapeuta logado
    const therapistUid = user?.uid;

    const [patient, setPatient] = useState(null); // Estado para guardar dados do paciente
    const [playlists, setPlaylists] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('name-asc'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false);
    const [isSongsModalOpen, setIsSongsModalOpen] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [hoveredCardId, setHoveredCardId] = useState(null);

    // Efeito para buscar o nome do paciente
    useEffect(() => {
        if (!patientId) return;
        const fetchPatient = async () => {
            const patientDocRef = doc(db, 'users', patientId);
            const patientSnap = await getDoc(patientDocRef);
            if (patientSnap.exists()) {
                setPatient(patientSnap.data());
            } else {
                setError("Paciente não encontrado.");
            }
        };
        fetchPatient();
    }, [patientId]);

    // Efeito para buscar as playlists DESTE PACIENTE
    useEffect(() => {
        if (!therapistUid || !patientId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const playlistsCollectionRef = collection(db, 'playlists');
            // ATUALIZADO: A query agora filtra por therapistUid E patientUid
            const q = query(
                playlistsCollectionRef, 
                where("therapistUid", "==", therapistUid),
                where("patientUid", "==", patientId) // Esta é a mágica!
            );
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const playlistsData = [];
                querySnapshot.forEach((doc) => {
                    playlistsData.push({ id: doc.id, ...doc.data() });
                });
                setPlaylists(playlistsData);
                setLoading(false);
            }, (err) => {
                setError("Erro ao carregar playlists: " + err.message);
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (err) {
            setError("Erro ao configurar carregamento de playlists: " + err.message);
            setLoading(false);
        }
    }, [therapistUid, patientId]);

    // ... (Lógica de filtragem, delete, e hover permanecem as mesmas) ...
    const displayedPlaylists = useMemo(() => {
        let filtered = playlists;
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = playlists.filter(playlist => 
                (playlist.name || '').toLowerCase().includes(lowerCaseSearch) ||
                (playlist.desc || '').toLowerCase().includes(lowerCaseSearch)
            );
        }
        return filtered.slice().sort((a, b) => {
            if (sortOrder === 'name-asc') return (a.name || '').localeCompare(b.name || '');
            if (sortOrder === 'name-desc') return (b.name || '').localeCompare(a.name || '');
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            if (sortOrder === 'date-desc') return dateB - dateA;
            if (sortOrder === 'date-asc') return dateA - dateB;
            return 0;
        });
    }, [playlists, searchTerm, sortOrder]); 

    const handleOpenManageModal = (playlist) => {
        setSelectedPlaylist(playlist);
        setIsSongsModalOpen(true);
    };

    const handleDeletePlaylist = async (playlistId, event) => {
        event.stopPropagation();
        if (window.confirm("Tem a certeza de que quer apagar esta playlist e todas as suas músicas?")) {
            try {
                await deleteDoc(doc(db, "playlists", playlistId));
                setNotification({ message: 'Playlist apagada com sucesso!', type: 'success' });
            } catch (err) {
                console.error("Erro ao apagar playlist:", err);
                setNotification({ message: 'Erro ao apagar playlist.', type: 'error' });
            }
        }
    };

    const handleCardHover = (e, enter, playlistId) => {
        setHoveredCardId(enter ? playlistId : null);
        if (enter) {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
        } else {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
        }
    };

    // Estilos (idênticos ao TherapistPlaylistsPage)
    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', minHeight: '100vh' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: 0 },
        patientName: { color: '#6D28D9', fontStyle: 'italic' },
        addButton: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.3s' },
        searchBar: { flexGrow: 1, padding: '12px 16px', fontSize: '1rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxSizing: 'border-box' },
        controlsContainer: { display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' },
        sortSelect: { padding: '12px 16px', fontSize: '1rem', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer' },
        playlistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
        playlistCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s', position: 'relative' },
        cardImage: { width: '100%', height: '150px', objectFit: 'cover' },
        cardContent: { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
        cardTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#1F2937', margin: 0 },
        cardDesc: { fontSize: '0.9rem', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
        deleteButton: { position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background-color 0.3s, opacity 0.3s', zIndex: 10, opacity: 0 },
        songCount: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#6D28D9', fontWeight: '500', marginTop: '0.5rem' }
    };

    return (
        <div style={styles.pageContainer}>
            <Notification message={notification.message} type={notification.type} onDone={() => setNotification({ message: '', type: '' })} />
            
            <div style={{ marginBottom: '1rem' }}>
                <BackButton onClick={() => navigate('/dashboard')} />
            </div>

            <header style={styles.header}>
                <h1 style={styles.title}>
                    Playlists de <span style={styles.patientName}>{patient ? patient.displayName : '...'}</span>
                </h1>
                <button style={styles.addButton} onClick={() => setIsAddPlaylistModalOpen(true)}>
                    <PlusIcon style={{ width: 20, height: 20 }} />
                    Nova Playlist
                </button>
            </header>

            <div style={styles.controlsContainer}>
                <input
                    type="text"
                    placeholder="Buscar na playlist deste paciente..."
                    style={styles.searchBar}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select style={styles.sortSelect} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="date-desc">Mais Recentes</option>
                    <option value="date-asc">Mais Antigas</option>
                    <option value="name-asc">Nome (A-Z)</option>
                    <option value="name-desc">Nome (Z-A)</option>
                </select>
            </div>

            {loading && <p>Carregando playlists...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && displayedPlaylists.length === 0 && (
                <p>
                    {searchTerm 
                        ? `Nenhuma playlist encontrada com o termo "${searchTerm}".`
                        : 'Este paciente ainda não tem playlists. Clique em "Nova Playlist" para criar a primeira.'
                    }
                </p>
            )}

            {!loading && !error && displayedPlaylists.length > 0 && (
                <div style={styles.playlistGrid}>
                    {displayedPlaylists.map((playlist) => { 
                        const songCount = playlist.songs?.length || 0;
                        const isHovered = hoveredCardId === playlist.id;

                        return (
                            <div 
                                key={playlist.id} 
                                style={styles.playlistCard}
                                onMouseEnter={(e) => handleCardHover(e, true, playlist.id)}
                                onMouseLeave={(e) => handleCardHover(e, false, playlist.id)}
                                onClick={() => handleOpenManageModal(playlist)}
                            >
                                <button 
                                    style={{...styles.deleteButton, opacity: isHovered ? 1 : 0}}
                                    onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                                    title="Apagar Playlist"
                                >
                                    <XIcon style={{ width: 16, height: 16 }} />
                                </button>
                                
                                <img src={playlist.image || playlist.imageUrl || ''} alt={playlist.name} style={styles.cardImage} />
                                <div style={styles.cardContent}>
                                    <h3 style={styles.cardTitle}>{playlist.name}</h3>
                                    <p style={styles.cardDesc}>{playlist.desc}</p>
                                    <div style={styles.songCount}>
                                        <MusicIcon style={{ width: 16, height: 16 }} />
                                        <span>{songCount} {songCount === 1 ? 'música' : 'músicas'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ATUALIZADO: O modal de Add agora recebe o patientId! */}
            <AddPlaylistModal
                isOpen={isAddPlaylistModalOpen}
                onClose={() => setIsAddPlaylistModalOpen(false)}
                therapistId={therapistUid}
                setNotification={setNotification}
                patientId={patientId} // Aqui está a ligação!
            />

            {selectedPlaylist && (
                <PlaylistContentModal
                    isOpen={isSongsModalOpen}
                    onClose={() => setIsSongsModalOpen(false)}
                    playlist={selectedPlaylist}
                    setNotification={setNotification}
                    user={user}
                />
            )}
        </div>
    );
};

export default PatientPlaylistsPage;