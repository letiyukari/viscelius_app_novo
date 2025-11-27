// src/components/profile/EditProfileForm.js
import React from 'react';

const EditProfileForm = ({ role, form, onChange, onCancel, onSubmit }) => {
  const styles = {
    form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    group: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { color: '#374151', fontWeight: 600, fontSize: '0.9rem' },
    input: { 
        width: '100%', 
        padding: '10px 12px', 
        fontSize: '0.95rem', 
        border: '1px solid #D1D5DB', 
        borderRadius: '8px', 
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    hint: { color: '#6B7280', fontSize: '0.8rem', marginTop: '0.2rem' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' },
    cancel: { backgroundColor: 'white', border: '1px solid #D1D5DB', color: '#374151', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    save: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
  };

  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <div style={styles.group}>
        <label style={styles.label}>Nome Completo</label>
        <input
          type="text"
          required
          style={styles.input}
          value={form.displayName || ''}
          onChange={(e) => onChange('displayName', e.target.value)}
          placeholder="Ex: Maria Silva"
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Telefone / WhatsApp</label>
        <input
          type="tel"
          style={styles.input}
          value={form.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>

      {role === 'patient' ? (
        <div style={styles.group}>
          <label style={styles.label}>Data de Nascimento</label>
          <input
            type="date"
            style={styles.input}
            value={form.birthDate || ''}
            onChange={(e) => onChange('birthDate', e.target.value)}
          />
        </div>
      ) : (
        <>
          <div style={styles.group}>
            <label style={styles.label}>Registro Profissional</label>
            <input
              type="text"
              style={styles.input}
              value={form.professionalId || ''}
              onChange={(e) => onChange('professionalId', e.target.value)}
              placeholder="Ex: CRP 06/12345"
            />
            <p style={styles.hint}>Seu número de registro no conselho de classe.</p>
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Especialidades</label>
            <input
              type="text"
              style={styles.input}
              value={form.specialties || ''}
              onChange={(e) => onChange('specialties', e.target.value)}
              placeholder="Ex: Autismo, Ansiedade, Musicoterapia Neurológica"
            />
            <p style={styles.hint}>Separe as especialidades por vírgula.</p>
          </div>
        </>
      )}

      <div style={styles.actions}>
        <button type="button" style={styles.cancel} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" style={styles.save}>
          Salvar Alterações
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;