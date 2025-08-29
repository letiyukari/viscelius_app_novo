import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Ferramentas do nosso novo GPS
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SessionPage = () => {
    // O useParams é uma ferramenta que pega informações da URL (o endereço do site)
    // No futuro, nossa URL será algo como /sessao/ID_DO_PACIENTE
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    // Este efeito roda uma vez para buscar os dados do paciente específico
    useEffect(() => {
        const fetchPatient = async () => {
            const docRef = doc(db, 'users', patientId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setPatient({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.error("Nenhum paciente encontrado com este ID!");
            }
            setLoading(false);
        };

        if (patientId) {
            fetchPatient();
        }
    }, [patientId]);

    const styles = {
        pageContainer: { padding: '2rem 3.5rem', fontFamily: '"Inter", sans-serif' },
        header: { marginBottom: '2rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' },
        title: { fontSize: '2.2rem', fontWeight: '700', color: '#1F2937', margin: 0 },
        patientName: { fontSize: '1.5rem', fontWeight: '500', color: '#6B7280', marginTop: '0.5rem' },
        backLink: { textDecoration: 'none', color: '#8B5CF6', fontWeight: '600', marginBottom: '1rem', display: 'inline-block' },
        formContainer: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        label: { display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' },
        textArea: { width: '100%', padding: '12px 14px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box', minHeight: '250px', fontFamily: 'inherit' },
        button: { alignSelf: 'flex-start', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#8B5CF6', color: 'white' },
    };

    if (loading) {
        return <div style={styles.pageContainer}>Carregando dados do paciente...</div>;
    }

    return (
        <div style={styles.pageContainer}>
            {/* No futuro, este Link nos levará de volta ao painel */}
            <Link to="/dashboard" style={styles.backLink}>&larr; Voltar para o Painel</Link>
            <header style={styles.header}>
                <h1 style={styles.title}>Registro de Sessão</h1>
                {patient && <p style={styles.patientName}>com {patient.name}</p>}
            </header>
            
            <div style={styles.formContainer}>
                <div>
                    <label style={styles.label}>Anotações da Sessão</label>
                    <textarea style={styles.textArea} placeholder="Descreva as atividades, reações e progresso do paciente durante a sessão..."></textarea>
                </div>
                <button style={styles.button}>Salvar Sessão</button>
            </div>
        </div>
    );
};

export default SessionPage;