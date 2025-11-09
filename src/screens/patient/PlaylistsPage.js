// src/screens/patient/PlaylistsPage.js
import React, { useState, useEffect } from 'react';

// Importa as ferramentas do Firebase que esta página precisa
import { db } from '../../firebase';
// CORREÇÃO: Removido o "G" sobrando no final da linha
import { collection, onSnapshot, query, where } from 'firebase/firestore'; // Adicionado 'where'

// Importa os ícones que esta página precisa
import { PlayIcon, PauseIcon } from '../../common/Icons'; 
import { usePlayer, sanitizeTrack } from '../../context/PlayerContext';
import PatientPlaylistContentModal from '../../components/patient/PlaylistContentModal';
import { useAuth } from '../../context/AuthContext'; // ADICIONADO: para pegar o usuário logado

// --- PÁGINA DE PLAYLISTS (VERSÃO PACIENTE) ---
const PlaylistsPage = () => { // Removido 'user' das props, usaremos o do AuthContext
    const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
    const { user } = useAuth(); // ADICIONADO: Pega o usuário (paciente) logado
    
    const [firestorePlaylists, setFirestorePlaylists] = useState([]);
    const [loading, setLoading] = useState(true); // ADICIONADO: Estado de loading
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
        { id: 'static-4', name: "Ondas do Mar", desc: "Sinta a brisa do oceano.", image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=1974&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-5', name: "Floresta Amazônica", desc: "Conecte-se com a natureza.", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
        { id: 'static-6', name: "Pássaros da Manhã", desc: "Desperte com sons suaves.", image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1925&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" },
    ];

    // Efeito que busca as playlists do Firestore
    useEffect(() => {
        // Não busca nada se o paciente não estiver logado
        if (!user || !user.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        
        // ATUALIZADO: A query agora filtra playlists onde 'patientUid'
        // é igual ao 'uid' do paciente logado.
        const q = query(
            collection(db, 'playlists'), 
            where("patientUid", "==", user.uid)
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedPlaylists = [];
            querySnapshot.forEach((doc) => {
                fetchedPlaylists.push({ id: doc.id, ...doc.data() });
            });
            setFirestorePlaylists(fetchedPlaylists);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar playlists do Firestore:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar playlists.' });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]); // Depende do usuário logado

    // ... (buildQueue, handleTrackAction, open/closeSongsModal permanecem os mesmos) ...
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

    const openSongsModal = (playlist) => {
        setSelectedPlaylist(playlist);
        setShowSongsModal(true);
    };

    const closeSongsModal = () => {
        setShowSongsModal(false);
        setSelectedPlaylist(null);
    };
    
    // Componente de Card (sem alterações)
    const PlaylistCard = ({ item, onPlay, isPlayingNow, isDynamic = false, onViewSongs }) => {
        const [isHovered, setIsHovered] = useState(false);
        const styles = {
            card: { backgroundColor: '#181818', borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'background-color 0.3s', position: 'relative', width: '180px', flexShrink: 0 },
            cardImage: { width: '100%', height: '150px', borderRadius: '6px', objectFit: 'cover', marginBottom: '1rem' },
            cardTitle: { color: '#fff', fontWeight: '600', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
            cardDesc: { color: '#b3b3b3', fontSize: '0.9rem', margin: 0 },
            playButton: { position: 'absolute', bottom: '75px', right: '20px', backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px rgba(0,0,0,0.3)', transition: 'transform 0.2s, opacity 0.2s', opacity: (isHovered || isPlayingNow) ? 1 : 0, transform: (isHovered || isPlayingNow) ? 'translateY(0)' : 'translateY(10px)' },
        };

        const cardClickHandler = isDynamic ? () => onViewSongs(item) : undefined;

        return (
            <div style={styles.card} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={cardClickHandler}>
                <img src={item.image} alt={item.name} style={styles.cardImage} />
                <h4 style={styles.cardTitle}>{item.name}</h4>
                <p style={styles.cardDesc}>{item.desc}</p>

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
    // ATUALIZADO: Adiciona verificação de loading e de lista vazia
    const PlaylistSection = ({ title, data, onPlay, currentTrackId, isPlayingGlobal, isDynamic = false, onViewSongs, isLoading = false }) => (
        <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>{title}</h2>
            {isLoading ? (
                <p style={{color: '#b3b3b3'}}>Carregando playlists...</p>
            ) : data.length === 0 ? (
                <p style={{color: '#b3b3b3'}}>
                    {isDynamic ? 'Seu terapeuta ainda não criou nenhuma playlist para você.' : 'Nenhuma playlist encontrada.'}
                </p>
            ) : (
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
            )}
        </section>
    );

    // Estilos (sem alterações)
    const styles = {
        pageContainer: { padding: '0 2rem', backgroundColor: '#121212', color: '#fff', fontFamily: '"Inter", sans-serif', overflowY: 'auto', height: '100vh', paddingBottom: '100px' },
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

            {/* ATUALIZADO: Passa o estado de loading */}
            <PlaylistSection
                title="Playlists do seu Terapeuta"
                data={firestorePlaylists}
                onPlay={(track, list, fallbackImage) => handleTrackAction(track, list, fallbackImage)}
                currentTrackId={currentTrack?.id}
                isPlayingGlobal={isPlaying}
                isDynamic={true}
                onViewSongs={openSongsModal}
                isLoading={loading}
            />

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

            {showSongsModal && selectedPlaylist && (
                <PatientPlaylistContentModal
                    playlist={selectedPlaylist}
                    onClose={closeSongsModal}
                    onPlayAudio={(item) => handleTrackAction(item, [], selectedPlaylist.image)}
                />
            )}
        </div>
    );
};

export default PlaylistsPage;