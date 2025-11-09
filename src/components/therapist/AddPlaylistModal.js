// src/components/therapist/AddPlaylistModal.js
import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AvatarUploader from '../profile/AvatarUploader'; // Importa o uploader de avatar

// Constantes do Cloudinary
const CLOUDINARY_CLOUD_NAME = "de0avsta1"; 
const CLOUDINARY_UPLOAD_PRESET = "viscelius_app_uploads";

// ATUALIZADO: Adicionada a prop 'patientId'
const AddPlaylistModal = ({ isOpen, onClose, therapistId, setNotification, patientId }) => {
    // Estados da Playlist
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(''); 
    
    // Estados do Conteúdo
    const [contentType, setContentType] = useState('videoLink'); // 'videoLink', 'audioFile'
    const [contentName, setContentName] = useState('');
    const [contentArtist, setContentArtist] = useState('');
    const [contentVideoUrl, setContentVideoUrl] = useState(''); // Para link do YouTube
    const [contentMp3File, setContentMp3File] = useState(null); // Para ficheiro MP3

    // Estado de Loading
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(''); // Mensagem de feedback

    // --- LÓGICA DE UPLOAD (sem alterações) ---
    const uploadToCloudinary = async (file, resourceType = 'image') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error(`Falha no upload do ${resourceType} para o Cloudinary`);
        }
    };

    // --- LÓGICA DE VALIDAÇÃO E SALVAMENTO ---
    const validateData = () => {
        // ATUALIZAÇÃO: Verifica se o patientId (que vem como prop) existe
        if (!patientId) return 'Erro: ID do paciente não foi encontrado.';
        if (!name?.trim()) return 'Nome da playlist é obrigatório';
        if (!desc?.trim()) return 'Descrição é obrigatória';
        if (!imageFile) return 'Uma imagem de capa é obrigatória';
        if (!contentName?.trim()) return 'Nome do conteúdo é obrigatório';
        if (contentType === 'videoLink' && !contentVideoUrl?.trim()) return 'URL do vídeo é obrigatório';
        if (contentType === 'audioFile' && !contentMp3File) return 'Ficheiro MP3 é obrigatório';
        return null;
    };

    const handleSave = async () => {
        const error = validateData();
        if (error) {
            setNotification({ message: error, type: 'error' });
            return;
        }

        setIsUploading(true);

        try {
            // 1. Upload da Imagem de Capa
            setUploadProgress('A carregar imagem de capa...');
            const imageUrl = await uploadToCloudinary(imageFile, 'image');

            // 2. Upload do Conteúdo (se for ficheiro MP3)
            let contentUrl = '';
            let contentTypeFirebase = 'video'; 

            if (contentType === 'audioFile') {
                contentTypeFirebase = 'audio';
                setUploadProgress('A carregar ficheiro de áudio (MP3)...');
                contentUrl = await uploadToCloudinary(contentMp3File, 'video'); 
            } else { // 'videoLink'
                contentTypeFirebase = 'video';
                contentUrl = contentVideoUrl.trim();
            }

            // 3. Criar a Playlist no Firestore
            setUploadProgress('A salvar playlist...');
            const playlistData = {
                name: name.trim(),
                desc: desc.trim(),
                image: imageUrl,
                therapistUid: therapistId,
                patientUid: patientId, // ATUALIZAÇÃO: Vincula a playlist ao paciente!
                createdAt: serverTimestamp()
            };
            const playlistDocRef = await addDoc(collection(db, "playlists"), playlistData);
            
            // 4. Adicionar o Conteúdo na subcoleção da Playlist
            setUploadProgress('A salvar conteúdo...');
            const contentData = {
                name: contentName.trim(),
                artist: contentArtist.trim(),
                type: contentTypeFirebase,
                ...(contentTypeFirebase === 'audio' ? { url: contentUrl } : { videoUrl: contentUrl }),
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'playlists', playlistDocRef.id, 'content'), contentData);

            setNotification({ message: 'Playlist criada com sucesso!', type: 'success' });
            handleClose(); // Limpa e fecha o modal
            
        } catch (error) {
            console.error("Erro detalhado ao criar playlist:", error);
            setNotification({ message: `Ocorreu um erro: ${error.message}`, type: 'error' });
        } finally {
            setIsUploading(false);
            setUploadProgress('');
        }
    };
    
    // --- LÓGICA DO COMPONENTE ---
    // (handleFileSelected e handleClose sem alterações)
    const handleFileSelected = (file) => {
        if (file) {
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file)); 
        }
    };
    
    const handleClose = () => {
        if (isUploading) return; 
        setName('');
        setDesc('');
        setImageFile(null);
        setImagePreviewUrl('');
        setContentName('');
        setContentArtist('');
        setContentVideoUrl('');
        setContentMp3File(null);
        setContentType('videoLink');
        setIsUploading(false);
        setUploadProgress('');
        onClose();
    };

    if (!isOpen) { return null; }
    
    // Estilos (sem alterações)
    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' },
        modal: { backgroundColor: '#FFFFFF', margin: '2rem 0', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '550px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' },
        title: { fontSize: '1.5rem', fontWeight: '600', color: '#1F2937', margin: 0 },
        closeButton: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' },
        form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
        inputGroup: { display: 'flex', flexDirection: 'column' },
        label: { marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' },
        input: { width: '100%', padding: '12px 14px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box' },
        select: { width: '100%', padding: '12px 14px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box', background: 'white' },
        footer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' },
        button: { padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
        cancelButton: { backgroundColor: '#F3F4F6', color: '#374151' },
        saveButton: { backgroundColor: '#8B5CF6', color: 'white', opacity: isUploading ? 0.7 : 1 },
        avatarContainer: { display: 'flex', justifyContent: 'center', marginBottom: '1rem' },
        sectionTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' },
        uploadProgressText: { textAlign: 'center', color: '#8B5CF6', fontWeight: '600', height: '20px' }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Criar Nova Playlist</h2>
                    <button style={styles.closeButton} onClick={handleClose} disabled={isUploading}>&times;</button>
                </div>
                
                <div style={styles.form}>
                    <h3 style={styles.sectionTitle}>1. Detalhes da Playlist</h3>
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
                    <div style={styles.inputGroup}>
                        <label htmlFor="name" style={styles.label}>Nome da Playlist</label>
                        <input type="text" id="name" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} disabled={isUploading} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="desc" style={styles.label}>Descrição</label>
                        <input type="text" id="desc" style={styles.input} value={desc} onChange={(e) => setDesc(e.target.value)} disabled={isUploading} />
                    </div>
                    <h3 style={styles.sectionTitle}>2. Primeiro Conteúdo</h3>
                    <div style={styles.inputGroup}>
                        <label htmlFor="contentType" style={styles.label}>Tipo de Conteúdo</label>
                        <select id="contentType" style={styles.select} value={contentType} onChange={(e) => setContentType(e.target.value)} disabled={isUploading}>
                            <option value="videoLink">Link de Vídeo (YouTube)</option>
                            <option value="audioFile">Ficheiro de Áudio (MP3)</option>
                        </select>
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="contentName" style={styles.label}>Nome do Conteúdo</label>
                        <input type="text" id="contentName" style={styles.input} value={contentName} onChange={(e) => setContentName(e.target.value)} disabled={isUploading} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="contentArtist" style={styles.label}>Artista/Autor (Opcional)</label>
                        <input type="text" id="contentArtist" style={styles.input} value={contentArtist} onChange={(e) => setContentArtist(e.target.value)} disabled={isUploading} />
                    </div>
                    {contentType === 'videoLink' ? (
                        <div style={styles.inputGroup}>
                            <label htmlFor="contentVideoUrl" style={styles.label}>URL do Vídeo</label>
                            <input type="text" id="contentVideoUrl" style={styles.input} value={contentVideoUrl} onChange={(e) => setContentVideoUrl(e.target.value)} disabled={isUploading} placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                    ) : (
                        <div style={styles.inputGroup}>
                            <label htmlFor="contentMp3File" style={styles.label}>Ficheiro MP3</label>
                            <input type="file" id="contentMp3File" style={styles.input} accept=".mp3" onChange={(e) => setContentMp3File(e.target.files[0])} disabled={isUploading} />
                        </div>
                    )}
                </div>
                <div style={styles.uploadProgressText}>
                    {isUploading ? uploadProgress : ''}
                </div>
                <div style={styles.footer}>
                    <button style={{ ...styles.button, ...styles.cancelButton }} onClick={handleClose} disabled={isUploading}>
                        Cancelar
                    </button>
                    <button 
                        style={{ ...styles.button, ...styles.saveButton }} 
                        onClick={handleSave} 
                        disabled={isUploading}
                    >
                        {isUploading ? 'Salvando...' : 'Salvar Playlist'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPlaylistModal;