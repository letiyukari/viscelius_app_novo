import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { XIcon, PlayIcon } from '../../common/Icons';
import { usePlayer } from '../../context/PlayerContext';

const PatientPlaylistContentModal = ({ playlist, onClose, onPlayAudio }) => {
    const [content, setContent] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!playlist?.id) return;

        const contentCollectionRef = collection(db, 'playlists', playlist.id, 'content');
        const q = query(contentCollectionRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedContent = [];
            querySnapshot.forEach((doc) => {
                fetchedContent.push({ id: doc.id, ...doc.data() });
            });
            setContent(fetchedContent);
        }, (error) => {
            console.error("Erro ao carregar conteúdo:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar conteúdo.' });
        });

        return () => unsubscribe();
    }, [playlist]);

    const getVideoEmbedUrl = (url) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('youtube.com') 
                ? url.split('v=')[1]?.split('&')[0]
                : url.split('youtu.be/')[1];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('vimeo.com')) {
            const videoId = url.split('vimeo.com/')[1];
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return url;
    };

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        modal: {
            backgroundColor: '#1E1E1E',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            color: '#fff'
        },
        closeButton: {
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            cursor: 'pointer'
        },
        title: {
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            color: '#fff'
        },
        contentItem: {
            backgroundColor: '#282828',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
        },
        contentHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
        },
        contentInfo: {
            flex: 1
        },
        contentTitle: {
            margin: 0,
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600'
        },
        contentArtist: {
            margin: '0.25rem 0 0 0',
            color: '#b3b3b3',
            fontSize: '0.9rem'
        },
        videoContainer: {
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            overflow: 'hidden',
            borderRadius: '4px'
        },
        iframe: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none'
        },
        playButton: {
            background: 'none',
            border: 'none',
            color: '#8B5CF6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.closeButton}>
                    <XIcon />
                </button>
                
                <h2 style={styles.title}>Conteúdo de "{playlist.name}"</h2>

                {content.map(item => (
                    <div key={item.id} style={styles.contentItem}>
                        <div style={styles.contentHeader}>
                            <div style={styles.contentInfo}>
                                <h3 style={styles.contentTitle}>{item.name}</h3>
                                <p style={styles.contentArtist}>{item.artist}</p>
                            </div>
                            {item.type === 'audio' && (
                                <button
                                    style={styles.playButton}
                                    onClick={() => onPlayAudio(item)}
                                >
                                    <PlayIcon width="20" height="20" />
                                    <span>Reproduzir</span>
                                </button>
                            )}
                        </div>
                        
                        {item.type === 'video' && (
                            <div style={styles.videoContainer}>
                                <iframe
                                    style={styles.iframe}
                                    src={getVideoEmbedUrl(item.videoUrl)}
                                    title={item.name}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        )}
                    </div>
                ))}

                {content.length === 0 && (
                    <p style={{ color: '#b3b3b3' }}>
                        Nenhum conteúdo disponível nesta playlist.
                    </p>
                )}
            </div>
        </div>
    );
};

export default PatientPlaylistContentModal;