// src/components/therapist/PatientDetailModal.js

import React, { useState } from 'react';
// NOVO: Ferramentas do Firebase para salvar os dados
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Icons from '../common/Icons';

// ===================================================================
// Suas informações do Cloudinary já estão configuradas aqui
const CLOUDINARY_CLOUD_NAME = "de0avsta1"; 
const CLOUDINARY_UPLOAD_PRESET = "viscelius_app_uploads";
// ===================================================================

const PatientDetailModal = ({ patient, onClose, setNotification }) => {
    const [mp3File, setMp3File] = useState(null);
    const [link, setLink] = useState('');
    // NOVO: Estado para mostrar feedback de loading durante o upload
    const [isUploading, setIsUploading] = useState(false);

    if (!patient) {
        return null;
    }
    
    // ATUALIZADO: A função agora é 'async' e faz o upload real
    const handleMaterialSubmit = async (event) => {
        event.preventDefault();

        if (!mp3File && !link) {
            // Usando a notificação do sistema em vez de um alerta
            if(setNotification) setNotification({ message: 'Por favor, adicione um arquivo ou um link.', type: 'error' });
            return;
        }

        setIsUploading(true); // Inicia o loading no botão

        try {
            // PARTE 1: Se existir um arquivo MP3 para upload
            if (mp3File) {
                const formData = new FormData();
                formData.append('file', mp3File);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                // Faz a chamada para a API do Cloudinary
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                
                // Salva a URL do áudio no Firestore, dentro do paciente correto
                const materialRef = collection(db, 'users', patient.id, 'materials');
                await addDoc(materialRef, {
                    type: 'audio',
                    url: data.secure_url,
                    fileName: mp3File.name,
                    createdAt: serverTimestamp()
                });
            }

            // PARTE 2: Se existir um link de texto (Ex: YouTube)
            if (link) {
                const materialRef = collection(db, 'users', patient.id, 'materials');
                await addDoc(materialRef, {
                    type: 'link',
                    url: link,
                    createdAt: serverTimestamp()
                });
            }
            
            if(setNotification) setNotification({ message: 'Material enviado com sucesso!', type: 'success' });
            
            // Limpa os campos após o envio
            setMp3File(null);
            setLink('');

        } catch (error) {
            console.error("Erro ao enviar material:", error);
            if(setNotification) setNotification({ message: 'Ocorreu um erro ao enviar o material.', type: 'error' });
        } finally {
            setIsUploading(false); // Finaliza o loading, mesmo se der erro
        }
    };

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' },
        title: { fontSize: '1.8rem', fontWeight: '700', color: '#1F2937', margin: 0 },
        closeButton: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' },
        content: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        infoBlock: {},
        label: { display: 'block', marginBottom: '8px', color: '#6B7280', fontSize: '14px', fontWeight: '600' },
        value: { fontSize: '16px', color: '#1F2937', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' },
        goalsValue: { fontSize: '16px', color: '#1F2937', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.6' },
        footer: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' },
        button: { padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#8B5CF6', color: 'white' },
        materialSection: { marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E5E7EB' },
        materialTitle: { fontSize: '1.2rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' },
        inputField: { width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: '#F9FAFB' },
        // ATUALIZADO: Estilo do botão agora muda se estiver carregando
        submitButton: { padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#10B981', color: 'white', marginTop: '1rem', opacity: isUploading ? 0.6 : 1 },
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>{patient.name}</h2>
                    <button style={styles.closeButton} onClick={onClose}>×</button>
                </div>
                <div style={styles.content}>
                    <div style={styles.infoBlock}>
                        <label style={styles.label}>Idade</label>
                        <div style={styles.value}>{patient.age}</div>
                    </div>
                    <div style={styles.infoBlock}>
                        <label style={styles.label}>Objetivos Terapêuticos</label>
                        <div style={styles.goalsValue}>{patient.therapeuticGoals}</div>
                    </div>
                    <div style={styles.materialSection}>
                        <h3 style={styles.materialTitle}>Enviar Materiais para Paciente</h3>
                        <form onSubmit={handleMaterialSubmit}>
                            <div style={styles.infoBlock}>
                                <label style={styles.label} htmlFor="mp3-upload">Carregar áudio (MP3)</label>
                                <input style={styles.inputField} type="file" id="mp3-upload" accept=".mp3" key={mp3File ? 'file-selected' : 'no-file'} onChange={(e) => setMp3File(e.target.files[0])} />
                            </div>
                            <div style={styles.infoBlock}>
                                <label style={styles.label} htmlFor="link-input">Inserir um link (Ex: YouTube)</label>
                                <input style={styles.inputField} type="text" id="link-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                            </div>
                            {/* ATUALIZADO: O botão agora é desabilitado e muda de texto durante o upload */}
                            <button type="submit" style={styles.submitButton} disabled={isUploading}>
                                {isUploading ? 'Enviando...' : 'Enviar Material'}
                            </button>
                        </form>
                    </div>
                </div>
                <div style={styles.footer}>
                    <button style={styles.button} onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailModal;