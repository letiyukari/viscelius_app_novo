import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { XIcon, PlayIcon } from '../../common/Icons';
import AddContentModal from './AddContentModal';

const PlaylistContentModal = ({ isOpen, onClose, playlist, onPlayAudio = () => {}, setNotification = () => {}, user }) => {
    const [content, setContent] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isAddContentOpen, setIsAddContentOpen] = useState(false);

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
        // Função para extrair o ID do vídeo e gerar URL de embed
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
        contentList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        },
        contentItem: {
            backgroundColor: '#282828',
            padding: '1rem',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        },
        contentHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        contentInfo: {
            flex: 1
        },
        contentName: {
            margin: 0,
            fontWeight: 600,
            color: '#fff'
        },
        contentArtist: {
            margin: '4px 0 0 0',
            fontSize: '0.9rem',
            color: '#b3b3b3'
        },
        videoContainer: {
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
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
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }
    };

    const isOwner = !!(user && playlist && playlist.therapistUid && user.uid === playlist.therapistUid);

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeButton}>
                    <XIcon />
                </button>
                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={styles.title}>Conteúdo de "{playlist.name}"</h2>
                                    {isOwner && (
                                        <button
                                            onClick={() => setIsAddContentOpen(true)}
                                            style={{ backgroundColor: '#8B5CF6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
                                        >
                                            Adicionar Conteúdo
                                        </button>
                                    )}
                                </div>
                
                {message.text && <p>{message.text}</p>}

                <div style={styles.contentList}>
                    {content.length > 0 ? (
                        content.map(item => (
                            <div key={item.id} style={styles.contentItem}>
                                <div style={styles.contentHeader}>
                                    <div style={styles.contentInfo}>
                                        <h3 style={styles.contentName}>{item.name}</h3>
                                        <p style={styles.contentArtist}>{item.artist}</p>
                                    </div>
                                    {item.type === 'audio' && (
                                        <button
                                            style={styles.playButton}
                                            onClick={() => onPlayAudio(item)}
                                        >
                                            <PlayIcon width="24" height="24" />
                                            <span>Reproduzir</span>
                                        </button>
                                    )}
                                </div>
                                
                                {item.type === 'video' && (
                                    <div style={styles.videoContainer}>
                                        <iframe
                                            style={styles.iframe}
                                            src={getVideoEmbedUrl(item.videoUrl)}
                                            title={`${item.name || 'video'} - ${playlist.name}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#b3b3b3' }}>Nenhum conteúdo nesta playlist ainda.</p>
                    )}
                </div>
                {isAddContentOpen && (
                  <AddContentModal
                    isOpen={isAddContentOpen}
                    onClose={() => setIsAddContentOpen(false)}
                    playlist={playlist}
                    setNotification={setNotification}
                  />
                )}
            </div>
        </div>
    );
};

export default PlaylistContentModal;