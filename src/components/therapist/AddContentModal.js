import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

const AddContentModal = ({ isOpen, onClose, playlist, setNotification }) => {
    const [contentType, setContentType] = useState('audio'); // 'audio' ou 'video'
    const [name, setName] = useState('');
    const [artist, setArtist] = useState('');
    const [url, setUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');

    const handleSave = async () => {
        if (!name || (!url && !videoUrl)) {
            setNotification({ message: 'Por favor, preencha todos os campos obrigatórios.', type: 'error' });
            return;
        }

        const contentData = {
            name,
            artist,
            type: contentType,
            ...(contentType === 'audio' ? { url } : { videoUrl }),
            createdAt: new Date()
        };

        try {
            await addDoc(collection(db, 'playlists', playlist.id, 'content'), contentData);
            setNotification({ message: 'Conteúdo adicionado com sucesso!', type: 'success' });
            onClose();
        } catch (error) {
            console.error("Erro ao adicionar conteúdo:", error);
            setNotification({ message: 'Erro ao adicionar conteúdo.', type: 'error' });
        }
    };

    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        modal: {
            backgroundColor: '#FFFFFF',
            padding: '2rem',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #E5E7EB',
            paddingBottom: '1rem'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1F2937',
            margin: 0
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '1rem'
        },
        label: {
            marginBottom: '0.5rem',
            color: '#374151',
            fontWeight: '500'
        },
        input: {
            padding: '0.5rem',
            border: '1px solid #D1D5DB',
            borderRadius: '0.375rem',
            fontSize: '1rem'
        },
        select: {
            padding: '0.5rem',
            border: '1px solid #D1D5DB',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            backgroundColor: 'white'
        },
        buttonContainer: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1.5rem'
        },
        button: {
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            cursor: 'pointer'
        },
        cancelButton: {
            backgroundColor: '#F3F4F6',
            border: '1px solid #D1D5DB'
        },
        saveButton: {
            backgroundColor: '#8B5CF6',
            color: 'white',
            border: 'none'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Adicionar Conteúdo</h2>
                </div>
                <div style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Tipo de Conteúdo</label>
                        <select 
                            style={styles.select}
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value)}
                        >
                            <option value="audio">Áudio</option>
                            <option value="video">Vídeo</option>
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Nome</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do conteúdo"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Artista/Autor</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder="Nome do artista ou autor"
                        />
                    </div>

                    {contentType === 'audio' ? (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>URL do Áudio</label>
                            <input
                                type="text"
                                style={styles.input}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="URL do arquivo de áudio"
                            />
                        </div>
                    ) : (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>URL do Vídeo (YouTube/Vimeo)</label>
                            <input
                                type="text"
                                style={styles.input}
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="URL do vídeo"
                            />
                        </div>
                    )}

                    <div style={styles.buttonContainer}>
                        <button 
                            style={{...styles.button, ...styles.cancelButton}}
                            onClick={onClose}
                        >
                            Cancelar
                        </button>
                        <button 
                            style={{...styles.button, ...styles.saveButton}}
                            onClick={handleSave}
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddContentModal;