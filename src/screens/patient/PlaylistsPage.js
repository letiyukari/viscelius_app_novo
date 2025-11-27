// src/screens/patient/PlaylistsPage.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { PlayIcon, PauseIcon } from '../../common/Icons'; 
import { usePlayer, sanitizeTrack } from '../../context/PlayerContext';
import PatientPlaylistContentModal from '../../components/patient/PlaylistContentModal';
import { useAuth } from '../../context/AuthContext';

const PlaylistsPage = () => { 
    const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
    const { user } = useAuth();
    
    const [firestorePlaylists, setFirestorePlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showSongsModal, setShowSongsModal] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);

    useEffect(() => {
        if (!user || !user.uid) { setLoading(false); return; }
        setLoading(true);
        const q = query(collection(db, 'playlists'), where("patientUid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = [];
            snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
            setFirestorePlaylists(fetched);
            setLoading(false);
        }, (error) => {
            console.error(error);
            setMessage({ type: 'error', text: 'Erro ao carregar playlists.' });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const buildQueue = (tracks = [], fallbackImage) =>
        tracks.map((item) => sanitizeTrack({ ...item, image: item.image || fallbackImage })).filter(Boolean);

    const handleTrackAction = (track, queue = [], fallbackImage) => {
        const normalizedTrack = sanitizeTrack({ ...track, image: track.image || fallbackImage });
        if (!normalizedTrack) { setMessage({ type: 'error', text: 'Faixa indisponível.' }); return; }
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

    const openSongsModal = (playlist) => { setSelectedPlaylist(playlist); setShowSongsModal(true); };
    const closeSongsModal = () => { setShowSongsModal(false); setSelectedPlaylist(null); };
    
    const PlaylistCard = ({ item, onPlay, isPlayingNow, isDynamic = false, onViewSongs }) => {
        const [isHovered, setIsHovered] = useState(false);
        const styles = {
            card: { 
                backgroundColor: '#FFFFFF', 
                borderRadius: '16px', 
                padding: '1.25rem', 
                cursor: 'pointer', 
                transition: 'transform 0.2s, box-shadow 0.2s', 
                position: 'relative', 
                width: '200px', 
                flexShrink: 0,
                border: '1px solid #E5E7EB',
                boxShadow: isHovered ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
            },
            cardImage: { 
                width: '100%', 
                height: '160px', 
                borderRadius: '12px', 
                objectFit: 'cover', 
                marginBottom: '1rem',
                backgroundColor: '#F3F4F6'
            },
            cardTitle: { 
                color: '#1F2937', 
                fontWeight: '700', 
                fontSize: '1.1rem',
                margin: '0 0 0.25rem 0', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
            },
            cardDesc: { 
                color: '#6B7280', 
                fontSize: '0.9rem', 
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            },
            playButton: { 
                position: 'absolute', 
                bottom: '90px', 
                right: '25px', 
                backgroundColor: '#8B5CF6', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '50%', 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 6px rgba(139, 92, 246, 0.4)', 
                transition: 'all 0.2s ease', 
                opacity: (isHovered || isPlayingNow) ? 1 : 0, 
                transform: (isHovered || isPlayingNow) ? 'scale(1)' : 'scale(0.8)' 
            },
        };
        return (
            <div style={styles.card} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={isDynamic ? () => onViewSongs(item) : undefined}>
                <img src={item.image} alt={item.name} style={styles.cardImage} />
                <h4 style={styles.cardTitle}>{item.name}</h4>
                <p style={styles.cardDesc}>{item.desc || 'Sem descrição'}</p>
                {!isDynamic && (
                    <button style={styles.playButton} onClick={(e) => { e.stopPropagation(); onPlay(item); }}>
                        {isPlayingNow ? <PauseIcon /> : <PlayIcon />}
                    </button>
                )}
            </div>
        );
    };

    const PlaylistSection = ({ title, data, onPlay, currentTrackId, isPlayingGlobal, isDynamic = false, onViewSongs, isLoading = false }) => (
        <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: '#111827', fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>{title}</h2>
            {isLoading ? (
                <div style={{display: 'flex', gap: '1rem'}}>
                    {[1,2,3].map(i => (
                        <div key={i} style={{width: 200, height: 280, background: '#E5E7EB', borderRadius: 16, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}}></div>
                    ))}
                </div>
            ) : data.length === 0 ? (
                <div style={{ padding: '2rem', background: '#F3F4F6', borderRadius: '12px', color: '#6B7280', textAlign: 'center' }}>
                    {isDynamic ? 'Seu musicoterapeuta ainda não adicionou playlists para você.' : 'Nenhuma playlist disponível.'}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1.5rem', scrollBehavior: 'smooth' }}>
                    {data.map(item => {
                        const normalized = sanitizeTrack({ ...item, image: item.image });
                        const isPlayingNow = !!normalized && normalized.id === currentTrackId && isPlayingGlobal;
                        return <PlaylistCard key={item.id} item={item} onPlay={(track) => onPlay(track, data, item.image)} isPlayingNow={isPlayingNow} isDynamic={isDynamic} onViewSongs={onViewSongs} />;
                    })}
                </div>
            )}
        </section>
    );

    const styles = {
        pageContainer: { 
            padding: '2rem 3.5rem', 
            backgroundColor: '#F9FAFB', // Cor de fundo clara
            color: '#1F2937', 
            fontFamily: '"Inter", sans-serif', 
            overflowY: 'auto', 
            minHeight: '100vh', 
            paddingBottom: '100px' 
        },
        header: { marginBottom: '2.5rem' },
        title: { color: '#1F2937', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', lineHeight: 1.2 },
        subtitle: { fontSize: '1.1rem', color: '#6B7280', margin: 0 },
    };

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <h1 style={styles.title}>Suas Playlists</h1>
                <p style={styles.subtitle}>Coleções selecionadas pelo seu musicoterapeuta.</p>
            </header>

            {message.text && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '12px', backgroundColor: message.type === 'error' ? '#FEF2F2' : '#ECFDF5', color: message.type === 'error' ? '#991B1B' : '#065F46', border: `1px solid ${message.type === 'error' ? '#FCA5A5' : '#6EE7B7'}` }}>
                    {message.text}
                </div>
            )}

            <PlaylistSection
                title="Minha Biblioteca"
                data={firestorePlaylists}
                onPlay={(track, list, fallbackImage) => handleTrackAction(track, list, fallbackImage)}
                currentTrackId={currentTrack?.id}
                isPlayingGlobal={isPlaying}
                isDynamic={true}
                onViewSongs={openSongsModal}
                isLoading={loading}
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