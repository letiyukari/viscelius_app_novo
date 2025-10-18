// src/components/player/MiniPlayer.js
import React from 'react';
import { createPortal } from 'react-dom';
import { usePlayer } from '../../context/PlayerContext';
import Icons from '../common/Icons';

const containerStyles = {
  position: 'fixed',
  bottom: 20,
  right: 20,
  left: 20,
  background: '#1F2937',
  borderRadius: 16,
  padding: '1rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 20px 40px rgba(79, 70, 229, 0.25)',
  color: '#F9FAFB',
  zIndex: 1200,
  gap: '1rem',
  pointerEvents: 'auto',
  maxWidth: 600,
  margin: '0 auto',
};

const infoStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  minWidth: 0,
};

const coverStyles = {
  width: 64,
  height: 64,
  borderRadius: 12,
  objectFit: 'cover',
  flexShrink: 0,
};

const titleStyles = {
  margin: 0,
  fontWeight: 700,
  fontSize: '1rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const subtitleStyles = {
  margin: '0.2rem 0 0 0',
  color: '#D1D5DB',
  fontSize: '0.85rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const controlsStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexShrink: 0,
};

const controlButton = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  color: '#F9FAFB',
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
};

const primaryButton = {
  ...controlButton,
  width: 56,
  height: 56,
  background: '#8B5CF6',
};

const closeButton = {
  background: 'transparent',
  border: 'none',
  color: '#9CA3AF',
  cursor: 'pointer',
  fontSize: '1.25rem',
};

const MiniPlayer = () => {
  const { currentTrack, isPlaying, togglePlayPause, playNext, playPrevious, stop } = usePlayer();

  if (!currentTrack) {
    return null;
  }

  const content = (
    <div style={containerStyles}>
      <div style={infoStyles}>
        <img
          src={currentTrack.image}
          alt={currentTrack.name}
          style={coverStyles}
        />
        <div style={{ minWidth: 0 }}>
          <h4 style={titleStyles}>{currentTrack.name}</h4>
          <p style={subtitleStyles}>{currentTrack.artist || 'Reprodução em andamento'}</p>
        </div>
      </div>

      <div style={controlsStyles}>
        <button
          type="button"
          style={controlButton}
          onClick={playPrevious}
          aria-label="Faixa anterior"
        >
          <Icons.SkipBackIcon />
        </button>
        <button
          type="button"
          style={primaryButton}
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? <Icons.PauseIcon /> : <Icons.PlayIcon />}
        </button>
        <button
          type="button"
          style={controlButton}
          onClick={playNext}
          aria-label="Próxima faixa"
        >
          <Icons.SkipForwardIcon />
        </button>
      </div>

      <button
        type="button"
        style={closeButton}
        onClick={stop}
        aria-label="Parar reprodução"
      >
        ×
      </button>
    </div>
  );

  if (typeof document === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
};

export default MiniPlayer;
