import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
// NOVO: Importa tudo o que precisamos do Firestore
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore'; 
// NOVO: Importa o AvatarUploader
import AvatarUploader from '../profile/AvatarUploader'; 
import { XIcon, PlayIcon, PlusIcon } from '../../common/Icons'; // Adiciona PlusIcon
import AddContentModal from './AddContentModal';

// NOVO: Constantes do Cloudinary
const CLOUDINARY_CLOUD_NAME = "de0avsta1"; 
const CLOUDINARY_UPLOAD_PRESET = "viscelius_app_uploads";

const PlaylistContentModal = ({ isOpen, onClose, playlist, onPlayAudio = () => {}, setNotification = () => {}, user }) => {
    const [content, setContent] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isAddContentOpen, setIsAddContentOpen] = useState(false);
    
    // --- NOVO: Estados para Edição de Metadados ---
    const [name, setName] = useState(playlist.name || '');
    const [desc, setDesc] = useState(playlist.desc || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(playlist.image || '');
    const [isUploading, setIsUploading] = useState(false);
    // --- Fim dos Novos Estados ---

    useEffect(() => {
        if (!playlist?.id) return;

        // Atualiza os estados de edição se a playlist mudar
        setName(playlist.name || '');
        setDesc(playlist.desc || '');
        setImagePreviewUrl(playlist.image || '');

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
    }, [playlist]); // Depende da playlist inteira

    // --- NOVAS FUNÇÕES DE EDIÇÃO ---

    const handleFileSelected = (file) => {
        if (file) {
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file)); // Atualiza o preview
        }
    };

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error('Falha no upload da imagem para o Cloudinary');
        }
    };

    const handleSaveMetadata = async () => {
        if (!name?.trim()) {
            setNotification({ message: 'O nome é obrigatório.', type: 'error' });
            return;
        }
        
        setIsUploading(true);
        try {
            let imageUrl = playlist.image; // Assume a imagem antiga

            // Se um novo ficheiro foi selecionado, faz o upload
            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile);
            }

            const playlistRef = doc(db, "playlists", playlist.id);
            await updateDoc(playlistRef, {
                name: name.trim(),
                desc: desc.trim(),
                image: imageUrl,
            });

            setNotification({ message: 'Detalhes da playlist atualizados!', type: 'success' });
            setImageFile(null); // Reseta o ficheiro de imagem
        } catch (error) {
            console.error("Erro ao atualizar playlist:", error);
            setNotification({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteContent = async (contentId) => {
        if (window.confirm("Tem a certeza de que quer apagar este item?")) {
            try {
                const contentRef = doc(db, 'playlists', playlist.id, 'content', contentId);
                await deleteDoc(contentRef);
                setNotification({ message: 'Conteúdo apagado!', type: 'success' });
            } catch (error) {
                console.error("Erro ao apagar conteúdo:", error);
                setNotification({ message: `Erro ao apagar: ${error.message}`, type: 'error' });
            }
        }
    };
    
    // --- Fim das Novas Funções ---

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
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: '#1E1E1E', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', color: '#fff' },
        closeButton: { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', zIndex: 20 },
        
        // NOVO: Estilos para o formulário de edição
        editSection: { display: 'flex', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #383838' },
        avatarContainer: { flexShrink: 0 },
        detailsForm: { flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem' },
        inputGroup: { display: 'flex', flexDirection: 'column' },
        label: { marginBottom: '8px', color: '#A0A0A0', fontSize: '14px', fontWeight: '600' },
        input: { width: '100%', padding: '12px 14px', fontSize: '16px', border: '1px solid #505050', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: '#282828', color: '#fff' },
        saveButton: { padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#8B5CF6', color: 'white', opacity: isUploading ? 0.7 : 1, alignSelf: 'flex-start' },

        contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
        title: { fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#fff' },
        addButton: { backgroundColor: '#8B5CF6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        
        contentList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
        contentItem: { backgroundColor: '#282828', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' },
        contentItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        contentInfo: { flex: 1 },
        contentName: { margin: 0, fontWeight: 600, color: '#fff' },
        contentArtist: { margin: '4px 0 0 0', fontSize: '0.9rem', color: '#b3b3b3' },
        videoContainer: { position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '4px' },
        iframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
        playButton: { background: 'none', border: 'none', color: '#8B5CF6', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
        // NOVO: Botão de apagar item
        deleteItemButton: { background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.5rem' }
    };

    const isOwner = !!(user && playlist && playlist.therapistUid && user.uid === playlist.therapistUid);

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeButton}>
                    <XIcon />
                </button>
                
                {/* --- NOVO: FORMULÁRIO DE EDIÇÃO DE METADADOS --- */}
                {isOwner && (
                    <div style={styles.editSection}>
                        <div style={styles.avatarContainer}>
                            <AvatarUploader
                                src={imagePreviewUrl}
                                uploading={isUploading}
                                onFileSelected={handleFileSelected}
                                size={150}
                                disabled={isUploading}
                                initials="PL"
                            />
                        </div>
                        <div style={styles.detailsForm}>
                            <div style={styles.inputGroup}>
                                <label htmlFor="edit-pl-name" style={styles.label}>Nome da Playlist</label>
                                <input id="edit-pl-name" type="text" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} disabled={isUploading} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label htmlFor="edit-pl-desc" style={styles.label}>Descrição</label>
                                <input id="edit-pl-desc" type="text" style={styles.input} value={desc} onChange={(e) => setDesc(e.target.value)} disabled={isUploading} />
                            </div>
                            <button onClick={handleSaveMetadata} style={styles.saveButton} disabled={isUploading}>
                                {isUploading ? 'Salvando...' : 'Salvar Detalhes'}
                            </button>
                        </div>
                    </div>
                )}
                
                {/* --- LISTA DE CONTEÚDO (Como antes, mas com botão de apagar) --- */}
                <div style={styles.contentHeader}>
                    <h2 style={styles.title}>Conteúdo da Playlist</h2>
                    {isOwner && (
                        <button
                            onClick={() => setIsAddContentOpen(true)}
                            style={styles.addButton}
                        >
                            <PlusIcon style={{ width: 16, height: 16 }} />
                            Adicionar
                        </button>
                    )}
                </div>
                
                {message.text && <p>{message.text}</p>}

                <div style={styles.contentList}>
                    {content.length > 0 ? (
                        content.map(item => (
                            <div key={item.id} style={styles.contentItem}>
                                <div style={styles.contentItemHeader}>
                                    <div style={styles.contentInfo}>
                                        <h3 style={styles.contentName}>{item.name}</h3>
                                        <p style={styles.contentArtist}>{item.artist}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {item.type === 'audio' && (
                                            <button
                                                style={styles.playButton}
                                                onClick={() => onPlayAudio(item)}
                                            >
                                                <PlayIcon width="24" height="24" />
                                            </button>
                                        )}
                                        {/* NOVO: Botão de Apagar Conteúdo */}
                                        {isOwner && (
                                            <button
                                                style={styles.deleteItemButton}
                                                onClick={() => handleDeleteContent(item.id)}
                                                title="Apagar item"
                                            >
                                                <XIcon style={{ width: 20, height: 20 }} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {item.type === 'video' && item.videoUrl && (
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
                        <p style={{ color: '#b3b3b3' }}>Nenhum conteúdo nesta playlist ainda. Clique em "Adicionar" para começar.</p>
                    )}
                </div>
                
                {/* O modal de adicionar conteúdo continua a ser chamado aqui */}
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