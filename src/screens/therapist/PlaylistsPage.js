import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, deleteDoc, doc, getDocs } from 'firebase/firestore'; // Adicionar 'deleteDoc', 'doc', 'getDocs'
import Icons from '../../components/common/Icons';
import AddPlaylistModal from '../../components/therapist/AddPlaylistModal';
import PlaylistSongsModal from '../../components/therapist/PlaylistSongsModal';
import Notification from '../../components/common/Notification';

const TherapistDashboardPage = ({ user }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false);
    const [isSongsModalOpen, setIsSongsModalOpen] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    useEffect(() => {
        if (!user) return;
        const playlistsCollectionRef = collection(db, 'playlists');
        const q = query(playlistsCollectionRef, where("therapistUid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const playlistsData = [];
            querySnapshot.forEach((doc) => {
                playlistsData.push({ id: doc.id, ...doc.data() });
            });
            setPlaylists(playlistsData);
            setLoading(false);
        }, (err) => {
            console.error("Erro ao carregar playlists:", err);
            setError("Não foi possível carregar as playlists.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleOpenSongsModal = (playlist) => {
        setSelectedPlaylist(playlist);
        setIsSongsModalOpen(true);
    };

    // --- NOVA FUNÇÃO PARA APAGAR PLAYLISTS ---
    const handleDeletePlaylist = async (playlistId, event) => {
        event.stopPropagation(); // Impede que o modal de músicas abra ao clicar no botão de apagar
        if (window.confirm("Tem a certeza de que quer apagar esta playlist e todas as suas músicas?")) {
            try {
                // Apagar a subcoleção de músicas primeiro
                const songsQuery = query(collection(db, 'playlists', playlistId, 'songs'));
                const songsSnapshot = await getDocs(songsQuery);
                const deletePromises = songsSnapshot.docs.map((songDoc) => deleteDoc(songDoc.ref));
                await Promise.all(deletePromises);

                // Apagar o documento da playlist
                await deleteDoc(doc(db, 'playlists', playlistId));
                setNotification({ message: 'Playlist apagada com sucesso!', type: 'success' });
            } catch (err) {
                console.error("Erro ao apagar playlist:", err);
                setNotification({ message: 'Erro ao apagar a playlist.', type: 'error' });
            }
        }
    };


    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: '0' },
        addButton: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.3s' },
        sectionTitle: { fontSize: '1.5rem', color: '#1F2937', fontWeight: '600', marginBottom: '1.5rem' },
        playlistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' },
        playlistCard: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', position: 'relative' },
        playlistImage: { width: '100%', height: '150px', borderRadius: '8px', objectFit: 'cover', marginBottom: '1rem' },
        playlistName: { margin: 0, color: '#1F2937', fontWeight: 600, fontSize: '1.2rem' },
        playlistDesc: { margin: '4px 0 0 0', color: '#6B7280', fontSize: '0.9rem' },
        // --- NOVO ESTILO PARA O BOTÃO DE APAGAR ---
        deleteButton: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.8)', // Fundo vermelho semi-transparente
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
        }
    };

    const handleCardHover = (e, enter) => { if (enter) { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.08)'; } else { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)'; } };

    return (
        <div style={styles.pageContainer}>
            <AddPlaylistModal 
                isOpen={isAddPlaylistModalOpen} 
                onClose={() => setIsAddPlaylistModalOpen(false)} 
                therapistId={user?.uid}
                setNotification={setNotification}
            />
            {selectedPlaylist && (
                <PlaylistSongsModal
                    isOpen={isSongsModalOpen}
                    onClose={() => setIsSongsModalOpen(false)}
                    playlist={selectedPlaylist}
                    setNotification={setNotification}
                />
            )}
            <Notification message={notification.message} type={notification.type} onDone={() => setNotification({ message: '', type: '' })} />

            <header style={styles.header}>
                <h1 style={styles.title}>Minhas Playlists</h1>
                <button style={styles.addButton} onClick={() => setIsAddPlaylistModalOpen(true)}>
                    <Icons.PlusIcon />
                    <span>Criar Playlist</span>
                </button>
            </header>

            <h2 style={styles.sectionTitle}>Playlists Criadas</h2>
            {loading && <p>Carregando playlists...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}

            {!loading && !error && (
                <div style={styles.playlistGrid}>
                    {playlists.length > 0 ? playlists.map(playlist => (
                        <div 
                            key={playlist.id} 
                            style={styles.playlistCard}
                            onMouseEnter={(e) => handleCardHover(e, true)}
                            onMouseLeave={(e) => handleCardHover(e, false)}
                            onClick={() => handleOpenSongsModal(playlist)}
                        >
                            <img src={playlist.image} alt={playlist.name} style={styles.playlistImage} />
                            <h3 style={styles.playlistName}>{playlist.name}</h3>
                            <p style={styles.playlistDesc}>{playlist.desc}</p>
                            {/* --- BOTÃO DE APAGAR ADICIONADO --- */}
                            <button 
                                style={styles.deleteButton}
                                onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 1)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'}
                            >
                                <Icons.XIcon width="16" height="16" />
                            </button>
                        </div>
                    )) : <p>Nenhuma playlist criada. Clique em "+ Criar Playlist" para começar.</p>}
                </div>
            )}
        </div>
    );
};

export default TherapistDashboardPage;