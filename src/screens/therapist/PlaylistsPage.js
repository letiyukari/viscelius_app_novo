// src/screens/therapist/PlaylistsPage.js
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { PlusIcon, MusicIcon, XIcon, UserIcon } from '../../common/Icons'; 
import AddPlaylistModal from '../../components/therapist/AddPlaylistModal';
import PlaylistContentModal from '../../components/therapist/PlaylistContentModal';
import Notification from '../../components/common/Notification';
import { useAuth } from '../../context/AuthContext';

const TherapistPlaylistsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); 
    const therapistUid = user?.uid;

    const [playlists, setPlaylists] = useState([]);
    const [patients, setPatients] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('date-desc'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // isAddPlaylistModalOpen removido do uso direto pois o botão foi removido
    const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false); 
    const [isSongsModalOpen, setIsSongsModalOpen] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [hoveredCardId, setHoveredCardId] = useState(null);

    // 1. Buscar Pacientes
    useEffect(() => {
        if (!therapistUid) return;
        const fetchPatients = async () => {
            try {
                const q = query(collection(db, 'users'), where('therapistUid', '==', therapistUid));
                const snap = await getDocs(q);
                const patientMap = {};
                snap.forEach(doc => {
                    const data = doc.data();
                    patientMap[doc.id] = data.displayName || data.name || data.email;
                });
                setPatients(patientMap);
            } catch (err) {
                console.error("Erro ao carregar pacientes:", err);
            }
        };
        fetchPatients();
    }, [therapistUid]);

    // 2. Buscar Playlists
    useEffect(() => {
        if (!therapistUid) { setLoading(false); return; }

        setLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'playlists'), 
                where("therapistUid", "==", therapistUid)
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
            setError("Erro: " + err.message);
            setLoading(false);
        }
    }, [therapistUid]);

    const displayedPlaylists = useMemo(() => {
        let filtered = playlists;
        filtered = filtered.filter(p => p.patientUid); 

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(p => {
                const pName = (p.name || '').toLowerCase();
                const pDesc = (p.desc || '').toLowerCase();
                const patientName = (patients[p.patientUid] || '').toLowerCase();
                return pName.includes(lower) || pDesc.includes(lower) || patientName.includes(lower);
            });
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
    }, [playlists, searchTerm, sortOrder, patients]); 

    const handleOpenManageModal = (playlist) => {
        setSelectedPlaylist(playlist);
        setIsSongsModalOpen(true);
    };

    const handleDeletePlaylist = async (playlistId, event) => {
        event.stopPropagation();
        if (window.confirm("Apagar esta playlist permanentemente?")) {
            try {
                await deleteDoc(doc(db, "playlists", playlistId));
                setNotification({ message: 'Playlist apagada!', type: 'success' });
            } catch (err) {
                setNotification({ message: 'Erro ao apagar.', type: 'error' });
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

    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', minHeight: '100vh' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: 0 },
        // addButton removido pois o botão foi retirado
        searchBar: { flexGrow: 1, padding: '12px 16px', fontSize: '1rem', borderRadius: '12px', border: '1px solid #E5E7EB' },
        controlsContainer: { display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' },
        sortSelect: { padding: '12px 16px', fontSize: '1rem', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: 'white' },
        playlistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
        playlistCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative', display: 'flex', flexDirection: 'column' },
        cardImage: { width: '100%', height: '150px', objectFit: 'cover' },
        cardContent: { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 },
        cardTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#1F2937', margin: 0 },
        cardDesc: { fontSize: '0.9rem', color: '#6B7280', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
        patientBadge: { fontSize: '0.75rem', fontWeight: '600', color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' },
        deleteButton: { position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.3s' },
        songCount: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#6B7280', fontWeight: '500', marginTop: 'auto', paddingTop: '0.5rem' }
    };

    return (
        <div style={styles.pageContainer}>
            <Notification message={notification.message} type={notification.type} onDone={() => setNotification({ message: '', type: '' })} />
            
            <header style={styles.header}>
                <h1 style={styles.title}>Playlists dos Pacientes</h1>
                {/* Botão "Nova Playlist" removido conforme solicitado */}
            </header>

            <div style={styles.controlsContainer}>
                <input type="text" placeholder="Buscar por playlist ou nome do paciente..." style={styles.searchBar} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <select style={styles.sortSelect} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="date-desc">Mais Recentes</option>
                    <option value="date-asc">Mais Antigas</option>
                    <option value="name-asc">Nome (A-Z)</option>
                    <option value="name-desc">Nome (Z-A)</option>
                </select>
            </div>

            {loading && <p>Carregando...</p>}
            {!loading && !error && displayedPlaylists.length === 0 && <p>Nenhuma playlist encontrada.</p>}

            {!loading && !error && displayedPlaylists.length > 0 && (
                <div style={styles.playlistGrid}>
                    {displayedPlaylists.map((playlist) => { 
                        const isHovered = hoveredCardId === playlist.id;
                        const patientName = patients[playlist.patientUid] || 'Paciente';

                        return (
                            <div key={playlist.id} style={styles.playlistCard} onMouseEnter={(e) => handleCardHover(e, true, playlist.id)} onMouseLeave={(e) => handleCardHover(e, false, playlist.id)} onClick={() => handleOpenManageModal(playlist)}>
                                <button style={{...styles.deleteButton, opacity: isHovered ? 1 : 0}} onClick={(e) => handleDeletePlaylist(playlist.id, e)}><XIcon style={{ width: 16, height: 16 }} /></button>
                                <img src={playlist.image || ''} alt={playlist.name} style={styles.cardImage} />
                                <div style={styles.cardContent}>
                                    <div style={styles.patientBadge}>
                                        <UserIcon style={{width: 12, height: 12}} />
                                        {patientName}
                                    </div>
                                    <h3 style={styles.cardTitle}>{playlist.name}</h3>
                                    <p style={styles.cardDesc}>{playlist.desc}</p>
                                    <div style={styles.songCount}>
                                        <MusicIcon style={{ width: 16, height: 16 }} />
                                        <span>Ver conteúdo</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal mantido para integridade, mas não acessível por botão nesta tela */}
            <AddPlaylistModal
                isOpen={isAddPlaylistModalOpen}
                onClose={() => setIsAddPlaylistModalOpen(false)}
                therapistId={therapistUid}
                setNotification={setNotification}
                patientId={null} 
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

export default TherapistPlaylistsPage;