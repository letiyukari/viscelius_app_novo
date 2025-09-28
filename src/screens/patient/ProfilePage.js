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

const CLOUDINARY_CLOUD_NAME = 'dpncctfyy';
const CLOUDINARY_UPLOAD_PRESET = 'viscelius_profiles';

function getInitials(nameOrEmail) {
  const source = (nameOrEmail || '').trim();
  if (!source) return '';
  // Se for email e não tiver nome, usa parte antes do @
  const name = source.includes('@') ? source.split('@')[0] : source;
  const parts = name
    .replace(/[-_.]+/g, ' ')
    .split(' ')
    .filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


function parseSpecialtiesInput(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? '' : String(item).trim()))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (value == null) return [];
  return [String(value).trim()].filter(Boolean);
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
  const [view, setView] = useState('main');

  const role = useMemo(
    () => normalizeRole(userDoc?.role),
    [userDoc?.role]
  );

  // Carrega/garante doc do usuário e role
  useEffect(() => {
    let live = true;
    async function load() {
      if (!user) { setLoading(false); return; }
      try {
        const ensured = await ensureUserDocAndRole({
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          desiredRole: null,
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

  // Upload de avatar (Cloudinary) + sync Auth/Firestore
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
      if (!resp.ok) throw new Error('Falha no upload para o Cloudinary');
      const data = await resp.json();
      const photoURL = data.secure_url;

      await updateProfile(auth.currentUser, { photoURL });
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: serverTimestamp(),
      });

      setUserDoc((prev) => ({ ...prev, photoURL }));
      setNotif({ message: 'Foto atualizada!', type: 'success' });
    } catch (e) {
      console.error(e);
      setNotif({ message: 'Não foi possível atualizar a foto.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Salvar edição
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (form.displayName && form.displayName !== (auth.currentUser?.displayName || '')) {
        await updateProfile(auth.currentUser, { displayName: form.displayName });
      }

      const specialtiesList =
        role === 'therapist' ? parseSpecialtiesInput(form.specialties) : [];
      const specialtiesPayload =
        role === 'therapist'
          ? (specialtiesList.length ? specialtiesList : null)
          : undefined;
      const specialtiesText = specialtiesList.join(', ');

      await updateProfileByRole(user.uid, role, {
        displayName: form.displayName || null,
        phone: form.phone || null,
        birthDate: role === 'patient' ? (form.birthDate || null) : undefined,
        professionalId: role === 'therapist' ? (form.professionalId || null) : undefined,
        specialties: specialtiesPayload,
      });

      setUserDoc((prev) => ({
        ...prev,
        displayName: form.displayName || prev.displayName || '',
        phone: form.phone || '',
        birthDate: role === 'patient' ? (form.birthDate || '') : prev.birthDate,
        professionalId: role === 'therapist' ? (form.professionalId || '') : prev.professionalId,
        specialties: role === 'therapist' ? specialtiesPayload : prev.specialties,
        specialtyText: role === 'therapist' ? specialtiesText : prev.specialtyText,
      }));

      setForm((prev) => ({
        ...prev,
        specialties: role === 'therapist' ? specialtiesText : prev.specialties,
      }));

      setNotif({ message: 'Informações salvas!', type: 'success' });
      setView('main');
    } catch (e) {
      console.error(e);
      setNotif({ message: 'Não foi possível salvar.', type: 'error' });
    }
  };

  const display = useMemo(() => {
    // ➜ Sem pravatar! Se não há foto, deixamos null e usamos iniciais no componente.
    const photo = userDoc?.photoURL || null;
    const name = (user?.displayName ?? userDoc?.displayName) || 'Nome não informado';
    const email = user?.email ?? userDoc?.email ?? '—';
    const initials = getInitials(
      (user?.displayName ?? userDoc?.displayName ?? user?.email ?? userDoc?.email ?? '')
    );
    return {
      name,
      email,
      photo,
      initials,
      phone: userDoc?.phone || '',
      birthDate: userDoc?.birthDate || '',
      professionalId: userDoc?.professionalId || '',
      specialties: stringifySpecialties(userDoc?.specialties ?? userDoc?.specialtyText ?? ''),
    };
  }, [user, userDoc]);

  const styles = {
    page: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', minHeight: '100vh' },
    header: { marginBottom: '2.5rem' },
    title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: 700, margin: 0 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' },
    card: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '2rem' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '1.5rem' },
    cardTitle: { margin: 0, fontWeight: 600, color: '#1F2937', fontSize: '1.1rem' },
    infoRow: { display: 'flex', justifyContent: 'space-between', padding: '.6rem 0' },
    infoKey: { color: '#6B7280' },
    infoVal: { color: '#1F2937', fontWeight: 500 },
    badge: { background: '#EDE9FE', color: '#6D28D9', padding: '6px 10px', borderRadius: 8, fontWeight: 600, fontSize: 12, display: 'inline-block', marginTop: 8 },
    editBtn: { background: 'none', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 },
  };

  if (loading) return <div style={styles.page}>Carregando...</div>;

  return (
    <div style={styles.page}>
      <Notification
        message={notif.message}
        type={notif.type}
        onDone={() => setNotif({ message: '', type: '' })}
      />

      <header style={styles.header}>
        <h1 style={styles.title}>
          Conta e Perfil — {role === 'therapist' ? 'Profissional' : 'Paciente'}
        </h1>
      </header>

      <div style={styles.grid}>
        {/* Coluna esquerda: avatar + resumo */}
        <div>
          <div style={{ ...styles.card, textAlign: 'center' }}>
            <AvatarUploader
              src={display.photo}                // se null, mostra iniciais
              initials={display.initials}        // ex: "GM"
              uploading={uploading}
              onFileSelected={handleAvatarSelected}
              size={120}
            />
            <h2 style={{ marginTop: 12, marginBottom: 4, color: '#1F2937' }}>{display.name}</h2>
            <p style={{ margin: 0, color: '#6B7280' }}>{display.email}</p>
            <span style={styles.badge}>{role === 'therapist' ? 'Profissional' : 'Paciente'}</span>
          </div>
        </div>

        {/* Coluna direita: conteúdo dinâmico */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {view === 'main' ? (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Informações da Conta</h3>
                <button style={styles.editBtn} onClick={() => setView('edit')}>Editar</button>
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
                  <span style={styles.infoVal}>{display.phone || '—'}</span>
                </div>

                {role === 'patient' ? (
                  <div style={styles.infoRow}>
                    <span style={styles.infoKey}>Data de Nascimento</span>
                    <span style={styles.infoVal}>{display.birthDate || '—'}</span>
                  </div>
                ) : (
                  <>
                    <div style={styles.infoRow}>
                      <span style={styles.infoKey}>Registro Profissional</span>
                      <span style={styles.infoVal}>{display.professionalId || '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoKey}>Especialidades</span>
                      <span style={styles.infoVal}>{display.specialties || '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : view === 'edit' ? (
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
          ) : (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Alterar Senha</h3>
              </div>
              <p style={{ color: '#6B7280', marginTop: 0 }}>
                (Opcional) Implementar fluxo de redefinição via Firebase Auth (enviar link).
              </p>
            </div>
          )}

          <AccountActions onLogout={onLogout || (() => auth.signOut())} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;








