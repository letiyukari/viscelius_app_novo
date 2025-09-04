import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore'; // Adicionar 'deleteDoc' e 'doc'
import Icons from '../common/Icons';

const PlaylistSongsModal = ({ isOpen, onClose, playlist, setNotification }) => {
    const [songs, setSongs] = useState([]);
    const [songName, setSongName] = useState('');
    const [artistName, setArtistName] = useState('');
    const [songUrl, setSongUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        const songsCollectionRef = collection(db, 'playlists', playlist.id, 'songs');
        const q = query(songsCollectionRef);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const songsData = [];
            querySnapshot.forEach((doc) => {
                songsData.push({ id: doc.id, ...doc.data() });
            });
            setSongs(songsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [isOpen, playlist.id]);

    const handleAddSong = async (e) => {
        e.preventDefault();
        if (!songName || !artistName || !songUrl) {
            setNotification({ message: 'Preencha todos os campos da música.', type: 'error' });
            return;
        }
        try {
            await addDoc(collection(db, 'playlists', playlist.id, 'songs'), {
                name: songName,
                artist: artistName,
                url: songUrl,
            });
            setSongName('');
            setArtistName('');
            setSongUrl('');
            setNotification({ message: 'Música adicionada com sucesso!', type: 'success' });
        } catch (error) {
            setNotification({ message: 'Erro ao adicionar música.', type: 'error' });
            console.error("Erro ao adicionar música:", error);
        }
    };

    // --- NOVA FUNÇÃO PARA APAGAR MÚSICAS ---
    const handleDeleteSong = async (songId) => {
        if (window.confirm("Tem a certeza de que quer apagar esta música?")) {
            try {
                await deleteDoc(doc(db, 'playlists', playlist.id, 'songs', songId));
                setNotification({ message: 'Música apagada com sucesso!', type: 'success' });
            } catch (error) {
                setNotification({ message: 'Erro ao apagar música.', type: 'error' });
                console.error("Erro ao apagar música:", error);
            }
        }
    };

    if (!isOpen) return null;

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 },
        modal: { backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' },
        title: { fontSize: '1.5rem', fontWeight: '600', color: '#1F2937', margin: 0 },
        closeButton: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' },
        content: { overflowY: 'auto', flexGrow: 1 },
        songList: { marginBottom: '1.5rem' },
        songItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #F3F4F6' },
        deleteSongButton: { background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' },
        addSongForm: { display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' },
        input: { width: '100%', padding: '12px 14px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box' },
        addButton: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-end' },
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Músicas em "{playlist.name}"</h2>
                    <button style={styles.closeButton} onClick={onClose}><Icons.XIcon /></button>
                </div>
                <div style={styles.content}>
                    {loading ? <p>Carregando...</p> : (
                        <div style={styles.songList}>
                            {songs.length > 0 ? songs.map(song => (
                                <div key={song.id} style={styles.songItem}>
                                    <span>{song.name} - {song.artist}</span>
                                    {/* --- BOTÃO DE APAGAR MÚSICA ADICIONADO --- */}
                                    <button style={styles.deleteSongButton} onClick={() => handleDeleteSong(song.id)}>
                                        <Icons.XIcon width="18" height="18" />
                                    </button>
                                </div>
                            )) : <p>Nenhuma música adicionada ainda.</p>}
                        </div>
                    )}
                    <form onSubmit={handleAddSong} style={styles.addSongForm}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Adicionar Nova Música</h3>
                        <input type="text" placeholder="Nome da música" value={songName} onChange={(e) => setSongName(e.target.value)} style={styles.input} />
                        <input type="text" placeholder="Artista" value={artistName} onChange={(e) => setArtistName(e.target.value)} style={styles.input} />
                        <input type="text" placeholder="URL da música" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} style={styles.input} />
                        <button type="submit" style={styles.addButton}>Adicionar</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PlaylistSongsModal;