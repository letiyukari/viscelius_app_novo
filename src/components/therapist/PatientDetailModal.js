// src/components/therapist/PatientDetailModal.js

import React from 'react';
// REMOVIDO: Ferramentas do Firebase que não são mais necessárias aqui
import { db } from '../../firebase';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// REMOVIDO: O 'Icons' não estava a ser usado 
// import Icons from '../common/Icons'; 

// REMOVIDO: Constantes do Cloudinary não são mais necessárias aqui
// const CLOUDINARY_CLOUD_NAME = "de0avsta1"; 
// const CLOUDINARY_UPLOAD_PRESET = "viscelius_app_uploads";

const PatientDetailModal = ({ patient, onClose, setNotification }) => {
    // REMOVIDO: Estados de upload de material
    // const [mp3File, setMp3File] = useState(null);
    // const [link, setLink] = useState('');
    // const [isUploading, setIsUploading] = useState(false);

    if (!patient) {
        return null;
    }
    
    // REMOVIDO: Função handleMaterialSubmit
    // const handleMaterialSubmit = async (event) => { ... };

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
        // REVERTIDO: Estilo do botão
        button: { padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#8B5CF6', color: 'white' },
        
        // REMOVIDO: Estilos da secção de material
        // materialSection: { ... },
        // materialTitle: { ... },
        // inputField: { ... },
        // submitButton: { ... },
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

                    {/* REMOVIDO: A secção inteira de "Enviar Materiais" foi retirada daqui */}
                    
                </div>
                {/* REVERTIDO: Rodapé original com um botão */}
                <div style={styles.footer}>
                    <button style={styles.button} onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailModal;