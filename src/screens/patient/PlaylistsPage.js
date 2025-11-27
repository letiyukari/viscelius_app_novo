// src/screens/patient/PlaylistsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { PlayIcon, PauseIcon, UserIcon, MusicIcon } from '../../common/Icons'; 
import { usePlayer, sanitizeTrack } from '../../context/PlayerContext';
import PatientPlaylistContentModal from '../../components/patient/PlaylistContentModal';
import { useAuth } from '../../context/AuthContext';

const PlaylistsPage = () => { 
    const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
    const { user } = useAuth();
    
    const [firestorePlaylists, setFirestorePlaylists] = useState([]);
    const [therapists, setTherapists] = useState({}); // Cache de terapeutas: { uid: { name, photoURL } }
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showSongsModal, setShowSongsModal] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [hoveredCardId, setHoveredCardId] = useState(null);

    // 1. Carrega Playlists
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

    // 2. Carrega dados dos Terapeutas das playlists
    useEffect(() => {
        const fetchTherapists = async () => {
            const uniqueTherapistIds = [...new Set(firestorePlaylists.map(p => p.therapistUid).filter(Boolean))];
            const newTherapists = { ...therapists };
            let changed = false;

            for (const uid of uniqueTherapistIds) {
                if (!newTherapists[uid]) {
                    try {
                        const docSnap = await getDoc(doc(db, 'users', uid));
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            newTherapists[uid] = {
                                name: data.displayName || data.name || 'Musicoterapeuta',
                                photoURL: data.photoURL || null
                            };
                            changed = true;
                        }
                    } catch (e) {
                        console.error("Erro ao carregar terapeuta:", e);
                    }
                }
            }

            if (changed) {
                setTherapists(newTherapists);
            }
        };

        if (firestorePlaylists.length > 0) {
            fetchTherapists();
        }
    }, [firestorePlaylists]);

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
    
    const handleCardHover = (e, enter, playlistId) => {
        setHoveredCardId(enter ? playlistId : null);
        if (enter) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
        } else {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
        }
    };

    const PlaylistCard = ({ item, onPlay, isPlayingNow, isDynamic = false, onViewSongs }) => {
        const isHovered = hoveredCardId === item.id;
        const therapist = item.therapistUid ? therapists[item.therapistUid] : null;

        const styles = {
            card: { 
                backgroundColor: '#FFFFFF', 
                borderRadius: '16px', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: '1rem', 
                cursor: 'pointer', 
                transition: 'transform 0.2s, box-shadow 0.2s', 
                position: 'relative', 
                width: '220px', 
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column'
            },
            cardImage: { 
                width: '100%', 
                height: '160px', 
                borderRadius: '12px', 
                objectFit: 'cover', 
                marginBottom: '1rem',
                backgroundColor: '#F3F4F6'
            },
            cardContent: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 },
            cardTitle: { 
                color: '#1F2937', fontWeight: '700', fontSize: '1.1rem', margin: 0, 
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
            },
            cardDesc: { 
                color: '#6B7280', fontSize: '0.9rem', margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
            },
            // Estilo do crachá do terapeuta
            therapistBadge: {
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: '#4B5563',
                backgroundColor: '#F3F4F6',
                padding: '4px 8px',
                borderRadius: '20px',
                marginTop: 'auto', // Empurra para o final se houver espaço
                alignSelf: 'flex-start'
            },
            therapistAvatar: {
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                objectFit: 'cover'
            },
            playButton: { 
                position: 'absolute', 
                bottom: '100px', // Ajustado para não ficar em cima do texto
                right: '20px', 
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
            <div 
                style={styles.card} 
                onMouseEnter={(e) => handleCardHover(e, true, item.id)} 
                onMouseLeave={(e) => handleCardHover(e, false, item.id)} 
                onClick={isDynamic ? () => onViewSongs(item) : undefined}
            >
                <img src={item.image} alt={item.name} style={styles.cardImage} />
                
                {!isDynamic && (
                    <button style={styles.playButton} onClick={(e) => { e.stopPropagation(); onPlay(item); }}>
                        {isPlayingNow ? <PauseIcon /> : <PlayIcon />}
                    </button>
                )}

                <div style={styles.cardContent}>
                    {/* Crachá do Terapeuta */}
                    {isDynamic && therapist && (
                        <div style={styles.therapistBadge}>
                            {therapist.photoURL ? (
                                <img src={therapist.photoURL} alt={therapist.name} style={styles.therapistAvatar} />
                            ) : (
                                <UserIcon style={{ width: 14, height: 14, color: '#6B7280' }} />
                            )}
                            <span style={{maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                {therapist.name}
                            </span>
                        </div>
                    )}

                    <h4 style={styles.cardTitle}>{item.name}</h4>
                    <p style={styles.cardDesc}>{item.desc || 'Sem descrição'}</p>
                </div>
            </div>
        );
    };

    const PlaylistSection = ({ title, data, onPlay, currentTrackId, isPlayingGlobal, isDynamic = false, onViewSongs, isLoading = false }) => (
        <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: '#111827', fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>{title}</h2>
            {isLoading ? (
                <div style={{display: 'flex', gap: '1rem'}}>
                    {[1,2,3].map(i => (
                        <div key={i} style={{width: 220, height: 300, background: '#E5E7EB', borderRadius: 16, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}}></div>
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
            backgroundColor: '#F9FAFB', 
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