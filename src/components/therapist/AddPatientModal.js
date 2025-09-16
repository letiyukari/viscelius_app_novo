import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddPatientModal = ({ isOpen, onClose, therapistId, setNotification }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [goals, setGoals] = useState('');

    const handleSave = async () => {
        if (!name || !age || !goals) {
            setNotification({ message: 'Por favor, preencha todos os campos.', type: 'error' });
            return;
        }
        try {
            await addDoc(collection(db, "users"), {
                name: name,
                age: parseInt(age),
                therapeuticGoals: goals,
                role: 'patient',
                therapistUid: therapistId,
                createdAt: serverTimestamp()
            });
            
            setNotification({ message: 'Paciente criado com sucesso!', type: 'success' });
            
            // NOVO: Limpa os campos do formulário após o sucesso
            setName('');
            setAge('');
            setGoals('');

            onClose(); // Fecha o modal
            
        } catch (error) {
            console.error("Erro ao criar perfil do paciente:", error);
            setNotification({ message: 'Ocorreu um erro ao criar o perfil.', type: 'error' });
        }
    };

    if (!isOpen) { return null; }
    
    // ... (o restante do seu código de styles continua exatamente igual) ...
    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' },
        title: { fontSize: '1.5rem', fontWeight: '600', color: '#1F2937', margin: 0 },
        closeButton: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' },
        form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
        inputGroup: { display: 'flex', flexDirection: 'column' },
        label: { marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' },
        input: { width: '100%', padding: '12px 14px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box' },
        textArea: { width: '100%', padding: '12px 14px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'inherit' },
        footer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' },
        button: { padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
        cancelButton: { backgroundColor: '#F3F4F6', color: '#374151' },
        saveButton: { backgroundColor: '#8B5CF6', color: 'white' }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Criar Prontuário do Paciente</h2>
                    <button style={styles.closeButton} onClick={onClose}>&times;</button>
                </div>
                <div style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="name" style={styles.label}>Nome Completo</label>
                        <input type="text" id="name" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="age" style={styles.label}>Idade</label>
                        <input type="number" id="age" style={styles.input} value={age} onChange={(e) => setAge(e.target.value)} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="goals" style={styles.label}>Objetivos Terapêuticos</label>
                        <textarea id="goals" style={styles.textArea} value={goals} onChange={(e) => setGoals(e.target.value)} />
                    </div>
                </div>
                <div style={styles.footer}>
                    <button style={{ ...styles.button, ...styles.cancelButton }} onClick={onClose}>Cancelar</button>
                    <button style={{ ...styles.button, ...styles.saveButton }} onClick={handleSave}>Salvar Prontuário</button>
                </div>
            </div>
        </div>
    );
};

export default AddPatientModal;