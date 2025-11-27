// src/components/therapist/PatientDetailModal.js
import React from 'react';

const PatientDetailModal = ({ patient, onClose, setNotification }) => {

    if (!patient) {
        return null;
    }

    // Função auxiliar para calcular idade
    const calculateAge = (birthDateString) => {
        if (!birthDateString) return null;
        const today = new Date();
        const birthDate = new Date(birthDateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Determina a idade: Calculada > Campo 'age' > 'Não informada'
    const displayAge = calculateAge(patient.birthDate) !== null 
        ? `${calculateAge(patient.birthDate)} anos` 
        : (patient.age || 'Não informada');

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' },
        title: { fontSize: '1.8rem', fontWeight: '700', color: '#1F2937', margin: 0 },
        closeButton: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' },
        content: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
        fullWidth: { gridColumn: '1 / -1' },
        infoBlock: { display: 'flex', flexDirection: 'column' },
        label: { display: 'block', marginBottom: '8px', color: '#6B7280', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
        value: { fontSize: '16px', color: '#1F2937', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6' },
        goalsValue: { fontSize: '16px', color: '#1F2937', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.6', border: '1px solid #F3F4F6' },
        footer: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' },
        button: { padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#8B5CF6', color: 'white' },
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>{patient.displayName || patient.name || 'Paciente'}</h2>
                    <button style={styles.closeButton} onClick={onClose}>×</button>
                </div>
                
                <div style={styles.content}>
                    <div style={styles.infoBlock}>
                        <label style={styles.label}>Idade</label>
                        <div style={styles.value}>{displayAge}</div>
                    </div>
                    <div style={styles.infoBlock}>
                        <label style={styles.label}>Telefone</label>
                        <div style={styles.value}>{patient.phone || 'Não informado'}</div>
                    </div>
                    
                    <div style={{...styles.infoBlock, ...styles.fullWidth}}>
                        <label style={styles.label}>E-mail</label>
                        <div style={styles.value}>{patient.email || 'Não informado'}</div>
                    </div>

                    <div style={{...styles.infoBlock, ...styles.fullWidth}}>
                        <label style={styles.label}>Objetivos Terapêuticos</label>
                        <div style={styles.goalsValue}>{patient.therapeuticGoals || 'Nenhum objetivo registrado.'}</div>
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