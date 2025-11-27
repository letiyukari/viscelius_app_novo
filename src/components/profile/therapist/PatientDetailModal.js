// src/components/therapist/PatientDetailModal.js
import React from 'react';
import { UserIcon } from '../common/Icons'; // Importe o ícone padrão caso não tenha foto

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

    const displayAge = calculateAge(patient.birthDate) !== null 
        ? `${calculateAge(patient.birthDate)} anos` 
        : (patient.age || 'Não informada');

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', maxHeight: '90vh', overflowY: 'auto' },
        
        header: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '1.5rem', position: 'relative' },
        
        avatarContainer: { width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', backgroundColor: '#F3F4F6', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '4px solid white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
        avatarImage: { width: '100%', height: '100%', objectFit: 'cover' },
        
        title: { fontSize: '1.5rem', fontWeight: '800', color: '#1F2937', margin: 0, textAlign: 'center' },
        subtitle: { fontSize: '0.95rem', color: '#6B7280', margin: '0.25rem 0 0 0' },
        
        closeButton: { position: 'absolute', top: '-10px', right: '-10px', background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', color: '#4B5563', transition: 'background 0.2s' },
        
        content: { display: 'flex', flexDirection: 'column', gap: '1rem' },
        infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #F9FAFB' },
        label: { color: '#6B7280', fontSize: '0.9rem', fontWeight: '500' },
        value: { color: '#1F2937', fontSize: '1rem', fontWeight: '600' },
        
        footer: { display: 'flex', justifyContent: 'center', marginTop: '2rem' },
        button: { padding: '12px 32px', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', backgroundColor: '#8B5CF6', color: 'white', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)', transition: 'transform 0.1s' },
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <button style={styles.closeButton} onClick={onClose}>×</button>
                    
                    {/* FOTO DO PACIENTE */}
                    <div style={styles.avatarContainer}>
                        {patient.photoURL ? (
                            <img src={patient.photoURL} alt={patient.displayName} style={styles.avatarImage} />
                        ) : (
                            <UserIcon style={{ width: 48, height: 48, color: '#9CA3AF' }} />
                        )}
                    </div>

                    <h2 style={styles.title}>{patient.displayName || patient.name || 'Paciente'}</h2>
                    <p style={styles.subtitle}>{patient.email}</p>
                </div>
                
                <div style={styles.content}>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Idade</span>
                        <span style={styles.value}>{displayAge}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Telefone</span>
                        <span style={styles.value}>{patient.phone || '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>Data de Nascimento</span>
                        <span style={styles.value}>
                            {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : '—'}
                        </span>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button style={styles.button} onClick={onClose}>Fechar Perfil</button>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailModal;