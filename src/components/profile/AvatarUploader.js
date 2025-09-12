// src/components/profile/AvatarUploader.js
import React, { useRef } from 'react';

/**
 * AvatarUploader
 * - Mostra a foto se houver `src`
 * - Senão, mostra um círculo com iniciais (fallback)
 *
 * Props:
 * - src?: string (URL do avatar)
 * - uploading: boolean
 * - onFileSelected: (file: File) => void
 * - size?: number (px) -> padrão 120
 * - disabled?: boolean
 * - initials?: string  (ex: "GM")
 */
const AvatarUploader = ({
  src,
  uploading,
  onFileSelected,
  size = 120,
  disabled = false,
  initials = '',
}) => {
  const inputRef = useRef(null);

  const styles = {
    container: {
      position: 'relative',
      width: size,
      height: size,
      margin: '0 auto',
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
    img: {
      width: size,
      height: size,
      borderRadius: '50%',
      objectFit: 'cover',
      border: '4px solid #fff',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      backgroundColor: '#F3F4F6',
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      backgroundColor: 'rgba(0,0,0,0.4)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity .2s',
      pointerEvents: 'none',
      fontWeight: 600,
    },
    placeholder: {
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: '#E5E7EB', // cinza claro
      border: '4px solid #fff',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      color: '#6B7280',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.max(18, Math.floor(size * 0.32)),
      fontWeight: 700,
      userSelect: 'none',
    },
  };

  const openPicker = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const onChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelected) onFileSelected(file);
    e.target.value = ''; // permite re-selecionar o mesmo arquivo
  };

  const showOverlay = (el, visible) => {
    if (!el) return;
    const overlay = el.querySelector('[data-overlay="true"]');
    if (overlay) overlay.style.opacity = visible ? 1 : 0;
  };

  return (
    <div
      style={styles.container}
      onClick={openPicker}
      onMouseEnter={(e) => { if (!disabled && !uploading) showOverlay(e.currentTarget, true); }}
      onMouseLeave={(e) => showOverlay(e.currentTarget, false)}
      aria-label="Alterar foto de perfil"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPicker(); }}
    >
      {src ? (
        <>
          <img src={src} alt="Avatar do usuário" style={styles.img} />
          <div data-overlay="true" style={styles.overlay}>
            {uploading ? 'Enviando…' : 'Alterar'}
          </div>
        </>
      ) : (
        <>
          <div style={styles.placeholder} aria-hidden="true">
            {initials || '—'}
          </div>
          <div data-overlay="true" style={styles.overlay}>
            {uploading ? 'Enviando…' : 'Adicionar foto'}
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg"
        style={{ display: 'none' }}
        onChange={onChange}
        disabled={disabled || uploading}
      />
    </div>
  );
};

export default AvatarUploader;
