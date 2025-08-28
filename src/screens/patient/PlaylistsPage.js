import React, { useState, useEffect, useRef } from 'react';

// Importa as ferramentas do Firebase que esta página precisa
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, doc, deleteDoc } from 'firebase/firestore';

// Importa os ícones que esta página precisa
import { XIcon, PlayIcon, PauseIcon } from '../../common/Icons';


// --- MODAL PARA GERENCIAR MÚSICAS DA PLAYLIST ---
const PlaylistDetailModal = ({ playlist, onClose }) => {
    const [songs, setSongs] = useState([]);
    const [newSongName, setNewSongName] = useState('');
    const [newSongArtist, setNewSongArtist] = useState('');
    const [newSongUrl, setNewSongUrl] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
  
    useEffect(() => {
        if (!playlist?.id) return;
  
        const songsCollectionRef = collection(db, 'playlists', playlist.id, 'songs');
        const q = query(songsCollectionRef);
  
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedSongs = [];
            querySnapshot.forEach((doc) => {
                fetchedSongs.push({ id: doc.id, ...doc.data() });
            });
            setSongs(fetchedSongs);
            console.log(`Músicas carregadas para playlist ${playlist.name}:`, fetchedSongs);
        }, (error) => {
            console.error("Erro ao carregar músicas:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar músicas.' });
        });
  
        return () => unsubscribe();
    }, [playlist]);
  
    const handleAddSong = async () => {
        setMessage({ type: '', text: '' });
        if (!newSongName.trim() || !newSongArtist.trim() || !newSongUrl.trim()) {
            setMessage({ type: 'error', text: 'Por favor, preencha todos os campos da música.' });
            return;
        }
  
        try {
            await addDoc(collection(db, 'playlists', playlist.id, 'songs'), {
                name: newSongName,
                artist: newSongArtist,
                url: newSongUrl,
                createdAt: new Date(),
            });
            setMessage({ type: 'success', text: 'Música adicionada com sucesso!' });
            setNewSongName('');
            setNewSongArtist('');
            setNewSongUrl('');
        } catch (e) {
            setMessage({ type: 'error', text: 'Erro ao adicionar música. Tente novamente.' });
            console.error("Erro ao adicionar música: ", e);
        }
    };
  
    const handleDeleteSong = async (songId) => {
        setMessage({ type: '', text: '' });
        try {
            await deleteDoc(doc(db, 'playlists', playlist.id, 'songs', songId));
            setMessage({ type: 'success', text: 'Música removida.' });
        } catch (e) {
            setMessage({ type: 'error', text: 'Erro ao remover música.' });
            console.error("Erro ao remover música: ", e);
        }
    };
  
    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: '#1E1E1E', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', color: '#fff' },
        closeButton: { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' },
        title: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' },
        formGroup: { marginBottom: '1rem' },
        input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#333', color: '#fff', fontSize: '1rem' },
        button: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' },
        message: { padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '0.9rem' },
        successMessage: { backgroundColor: '#d4edda', color: '#155724' },
        errorMessage: { backgroundColor: '#f8d7da', color: '#721c24' },
        songList: { marginTop: '2rem' },
        songItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#282828', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem' },
        songDetails: {},
        songName: { margin: 0, fontWeight: 600 },
        songArtist: { margin: '4px 0 0 0', fontSize: '0.9rem', color: '#b3b3b3' },
        deleteButton: { background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' },
    };
  
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeButton}><XIcon /></button>
                <h2 style={styles.title}>Gerenciar Músicas de "{playlist.name}"</h2>
  
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem' }}>Adicionar Nova Música</h3>
                    <div style={styles.formGroup}>
                        <input type="text" placeholder="Nome da Música" value={newSongName} onChange={(e) => setNewSongName(e.target.value)} style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <input type="text" placeholder="Artista" value={newSongArtist} onChange={(e) => setNewSongArtist(e.target.value)} style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <input type="text" placeholder="URL do Áudio (Ex: /audio/minha-musica.mp3)" value={newSongUrl} onChange={(e) => setNewSongUrl(e.target.value)} style={styles.input} />
                    </div>
                    <button onClick={handleAddSong} style={styles.button}>Adicionar Música</button>
                    {message.text && (
                        <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
                            {message.text}
                        </div>
                    )}
                </div>
  
                <div style={styles.songList}>
                    <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem' }}>Músicas na Playlist</h3>
                    {songs.length > 0 ? (
                        songs.map(song => (
                            <div key={song.id} style={styles.songItem}>
                                <div style={styles.songDetails}>
                                    <p style={styles.songName}>{song.name}</p>
                                    <p style={styles.songArtist}>{song.artist}</p>
                                </div>
                                <button onClick={() => handleDeleteSong(song.id)} style={styles.deleteButton}><XIcon /></button>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#b3b3b3' }}>Nenhuma música nesta playlist ainda.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
  

// --- PÁGINA DE PLAYLISTS ---
const PlaylistsPage = () => {
    const audioRef = useRef(null);
    const [nowPlaying, setNowPlaying] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [firestorePlaylists, setFirestorePlaylists] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPlaylistDetailModal, setShowPlaylistDetailModal] = useState(false);
    const [selectedPlaylistForDetail, setSelectedPlaylistForDetail] = useState(null);
  
    const yourPlaylistsStatic = [
        { id: 'static-1', name: "Calma Interior", desc: "Músicas para acalmar a mente.", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-2', name: "Manhã Positiva", desc: "Comece seu dia com energia.", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-3', name: "Sons de Chuva", desc: "Relaxe com o som da chuva.", image: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1935&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
    ];
    const natureSounds = [
        { id: 'static-4', name: "Ondas do Mar", desc: "Sinta a brisa do oceano.", image: "https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=2070&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-5', name: "Floresta Amazônica", desc: "Conecte-se com a natureza.", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-6', name: "Pássaros da Manhã", desc: "Desperte com sons suaves.", image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1925&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
    ];
    const focusFrequencies = [
      { id: 'static-7', name: "Foco Profundo", desc: "Ondas Alpha para concentração.", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
      { id: 'static-8', name: "Criatividade Ativa", desc: "Frequências para inspirar.", image: "https://images.unsplash.com/photo-1484589065579-248aad0d8b13?q=80&w=1959&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
      { id: 'static-9', name: "Memória e Estudo", desc: "Melhore sua capacidade de aprender.", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
    ];
     const guidedJourneys = [
      { id: 'static-10', name: "Jornada da Gratidão", desc: "10 min de meditação guiada.", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
      { id: 'static-11', name: "Encontrando a Paz", desc: "15 min para aliviar a ansiedade.", image: "https://images.unsplash.com/photo-1597282826928-85e59239d543?q=80&w=1974&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
    ];
  
    const handleAddPlaylist = async () => {
        setMessage({ type: '', text: '' });
        if (!newPlaylistName.trim() || !newPlaylistDesc.trim()) {
            setMessage({ type: 'error', text: 'Por favor, preencha o nome e a descrição da playlist.' });
            return;
        }
  
        try {
            await addDoc(collection(db, 'playlists'), {
                name: newPlaylistName,
                desc: newPlaylistDesc,
                image: "https://images.unsplash.com/photo-1510915361894-db8b60106f34?q=80&w=2070&auto=format&fit=crop", // Imagem padrão
                createdAt: new Date(),
            });
            setMessage({ type: 'success', text: 'Playlist adicionada com sucesso!' });
            setNewPlaylistName('');
            setNewPlaylistDesc('');
        } catch (e) {
            setMessage({ type: 'error', text: 'Erro ao adicionar playlist. Tente novamente.' });
            console.error("Erro ao adicionar documento: ", e);
        }
    };
  
    useEffect(() => {
        const q = query(collection(db, 'playlists'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedPlaylists = [];
            querySnapshot.forEach((doc) => {
                fetchedPlaylists.push({ id: doc.id, ...doc.data() });
            });
            setFirestorePlaylists(fetchedPlaylists);
            console.log("Playlists carregadas do Firestore:", fetchedPlaylists);
        }, (error) => {
            console.error("Erro ao carregar playlists do Firestore:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar playlists.' });
        });
        return () => unsubscribe();
    }, []);
  
    const handlePlayPause = (track) => {
        if (nowPlaying && nowPlaying.id === track.id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            setNowPlaying(track);
        }
    };
  
    useEffect(() => {
        if (nowPlaying && audioRef.current) {
            audioRef.current.src = nowPlaying.url;
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(error => console.error("Erro ao tocar áudio:", error));
        }
    }, [nowPlaying]);
  
    const openPlaylistDetail = (playlist) => {
        setSelectedPlaylistForDetail(playlist);
        setShowPlaylistDetailModal(true);
    };
  
    const closePlaylistDetail = () => {
        setShowPlaylistDetailModal(false);
        setSelectedPlaylistForDetail(null);
    };
  
    const PlaylistCard = ({ item, onPlay, isPlayingNow, isDynamic = false, onManage }) => {
        const [isHovered, setIsHovered] = useState(false);
        const styles = {
            card: { backgroundColor: '#181818', borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'background-color 0.3s', position: 'relative', width: '180px', flexShrink: 0 },
            cardImage: { width: '100%', height: '150px', borderRadius: '6px', objectFit: 'cover', marginBottom: '1rem' },
            cardTitle: { color: '#fff', fontWeight: '600', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
            cardDesc: { color: '#b3b3b3', fontSize: '0.9rem', margin: 0 },
            playButton: { position: 'absolute', bottom: '75px', right: '20px', backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px rgba(0,0,0,0.3)', transition: 'transform 0.2s, opacity 0.2s', opacity: (isHovered || isPlayingNow) ? 1 : 0, transform: (isHovered || isPlayingNow) ? 'translateY(0)' : 'translateY(10px)' },
            manageButton: { position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer', opacity: (isHovered || isPlayingNow) ? 1 : 0, transition: 'opacity 0.2s' }
        };
        return (
            <div style={styles.card} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                <img src={item.image} alt={item.name} style={styles.cardImage} />
                <h4 style={styles.cardTitle}>{item.name}</h4>
                <p style={styles.cardDesc}>{item.desc}</p>
                <button style={styles.playButton} onClick={() => onPlay(item)}>{isPlayingNow ? <PauseIcon/> : <PlayIcon />}</button>
                {isDynamic && (
                    <button style={styles.manageButton} onClick={() => onManage(item)}>Gerenciar</button>
                )}
            </div>
        );
    };
  
    const PlaylistSection = ({ title, data, onPlay, nowPlaying, isPlaying, isDynamic = false, onManage }) => (
        <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>{title}</h2>
            <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                {data.map(item => (
                    <PlaylistCard
                        key={item.id}
                        item={item}
                        onPlay={onPlay}
                        isPlayingNow={nowPlaying?.id === item.id && isPlaying}
                        isDynamic={isDynamic}
                        onManage={onManage}
                    />
                ))}
            </div>
        </section>
    );
  
    const PlayerBar = ({ track, onPlayPause, isPlaying }) => {
        if (!track) return null;
        const styles = {
            playerBar: { position: 'fixed', bottom: 0, left: '250px', right: 0, backgroundColor: '#181818', borderTop: '1px solid #282828', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 },
            trackInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
            trackImage: { width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover' },
            trackDetails: {},
            trackName: { color: '#fff', fontWeight: 600, margin: 0 },
            trackDesc: { color: '#b3b3b3', margin: '4px 0 0 0' },
            controls: { display: 'flex', alignItems: 'center' },
            playPauseButton: { background: 'none', border: '2px solid #fff', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
        };
  
        return (
            <div style={styles.playerBar}>
                <div style={styles.trackInfo}>
                    <img src={track.image} alt={track.name} style={styles.trackImage} />
                    <div style={styles.trackDetails}>
                        <p style={styles.trackName}>{track.name}</p>
                        <p style={styles.trackDesc}>{track.desc}</p>
                    </div>
                </div>
                <div style={styles.controls}>
                    <button style={styles.playPauseButton} onClick={() => onPlayPause(track)}>
                        {isPlaying ? <PauseIcon/> : <PlayIcon/>}
                    </button>
                </div>
            </div>
        );
    };
  
    const styles = {
        pageContainer: { padding: '0 2rem', backgroundColor: '#121212', color: '#fff', fontFamily: '"Inter", sans-serif', overflowY: 'auto', height: '100vh', paddingBottom: '100px' },
        heroSection: { display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '4rem 2rem 2rem 2rem', marginBottom: '2rem', borderRadius: '12px', background: `linear-gradient(to top, #121212 10%, transparent 100%), url(https://images.unsplash.com/photo-1510915361894-db8b60106f34?q=80&w=2070&auto=format&fit=crop)`, backgroundSize: 'cover', backgroundPosition: 'center', height: '340px' },
        heroInfo: {},
        heroTitle: { fontSize: '4rem', fontWeight: '800', margin: '0 0 0.5rem 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' },
        heroDesc: { fontSize: '1rem', color: '#e0e0e0', margin: 0 },
        formContainer: { backgroundColor: '#282828', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' },
        formGroup: { marginBottom: '1rem' },
        input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#333', color: '#fff', fontSize: '1rem' },
        button: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' },
        message: { padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '0.9rem' },
        successMessage: { backgroundColor: '#d4edda', color: '#155724' },
        errorMessage: { backgroundColor: '#f8d7da', color: '#721c24' },
    };
  
    return (
        <div style={styles.pageContainer}>
             <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
            <div style={styles.heroSection}>
                <div style={styles.heroInfo}>
                    <h1 style={styles.heroTitle}>Suas Playlists</h1>
                    <p style={styles.heroDesc}>Gerencie e ouça suas coleções de músicas e sons.</p>
                </div>
            </div>
  
            <div style={styles.formContainer}>
                <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Adicionar Nova Playlist</h2>
                <div style={styles.formGroup}>
                    <input type="text" placeholder="Nome da Playlist" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                    <textarea placeholder="Descrição da Playlist" value={newPlaylistDesc} onChange={(e) => setNewPlaylistDesc(e.target.value)} style={{ ...styles.input, minHeight: '80px' }} ></textarea>
                </div>
                <button onClick={handleAddPlaylist} style={styles.button}>Adicionar Playlist</button>
                {message.text && (<div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>{message.text}</div>)}
            </div>
  
            <PlaylistSection title="Minhas Playlists (Dinâmicas)" data={firestorePlaylists} onPlay={handlePlayPause} nowPlaying={nowPlaying} isPlaying={isPlaying} isDynamic={true} onManage={openPlaylistDetail}/>
            <PlaylistSection title="Suas Playlists (Estáticas)" data={yourPlaylistsStatic} onPlay={handlePlayPause} nowPlaying={nowPlaying} isPlaying={isPlaying}/>
            <PlaylistSection title="Sons da Natureza" data={natureSounds} onPlay={handlePlayPause} nowPlaying={nowPlaying} isPlaying={isPlaying}/>
            <PlaylistSection title="Frequências para Foco" data={focusFrequencies} onPlay={handlePlayPause} nowPlaying={nowPlaying} isPlaying={isPlaying}/>
            <PlaylistSection title="Jornadas Guiadas" data={guidedJourneys} onPlay={handlePlayPause} nowPlaying={nowPlaying} isPlaying={isPlaying}/>
  
            <PlayerBar track={nowPlaying} onPlayPause={handlePlayPause} isPlaying={isPlaying} />
  
            {showPlaylistDetailModal && selectedPlaylistForDetail && (
                <PlaylistDetailModal playlist={selectedPlaylistForDetail} onClose={closePlaylistDetail} />
            )}
        </div>
    );
};

export default PlaylistsPage;