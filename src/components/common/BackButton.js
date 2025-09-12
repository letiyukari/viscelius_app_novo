// src/components/common/BackButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = "Voltar" }) => {
  const navigate = useNavigate();

  const styles = {
    btn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#F3F4F6',
      color: '#374151',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '8px 14px',
      fontSize: '0.95rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
  };

  return (
    <button style={styles.btn} onClick={() => navigate(-1)}>
      ← {label}
    </button>
  );
};

export default BackButton;
