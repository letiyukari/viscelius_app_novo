import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Importa serverTimestamp

// NOVO: Constantes do Cloudinary (necessárias para o upload)
const CLOUDINARY_CLOUD_NAME = "de0avsta1"; 
const CLOUDINARY_UPLOAD_PRESET = "viscelius_app_uploads";

const AddContentModal = ({ isOpen, onClose, playlist, setNotification }) => {
    // ATUALIZAÇÃO: Tipos de conteúdo mais específicos
    const [contentType, setContentType] = useState('videoLink'); // 'videoLink', 'audioFile', 'videoFile'
    const [name, setName] = useState('');
    const [artist, setArtist] = useState('');
    
    const [videoUrl, setVideoUrl] = useState(''); // Para link de vídeo
    
    // NOVO: Estado para o ficheiro de upload (MP3 ou MP4)
    const [mediaFile, setMediaFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // NOVO: Função de upload para o Cloudinary
    // Reutiliza a lógica do PatientDetailModal
    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        // O Cloudinary trata uploads de áudio e vídeo pelo mesmo endpoint 'video'
        const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error(`Falha no upload do ficheiro para o Cloudinary`);
        }
    };

    const handleSave = async () => {
        // ATUALIZAÇÃO: Validação para os 3 tipos
        if (!name.trim()) {
            setNotification({ message: 'Por favor, preencha o nome do conteúdo.', type: 'error' });
            return;
        }
        if (contentType === 'videoLink' && !videoUrl.trim()) {
            setNotification({ message: 'Por favor, preencha o URL do vídeo.', type: 'error' });
            return;
        }
        if ((contentType === 'audioFile' || contentType === 'videoFile') && !mediaFile) {
            setNotification({ message: 'Por favor, selecione um ficheiro.', type: 'error' });
            return;
        }

        setIsUploading(true);
        let contentData = {};

        try {
            if (contentType === 'videoLink') {
                // Opção 1: Link de Vídeo (YouTube/Vimeo)
                contentData = {
                    name: name.trim(),
                    artist: artist.trim(),
                    type: 'video', // Tipo no Firestore
                    videoUrl: videoUrl.trim(),
                    createdAt: serverTimestamp()
                };

            } else {
                // Opção 2 ou 3: Ficheiro de Áudio ou Vídeo
                const uploadedUrl = await uploadToCloudinary(mediaFile);
                
                if (contentType === 'audioFile') {
                    // Salva como Áudio
                    contentData = {
                        name: name.trim(),
                        artist: artist.trim(),
                        type: 'audio', // Tipo no Firestore
                        url: uploadedUrl, // Salva no campo 'url'
                        createdAt: serverTimestamp()
                    };
                } else {
                    // Salva como Vídeo
                    contentData = {
                        name: name.trim(),
                        artist: artist.trim(),
                        type: 'video', // Tipo no Firestore
                        videoUrl: uploadedUrl, // Salva no campo 'videoUrl'
                        createdAt: serverTimestamp()
                    };
                }
            }

            // Salva o documento na subcoleção 'content'
            await addDoc(collection(db, 'playlists', playlist.id, 'content'), contentData);
            setNotification({ message: 'Conteúdo adicionado com sucesso!', type: 'success' });
            handleClose(); // Limpa e fecha o modal
            
        } catch (error) {
            console.error("Erro ao adicionar conteúdo:", error);
            setNotification({ message: `Erro ao adicionar conteúdo: ${error.message}`, type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };
    
    // NOVO: Função para limpar os estados ao fechar
    const handleClose = () => {
        if (isUploading) return;
        setName('');
        setArtist('');
        setVideoUrl('');
        setMediaFile(null);
        setContentType('videoLink');
        onClose();
    };

    // NOVO: Handler para o input de ficheiro
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaFile(file);
        }
    };

    if (!isOpen) return null;

    // --- Estilos (mantidos da sua versão anterior) ---
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
            fontSize: '1rem',
            boxSizing: 'border-box',
            width: '100%'
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
            border: 'none',
            opacity: isUploading ? 0.7 : 1
        }
    };

    return (
        <div style={styles.overlay} onClick={handleClose}>
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
                            disabled={isUploading}
                        >
                            {/* ATUALIZAÇÃO: 3 opções */}
                            <option value="videoLink">Link de Vídeo (YouTube/Vimeo)</option>
                            <option value="audioFile">Ficheiro de Áudio (MP3)</option>
                            <option value="videoFile">Ficheiro de Vídeo (MP4)</option>
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
                            disabled={isUploading}
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
                            disabled={isUploading}
                        />
                    </div>

                    {/* ATUALIZAÇÃO: Inputs condicionais para os 3 tipos */}
                    {contentType === 'videoLink' ? (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>URL do Vídeo (YouTube/Vimeo)</label>
                            <input
                                type="text"
                                style={styles.input}
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                disabled={isUploading}
                            />
                        </div>
                    ) : contentType === 'audioFile' ? (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Ficheiro MP3</label>
                            <input
                                type="file"
                                style={styles.input}
                                accept=".mp3"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </div>
                    ) : ( // (contentType === 'videoFile')
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Ficheiro MP4</label>
                            <input
                                type="file"
                                style={styles.input}
                                accept=".mp4"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </div>
                    )}

                    <div style={styles.buttonContainer}>
                        <button 
                            style={{...styles.button, ...styles.cancelButton}}
                            onClick={handleClose}
                            disabled={isUploading}
                        >
                            Cancelar
                        </button>
                        <button 
                            style={{...styles.button, ...styles.saveButton}}
                            onClick={handleSave}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddContentModal;