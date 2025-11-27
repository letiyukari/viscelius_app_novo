// src/components/profile/AccountActions.js
import React from 'react';

const AccountActions = ({ onLogout }) => {
  const styles = {
    card: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '2rem' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '1.5rem' },
    cardTitle: { color: '#1F2937', fontSize: '1.2rem', fontWeight: 600, margin: 0 },
    actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid #F3F4F6' },
    actionButton: { background: 'none', border: 'none', color: '#4F46E5', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' },
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Ações da Conta</h3></div>
      <div style={styles.actionRow}>
        <p style={{ margin: 0, color: '#374151' }}>Sair de todos os dispositivos</p>
        <button style={styles.actionButton} onClick={onLogout}>Sair</button>
      </div>
    </div>
  );
};

export default AccountActions;