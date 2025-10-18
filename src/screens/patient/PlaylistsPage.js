import React, { useState, useEffect } from 'react';

// Importa as ferramentas do Firebase que esta página precisa
import { db } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

// Importa os ícones que esta página precisa
import { XIcon, PlayIcon, PauseIcon } from '../../common/Icons';
import { usePlayer, sanitizeTrack } from '../../context/PlayerContext';

// --- MODAL PARA EXIBIR AS MÚSICAS DA PLAYLIST ---
// Este modal agora apenas lista as músicas para o paciente ouvir.
const PlaylistSongsModal = ({ playlist, onClose, onPlaySong }) => {
    const [songs, setSongs] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Efeito para buscar as músicas da playlist selecionada no Firestore
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
        }, (error) => {
            console.error("Erro ao carregar músicas:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar músicas.' });
        });

        return () => unsubscribe();
    }, [playlist]);

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: '#1E1E1E', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', color: '#fff' },
        closeButton: { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' },
        title: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' },
        songList: { marginTop: '1rem' },
        songItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#282828', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem' },
        songDetails: {},
        songName: { margin: 0, fontWeight: 600 },
        songArtist: { margin: '4px 0 0 0', fontSize: '0.9rem', color: '#b3b3b3' },
        playButton: { background: 'none', border: 'none', color: '#8B5CF6', cursor: 'pointer' },
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeButton}><XIcon /></button>
                <h2 style={styles.title}>Músicas em "{playlist.name}"</h2>
                
                {message.text && <p>{message.text}</p>}

                <div style={styles.songList}>
                    {songs.length > 0 ? (
                        songs.map(song => (
                            <div key={song.id} style={styles.songItem}>
                                <div style={styles.songDetails}>
                                    <p style={styles.songName}>{song.name}</p>
                                    <p style={styles.songArtist}>{song.artist}</p>
                                </div>
                                {/* O botão de play agora passa a música inteira e a imagem da playlist */}
                                <button
                                    onClick={() =>
                                        onPlaySong({
                                            track: { ...song, image: playlist.image },
                                            queue: songs.map((item) => ({ ...item, image: playlist.image })),
                                            index: songs.findIndex((item) => item.id === song.id),
                                        })
                                    }
                                    style={styles.playButton}
                                >
                                    <PlayIcon width="24" height="24" />
                                </button>
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


// --- PÁGINA DE PLAYLISTS (VERSÃO PACIENTE) ---
const PlaylistsPage = () => {
    const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
    const [firestorePlaylists, setFirestorePlaylists] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showSongsModal, setShowSongsModal] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);

    // Playlists estáticas (pré-definidas para o paciente)
    const yourPlaylistsStatic = [
        { id: 'static-1', name: "Calma Interior", desc: "Músicas para acalmar a mente.", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-2', name: "Manhã Positiva", desc: "Comece seu dia com energia.", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-3', name: "Sons de Chuva", desc: "Relaxe com o som da chuva.", image: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1935&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
    ];
    const natureSounds = [
        // ALTERAÇÃO: Imagem corrigida
        { id: 'static-4', name: "Ondas do Mar", desc: "Sinta a brisa do oceano.", image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=1974&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-5', name: "Floresta Amazônica", desc: "Conecte-se com a natureza.", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-6', name: "Pássaros da Manhã", desc: "Desperte com sons suaves.", image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1925&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
    ];
    // ... (outras playlists estáticas se houver)

    // Efeito que busca as playlists do Firestore
    useEffect(() => {
        const q = query(collection(db, 'playlists'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedPlaylists = [];
            querySnapshot.forEach((doc) => {
                fetchedPlaylists.push({ id: doc.id, ...doc.data() });
            });
            setFirestorePlaylists(fetchedPlaylists);
        }, (error) => {
            console.error("Erro ao carregar playlists do Firestore:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar playlists.' });
        });
        return () => unsubscribe();
    }, []);

    const buildQueue = (tracks = [], fallbackImage) =>
        tracks
            .map((item) => sanitizeTrack({ ...item, image: item.image || fallbackImage }))
            .filter(Boolean);

    const handleTrackAction = (track, queue = [], fallbackImage) => {
        const normalizedTrack = sanitizeTrack({ ...track, image: track.image || fallbackImage });
        if (!normalizedTrack) {
            setMessage({ type: 'error', text: 'Faixa indisponível para reprodução.' });
            return;
        }

        const normalizedQueue = buildQueue(queue, fallbackImage);
        const index = normalizedQueue.findIndex((item) => item.id === normalizedTrack.id);

        if (currentTrack?.id === normalizedTrack.id) {
            togglePlayPause();
        } else {
            playTrack(normalizedTrack, {
                queue: normalizedQueue.length ? normalizedQueue : [normalizedTrack],
                index: normalizedQueue.length ? Math.max(index, 0) : 0,
            });
        }
        setMessage({ type: '', text: '' });
    };

    // Funções para controlar o novo modal de músicas
    const openSongsModal = (playlist) => {
        setSelectedPlaylist(playlist);
        setShowSongsModal(true);
    };

    const closeSongsModal = () => {
        setShowSongsModal(false);
        setSelectedPlaylist(null);
    };
    
    // Componente de Card para cada playlist
    const PlaylistCard = ({ item, onPlay, isPlayingNow, isDynamic = false, onViewSongs }) => {
        const [isHovered, setIsHovered] = useState(false);
        const styles = {
            card: { backgroundColor: '#181818', borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'background-color 0.3s', position: 'relative', width: '180px', flexShrink: 0 },
            cardImage: { width: '100%', height: '150px', borderRadius: '6px', objectFit: 'cover', marginBottom: '1rem' },
            cardTitle: { color: '#fff', fontWeight: '600', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
            cardDesc: { color: '#b3b3b3', fontSize: '0.9rem', margin: 0 },
            playButton: { position: 'absolute', bottom: '75px', right: '20px', backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px rgba(0,0,0,0.3)', transition: 'transform 0.2s, opacity 0.2s', opacity: (isHovered || isPlayingNow) ? 1 : 0, transform: (isHovered || isPlayingNow) ? 'translateY(0)' : 'translateY(10px)' },
        };

        // Se a playlist for dinâmica (do Firestore), clicar no card abre a lista de músicas.
        // Se for estática, não faz nada ao clicar no card (só no botão de play).
        const cardClickHandler = isDynamic ? () => onViewSongs(item) : undefined;

        return (
            <div style={styles.card} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={cardClickHandler}>
                <img src={item.image} alt={item.name} style={styles.cardImage} />
                <h4 style={styles.cardTitle}>{item.name}</h4>
                <p style={styles.cardDesc}>{item.desc}</p>

                {/* O botão de play só aparece para playlists estáticas que têm uma URL direta */}
                {!isDynamic && (
                    <button
                        style={styles.playButton}
                        onClick={(event) => {
                            event.stopPropagation();
                            onPlay(item);
                        }}
                    >
                        {isPlayingNow ? <PauseIcon/> : <PlayIcon />}
                    </button>
                )}
            </div>
        );
    };

    // Componente que renderiza uma seção de playlists
    const PlaylistSection = ({ title, data, onPlay, currentTrackId, isPlayingGlobal, isDynamic = false, onViewSongs }) => (
        <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>{title}</h2>
            <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                {data.map(item => {
                    const normalized = sanitizeTrack({ ...item, image: item.image });
                    const isPlayingNow = !!normalized && normalized.id === currentTrackId && isPlayingGlobal;
                    return (
                        <PlaylistCard
                            key={item.id}
                            item={item}
                            onPlay={(track) => onPlay(track, data, item.image)}
                            isPlayingNow={isPlayingNow}
                            isDynamic={isDynamic}
                            onViewSongs={onViewSongs}
                        />
                    );
                })}
            </div>
        </section>
    );

    const styles = {
        pageContainer: { padding: '0 2rem', backgroundColor: '#121212', color: '#fff', fontFamily: '"Inter", sans-serif', overflowY: 'auto', height: '100vh', paddingBottom: '100px' },
        // ALTERAÇÃO: Ajustes no heroSection para remover o vão
        heroSection: { 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '1.5rem', 
            padding: '2rem', 
            marginBottom: '2rem', 
            borderRadius: '12px', 
            background: `linear-gradient(to top, #121212 5%, transparent 100%), url(https://images.unsplash.com/photo-1510915361894-db8b60106f34?q=80&w=2070&auto=format&fit=crop)`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            height: '280px' 
        },
        heroInfo: {},
        // ALTERAÇÃO: Ajuste no tamanho do título para caber melhor
        heroTitle: { 
            fontSize: '3.5rem', 
            fontWeight: '800', 
            margin: '0 0 0.5rem 0', 
            textShadow: '0 2px 10px rgba(0,0,0,0.5)' 
        },
        heroDesc: { fontSize: '1rem', color: '#e0e0e0', margin: 0 },
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.heroSection}>
                <div style={styles.heroInfo}>
                    <h1 style={styles.heroTitle}>Suas Playlists</h1>
                    <p style={styles.heroDesc}>Explore suas coleções de músicas e sons.</p>
                </div>
            </div>

            {/* REMOVIDO: Formulário para adicionar nova playlist */}
            {message.text && (
                <div
                    style={{
                        marginBottom: '1.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: message.type === 'error' ? '#7f1d1d' : '#065f46',
                        color: '#F9FAFB',
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Playlists do terapeuta (dinâmicas) */}
            <PlaylistSection
                title="Playlists do seu Terapeuta"
                data={firestorePlaylists}
                onPlay={(track, list, fallbackImage) => handleTrackAction(track, list, fallbackImage)}
                currentTrackId={currentTrack?.id}
                isPlayingGlobal={isPlaying}
                isDynamic={true}
                onViewSongs={openSongsModal}
            />

            {/* Playlists estáticas */}
            <PlaylistSection
                title="Sugestões para Você"
                data={yourPlaylistsStatic}
                onPlay={(track, list, fallbackImage) => handleTrackAction(track, list, fallbackImage)}
                currentTrackId={currentTrack?.id}
                isPlayingGlobal={isPlaying}
            />
            <PlaylistSection
                title="Sons da Natureza"
                data={natureSounds}
                onPlay={(track, list, fallbackImage) => handleTrackAction(track, list, fallbackImage)}
                currentTrackId={currentTrack?.id}
                isPlayingGlobal={isPlaying}
            />
            {/* ... (outras seções estáticas) */}

            {/* O modal de visualização de músicas é chamado aqui */}
            {showSongsModal && selectedPlaylist && (
                <PlaylistSongsModal 
                    playlist={selectedPlaylist} 
                    onClose={closeSongsModal}
                    onPlaySong={({ track, queue }) =>
                        handleTrackAction(track, queue, selectedPlaylist.image)
                    }
                />
            )}
        </div>
    );
};

export default PlaylistsPage;
