// src/components/patient/AppointmentDetailModal.js
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUserProfile } from '../../services/usersService';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const overlayStyles = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(17, 24, 39, 0.55)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '1.5rem',
  zIndex: 1300,
};

const modalStyles = {
  background: '#FFFFFF',
  color: '#111827',
  borderRadius: 20,
  width: '100%',
  maxWidth: '540px',
  boxShadow: '0 24px 60px rgba(79, 70, 229, 0.2)',
  overflow: 'hidden',
};

const headerStyles = {
  padding: '1.5rem 1.75rem 1rem 1.75rem',
  borderBottom: '1px solid #E5E7EB',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
};

const bodyStyles = {
  padding: '1.75rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  lineHeight: 1.5,
};

const footerStyles = {
  padding: '1.5rem 1.75rem 1.75rem 1.75rem',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  borderTop: '1px solid #E5E7EB',
  flexWrap: 'wrap',
};

const labelStyles = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: '#6B7280',
  marginBottom: '0.25rem',
};

const valueStyles = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#1F2937',
};

const primaryButtonStyles = {
  background: '#7C3AED',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 12,
  padding: '0.75rem 1.5rem',
  fontWeight: 700,
  cursor: 'pointer',
  minWidth: '120px',
};

const secondaryButtonStyles = {
  background: '#E5E7EB',
  color: '#374151',
  border: 'none',
  borderRadius: 12,
  padding: '0.75rem 1.5rem',
  fontWeight: 600,
  cursor: 'pointer',
  minWidth: '120px',
};

const toTrimmedString = (value) =>
  typeof value === 'string' ? value.trim() : '';

const joinSpecialtyArray = (items) => {
  if (!Array.isArray(items)) return '';
  return items
    .map((item) => toTrimmedString(item))
    .filter(Boolean)
    .join(', ');
};

const extractSpecialtyText = (source = {}) => {
  if (!source) return '';
  const candidates = [
    toTrimmedString(source.specialtyText),
    toTrimmedString(source.specialty),
    joinSpecialtyArray(source.specialties),
  ];
  return candidates.find(Boolean) || '';
};

const extractAppointmentSpecialty = (appointment = {}) => {
  if (!appointment) return '';
  const candidates = [
    toTrimmedString(appointment.therapistSpecialty),
    toTrimmedString(appointment.therapistSpecialtyText),
    extractSpecialtyText(appointment.therapist),
    extractSpecialtyText(appointment.therapistProfile),
  ];
  return candidates.find(Boolean) || '';
};

const AppointmentDetailModal = ({ open, appointment, onClose }) => {
  const [therapistName, setTherapistName] = useState('');
  const [therapistSpecialty, setTherapistSpecialty] = useState('');

  useEffect(() => {
    if (!open) {
      setTherapistName('');
      setTherapistSpecialty('');
      return;
    }

    const fallbackName = (appointment?.therapistName || '').trim();
    const fallbackSpecialty = extractAppointmentSpecialty(appointment);
    const therapistId = (appointment?.therapistId || '').trim();

    setTherapistName(fallbackName || therapistId || 'Profissional');
    setTherapistSpecialty(fallbackSpecialty);

    if (!therapistId) {
      return;
    }

    let active = true;
    async function fetchTherapistName() {
      try {
        const profile = await getUserProfile(therapistId);
        if (!active) {
          return;
        }
        if (!profile) {
          return;
        }

        const profileName =
          (profile.displayName || profile.name || '').trim();
        if (!fallbackName && profileName) {
          setTherapistName(profileName);
        }

        const profileSpecialty = extractSpecialtyText(profile);
        if (profileSpecialty) {
          setTherapistSpecialty(profileSpecialty);
        }
      } catch (error) {
        console.error('[AppointmentDetailModal] Falha ao carregar terapeuta', error);
        if (active && !fallbackName) {
          setTherapistName(therapistId || 'Profissional');
        }
      }
    }
    fetchTherapistName();

    return () => {
      active = false;
    };
  }, [
    open,
    appointment?.therapistId,
    appointment?.therapistName,
    appointment?.therapistSpecialty,
    appointment?.therapistSpecialtyText,
    appointment?.therapist,
    appointment?.therapistProfile,
  ]);

  const formattedDate = useMemo(() => {
    if (!appointment) return '';
    const source = appointment.startTime ?? appointment.slotStartsAt;
    if (!source) return '';
    const date =
      typeof source?.toDate === 'function' ? source.toDate() : new Date(source);
    return dateFormatter.format(date);
  }, [appointment]);

  const modality = useMemo(() => {
    const raw = String(appointment?.mode || appointment?.modality || '').toLowerCase();
    if (raw === 'online' || raw === 'presencial') return raw;
    if (appointment?.isOnline) return 'online';
    if (appointment?.address || appointment?.location) return 'presencial';
    return '';
  }, [appointment]);

  const meetingUrl =
    appointment?.meetingUrl ||
    appointment?.meeting?.joinUrl ||
    appointment?.meetUrl ||
    appointment?.videoUrl ||
    appointment?.callUrl ||
    appointment?.conferenceUrl ||
    '';

  const address = appointment?.address || appointment?.location || '';
  const notes = appointment?.notes || appointment?.observation || appointment?.observations;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && typeof onClose === 'function') {
      onClose();
    }
  };

  const handleEnterClick = () => {
    if (!meetingUrl) return;
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  };

  if (!open || !appointment) {
    return null;
  }

  const content = (
    <div style={overlayStyles} onClick={handleOverlayClick} role="presentation">
      <div
        style={modalStyles}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
      >
        <div style={headerStyles}>
          <div>
            <h2
              id="appointment-modal-title"
              style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}
            >
              Detalhes da sessão
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', color: '#6B7280' }}>
              Veja informações importantes antes de iniciar sua próxima sessão.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              fontSize: '1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Fechar detalhes da sessão"
          >
            ×
          </button>
        </div>

        <div style={bodyStyles}>
          <div>
            <p style={labelStyles}>Data e horário</p>
            <p style={valueStyles}>{formattedDate || 'A definir'}</p>
          </div>

          <div>
            <p style={labelStyles}>Profissional</p>
            <p style={valueStyles}>{therapistName || 'Profissional a definir'}</p>
          </div>

          <div>
            <p style={labelStyles}>Especialidade</p>
            <p style={valueStyles}>
              {therapistSpecialty || 'Especialidade não informada'}
            </p>
          </div>

          {meetingUrl && (
            <div>
              <p style={labelStyles}>Acessar sala Jitsi</p>
              <a
                style={{ ...valueStyles, color: '#6366F1', textDecoration: 'underline' }}
                href={meetingUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                Abrir sala
              </a>
            </div>
          )}

          {modality === 'presencial' && address && (
            <div>
              <p style={labelStyles}>Endereço</p>
              <p style={valueStyles}>{address}</p>
            </div>
          )}

          {notes && (
            <div>
              <p style={labelStyles}>Observações</p>
              <p style={{ ...valueStyles, fontWeight: 500 }}>{notes}</p>
            </div>
          )}
        </div>

        <div style={footerStyles}>
          <button
            type="button"
            style={secondaryButtonStyles}
            onClick={onClose}
          >
            Fechar
          </button>

          <button
            type="button"
            style={{
              ...primaryButtonStyles,
              opacity: meetingUrl ? 1 : 0.5,
              cursor: meetingUrl ? 'pointer' : 'not-allowed',
            }}
            onClick={handleEnterClick}
            disabled={!meetingUrl}
          >
            Entrar na sessão
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
};

export default AppointmentDetailModal;
