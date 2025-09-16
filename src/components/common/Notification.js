import React, { useState, useEffect } from 'react';

const Notification = ({ message, type, onDone }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onDone, 500); 
            }, 3000); 

            return () => clearTimeout(timer);
        }
    }, [message]); // A animação depende apenas da mensagem

    const styles = {
        container: {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999, // AUMENTAMOS MUITO O Z-INDEX PARA GARANTIR
            backgroundColor: type === 'success' ? '#4CAF50' : '#f44336',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '16px',
            transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
            transform: visible ? 'translateX(0)' : 'translateX(120%)',
            opacity: visible ? 1 : 0,
        }
    };

    if (!message) {
        return null;
    }

    return (
        <div style={styles.container}>
            {message}
        </div>
    );
};

export default Notification;