import React, { useState } from 'react';

// Importa os ícones que esta página precisa
import { AwardIcon, CheckCircleIcon, UserCheckIcon } from '../../common/Icons';

// --- PÁGINA DE HISTÓRICO ---
const HistoricoPage = () => {
    const summaryData = {
        totalSessions: 12,
        timeInApp: "3 meses",
        mainTherapist: "Dr. Carlos Mendes",
    };

    const pastSessions = [
        { id: 1, date: "18 de Julho, 2025", therapistName: "Dr. Carlos Mendes", therapistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop", status: "Realizada", notes: "Paciente demonstrou grande avanço na expressão emocional. A playlist 'Calma Interior' foi particularmente eficaz. Recomenda-se focar em exercícios de ritmo na próxima sessão." },
        { id: 2, date: "11 de Julho, 2025", therapistName: "Dr. Carlos Mendes", therapistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop", status: "Realizada", notes: "Sessão focada em técnicas de respiração sincronizada com sons de baixa frequência. Paciente reportou uma diminuição significativa nos níveis de ansiedade após a sessão." },
        { id: 3, date: "02 de Julho, 2025", therapistName: "Dra. Sofia Ribeiro", therapistAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop", status: "Realizada", notes: "Introdução a instrumentos de percussão para canalizar energia. Paciente mostrou-se receptivo e engajado. Próximo passo é a composição de pequenas melodias." },
        { id: 4, date: "25 de Junho, 2025", therapistName: "Dr. Carlos Mendes", therapistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop", status: "Realizada", notes: "Primeira sessão de avaliação. Histórico e objetivos foram discutidos. Paciente busca gerenciar o estresse do dia-a-dia." },
    ];

    const [expandedSessionId, setExpandedSessionId] = useState(null);

    const toggleNotes = (sessionId) => {
        setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
    };

    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', overflowY: 'auto', height: '100vh' },
        header: { marginBottom: '2.5rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: '0' },
        subtitle: { color: '#6B7280', fontSize: '1.1rem', fontWeight: '500', marginTop: '0.5rem' },
        summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' },
        summaryCard: { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB' },
        summaryIcon: { color: '#8B5CF6' },
        summaryText: {},
        summaryLabel: { color: '#6B7280', fontSize: '0.9rem', margin: 0 },
        summaryValue: { color: '#1F2937', fontSize: '1.5rem', fontWeight: '600', margin: '4px 0 0 0' },
        historyList: {},
        historyTitle: { fontSize: '1.5rem', color: '#1F2937', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' },
        sessionItem: { marginBottom: '1rem' },
        sessionCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' },
        sessionTherapistInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
        therapistAvatar: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' },
        sessionDetails: {},
        sessionDate: { color: '#1F2937', fontWeight: 600, margin: 0 },
        sessionTherapistName: { color: '#6B7280', margin: '4px 0 0 0' },
        sessionStatus: { backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' },
        detailsButton: { background: 'none', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'background-color 0.2s, color 0.2s' },
        notesSection: { backgroundColor: '#F9FAFB', padding: '1.5rem', border: '1px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 12px 12px', marginTop: '-1px' },
        notesTitle: { margin: '0 0 1rem 0', color: '#374151', fontWeight: 600 },
        notesText: { margin: 0, color: '#4B5563', lineHeight: 1.6 }
    };

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <h1 style={styles.title}>Seu Histórico</h1>
                <p style={styles.subtitle}>Acompanhe sua jornada e progresso na plataforma.</p>
            </header>

            <div style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                    <div style={styles.summaryIcon}><CheckCircleIcon /></div>
                    <div style={styles.summaryText}>
                        <p style={styles.summaryLabel}>Total de Consultas</p>
                        <p style={styles.summaryValue}>{summaryData.totalSessions}</p>
                    </div>
                </div>
                <div style={styles.summaryCard}>
                      <div style={styles.summaryIcon}><AwardIcon /></div>
                    <div style={styles.summaryText}>
                        <p style={styles.summaryLabel}>Tempo no App</p>
                        <p style={styles.summaryValue}>{summaryData.timeInApp}</p>
                    </div>
                </div>
                <div style={styles.summaryCard}>
                    <div style={styles.summaryIcon}><UserCheckIcon /></div>
                    <div style={styles.summaryText}>
                        <p style={styles.summaryLabel}>Terapeuta Principal</p>
                        <p style={styles.summaryValue}>{summaryData.mainTherapist}</p>
                    </div>
                </div>
            </div>

            <div style={styles.historyList}>
                <h2 style={styles.historyTitle}>Consultas Realizadas</h2>
                {pastSessions.map(session => (
                    <div key={session.id} style={styles.sessionItem}>
                        <div style={{...styles.sessionCard, borderRadius: expandedSessionId === session.id ? '12px 12px 0 0' : '12px'}}>
                            <div style={styles.sessionTherapistInfo}>
                                <img src={session.therapistAvatar} alt={session.therapistName} style={styles.therapistAvatar}/>
                                <div style={styles.sessionDetails}>
                                    <p style={styles.sessionDate}>{session.date}</p>
                                    <p style={styles.sessionTherapistName}>com {session.therapistName}</p>
                                </div>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                                <span style={styles.sessionStatus}>{session.status}</span>
                                <button style={styles.detailsButton} onClick={() => toggleNotes(session.id)}>
                                    {expandedSessionId === session.id ? 'Ocultar Anotações' : 'Ver Anotações'}
                                </button>
                            </div>
                        </div>
                        {expandedSessionId === session.id && (
                             <div style={styles.notesSection}>
                                <h3 style={styles.notesTitle}>Anotações da Sessão</h3>
                                <p style={styles.notesText}>{session.notes}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoricoPage;