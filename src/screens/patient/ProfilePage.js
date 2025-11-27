// src/screens/patient/ProfilePage.js
import React, { useEffect, useMemo, useState } from 'react';
import { auth, db } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import Notification from '../../components/common/Notification';
import AvatarUploader from '../../components/profile/AvatarUploader';
import EditProfileForm from '../../components/profile/EditProfileForm';
import AccountActions from '../../components/profile/AccountActions';

import {
  ensureUserDocAndRole,
  updateProfileByRole,
  normalizeRole,
} from '../../services/userService';

// Configuração do Cloudinary (Mantenha suas chaves ou use variáveis de ambiente)
const CLOUDINARY_CLOUD_NAME = 'dpncctfyy';
const CLOUDINARY_UPLOAD_PRESET = 'viscelius_profiles';

// Helper para iniciais
function getInitials(nameOrEmail) {
  const source = (nameOrEmail || '').trim();
  if (!source) return '';
  const name = source.includes('@') ? source.split('@')[0] : source;
  const parts = name.replace(/[-_.]+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helpers para tratamento de Arrays de especialidades
function parseSpecialtiesInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => (item == null ? '' : String(item).trim())).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function stringifySpecialties(value) {
  return parseSpecialtiesInput(value).join(', ');
}

const ProfilePage = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notif, setNotif] = useState({ message: '', type: '' });

  const [userDoc, setUserDoc] = useState(null);
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    birthDate: '',
    professionalId: '',
    specialties: '',
  });
  const [view, setView] = useState('main'); // 'main' | 'edit' | 'password'

  const role = useMemo(() => normalizeRole(userDoc?.role), [userDoc?.role]);

  // 1. Carregar dados do perfil
  useEffect(() => {
    let live = true;
    async function load() {
      if (!user) { setLoading(false); return; }
      try {
        const ensured = await ensureUserDocAndRole({
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          desiredRole: null, // role já deve existir
        });

        if (!live) return;
        
        const specialtyList = parseSpecialtiesInput(ensured.specialties);
        const specialtyText = specialtyList.join(', ');
        
        const normalizedDoc = {
          ...ensured,
          specialties: specialtyList.length ? specialtyList : null,
          specialtyText,
        };

        setUserDoc(normalizedDoc);
        setForm({
          displayName: user.displayName ?? normalizedDoc.displayName ?? '',
          phone: normalizedDoc.phone ?? '',
          birthDate: normalizedDoc.birthDate ?? '',
          professionalId: normalizedDoc.professionalId ?? '',
          specialties: specialtyText,
        });
      } catch (e) {
        console.error('Erro ao carregar perfil:', e);
        if (live) setNotif({ message: 'Falha ao carregar perfil.', type: 'error' });
      } finally {
        if (live) setLoading(false);
      }
    }
    load();
    return () => { live = false; };
  }, [user]);

  // 2. Upload de Avatar
  const handleAvatarSelected = async (file) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      if (!resp.ok) throw new Error('Falha no upload da imagem.');
      const data = await resp.json();
      const photoURL = data.secure_url;

      // Atualiza Auth e Firestore
      await updateProfile(auth.currentUser, { photoURL });
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: serverTimestamp(),
      });

      setUserDoc((prev) => ({ ...prev, photoURL }));
      setNotif({ message: 'Foto atualizada com sucesso!', type: 'success' });
    } catch (e) {
      console.error(e);
      setNotif({ message: 'Não foi possível atualizar a foto.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // 3. Salvar Edição do Perfil
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Atualiza DisplayName no Auth (se mudou)
      if (form.displayName && form.displayName !== (auth.currentUser?.displayName || '')) {
        await updateProfile(auth.currentUser, { displayName: form.displayName });
      }

      // Prepara dados específicos por Role
      const specialtiesList = role === 'therapist' ? parseSpecialtiesInput(form.specialties) : [];
      const specialtiesPayload = role === 'therapist' ? (specialtiesList.length ? specialtiesList : null) : undefined;
      const specialtiesText = specialtiesList.join(', ');

      const updatePayload = {
        displayName: form.displayName || null,
        phone: form.phone || null,
        birthDate: role === 'patient' ? (form.birthDate || null) : undefined,
        professionalId: role === 'therapist' ? (form.professionalId || null) : undefined,
        specialties: specialtiesPayload,
      };

      await updateProfileByRole(user.uid, role, updatePayload);

      // Atualiza estado local
      setUserDoc((prev) => ({
        ...prev,
        displayName: form.displayName || prev.displayName || '',
        phone: form.phone || '',
        birthDate: role === 'patient' ? (form.birthDate || '') : prev.birthDate,
        professionalId: role === 'therapist' ? (form.professionalId || '') : prev.professionalId,
        specialties: role === 'therapist' ? specialtiesPayload : prev.specialties,
        specialtyText: role === 'therapist' ? specialtiesText : prev.specialtyText,
      }));

      // Atualiza form
      setForm((prev) => ({
        ...prev,
        specialties: role === 'therapist' ? specialtiesText : prev.specialties,
      }));

      setNotif({ message: 'Perfil atualizado com sucesso!', type: 'success' });
      setView('main');
    } catch (e) {
      console.error(e);
      setNotif({ message: 'Erro ao salvar alterações.', type: 'error' });
    }
  };

  // Dados para exibição
  const display = useMemo(() => {
    const photo = userDoc?.photoURL || user?.photoURL || null;
    const name = (user?.displayName ?? userDoc?.displayName) || 'Usuário';
    const email = user?.email ?? userDoc?.email ?? '';
    const initials = getInitials(name || email);
    
    return {
      name,
      email,
      photo,
      initials,
      phone: userDoc?.phone || 'Não informado',
      birthDate: userDoc?.birthDate || 'Não informada',
      professionalId: userDoc?.professionalId || 'Não informado',
      specialties: stringifySpecialties(userDoc?.specialties ?? userDoc?.specialtyText ?? ''),
    };
  }, [user, userDoc]);

  // Estilos inline simples para manter consistência
  const styles = {
    page: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', minHeight: '100vh' },
    header: { marginBottom: '2rem' },
    title: { color: '#1F2937', fontSize: '2rem', fontWeight: 700, margin: 0 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' },
    card: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '1.5rem' },
    cardTitle: { margin: 0, fontWeight: 600, color: '#1F2937', fontSize: '1.1rem' },
    infoRow: { display: 'flex', justifyContent: 'space-between', padding: '.75rem 0', borderBottom: '1px solid #F3F4F6' },
    infoKey: { color: '#6B7280', fontSize: '0.95rem' },
    infoVal: { color: '#1F2937', fontWeight: 500 },
    badge: { background: '#EDE9FE', color: '#6D28D9', padding: '4px 12px', borderRadius: 99, fontWeight: 600, fontSize: '0.8rem', marginTop: 10, display: 'inline-block' },
    editBtn: { background: 'white', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' },
  };

  if (loading) return <div style={{...styles.page, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Carregando perfil...</div>;

  return (
    <div style={styles.page}>
      <Notification
        message={notif.message}
        type={notif.type}
        onDone={() => setNotif({ message: '', type: '' })}
      />

      <header style={styles.header}>
        <h1 style={styles.title}>Meu Perfil</h1>
      </header>

      <div style={styles.grid}>
        {/* Cartão da Esquerda: Avatar e Info Básica */}
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <AvatarUploader
            src={display.photo}
            initials={display.initials}
            uploading={uploading}
            onFileSelected={handleAvatarSelected}
            size={120}
          />
          <h2 style={{ marginTop: 16, marginBottom: 4, color: '#1F2937', fontSize: '1.25rem' }}>{display.name}</h2>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>{display.email}</p>
          <span style={styles.badge}>
            {role === 'therapist' ? 'Musicoterapeuta' : 'Paciente'}
          </span>
        </div>

        {/* Cartão da Direita: Detalhes e Edição */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {view === 'main' && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Dados Pessoais</h3>
                <button 
                  style={styles.editBtn} 
                  onClick={() => setView('edit')}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                >
                  Editar Dados
                </button>
              </div>

              <div>
                <div style={styles.infoRow}>
                  <span style={styles.infoKey}>Nome Completo</span>
                  <span style={styles.infoVal}>{display.name}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoKey}>Email</span>
                  <span style={styles.infoVal}>{display.email}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoKey}>Telefone</span>
                  <span style={styles.infoVal}>{display.phone}</span>
                </div>

                {role === 'patient' ? (
                  <div style={styles.infoRow}>
                    <span style={styles.infoKey}>Data de Nascimento</span>
                    <span style={styles.infoVal}>{display.birthDate}</span>
                  </div>
                ) : (
                  <>
                    <div style={styles.infoRow}>
                      <span style={styles.infoKey}>Registro Profissional</span>
                      <span style={styles.infoVal}>{display.professionalId}</span>
                    </div>
                    <div style={{...styles.infoRow, borderBottom: 'none'}}>
                      <span style={styles.infoKey}>Especialidades</span>
                      <span style={{...styles.infoVal, textAlign: 'right', maxWidth: '60%'}}>{display.specialties || '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {view === 'edit' && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Editar Informações</h3>
              </div>
              <EditProfileForm
                role={role}
                form={form}
                onChange={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
                onCancel={() => setView('main')}
                onSubmit={handleEditSubmit}
              />
            </div>
          )}

          {/* Botões de Ação da Conta (Logout) */}
          <AccountActions onLogout={onLogout || (() => auth.signOut())} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;