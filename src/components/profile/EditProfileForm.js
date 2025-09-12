// src/components/profile/EditProfileForm.js
import React from 'react';

/**
 * EditProfileForm
 * Formulário controlado para editar dados do perfil, sensível à role.
 *
 * Props:
 * - role: 'patient' | 'therapist'
 * - form: { displayName, phone, birthDate?, professionalId?, specialties? }
 * - onChange: (field: string, value: string) => void
 * - onCancel: () => void
 * - onSubmit: (e) => void  (use prevenir default no pai)
 */
const EditProfileForm = ({ role, form, onChange, onCancel, onSubmit }) => {
  const styles = {
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    group: { display: 'flex', flexDirection: 'column' },
    label: { color: '#374151', fontWeight: 500, marginBottom: '0.5rem' },
    input: { width: '100%', padding: '12px', fontSize: '1rem', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box' },
    hint: { color: '#6B7280', fontSize: 12, marginTop: 6 },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },
    cancel: { backgroundColor: '#fff', border: '1px solid #D1D5DB', color: '#374151', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    save: { backgroundColor: '#8B5CF6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
  };

  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <div style={styles.group}>
        <label style={styles.label}>Nome Completo</label>
        <input
          type="text"
          style={styles.input}
          value={form.displayName || ''}
          onChange={(e) => onChange('displayName', e.target.value)}
          placeholder="Seu nome completo"
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Telefone</label>
        <input
          type="tel"
          style={styles.input}
          value={form.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="(11) 98765-4321"
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
            <label style={styles.label}>Registro Profissional (CRP/CRFA/etc.)</label>
            <input
              type="text"
              style={styles.input}
              value={form.professionalId || ''}
              onChange={(e) => onChange('professionalId', e.target.value)}
              placeholder="Ex: 06/00000"
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Especialidades</label>
            <input
              type="text"
              style={styles.input}
              value={form.specialties || ''}
              onChange={(e) => onChange('specialties', e.target.value)}
              placeholder="Musicoterapia, Ansiedade"
            />
          </div>
        </>
      )}

      <div style={styles.actions}>
        <button type="button" style={styles.cancel} onClick={onCancel}>Cancelar</button>
        <button type="submit" style={styles.save}>Salvar Alterações</button>
      </div>
    </form>
  );
};

export default EditProfileForm;
