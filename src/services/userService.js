// src/services/userService.js
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

export function normalizeRole(role) {
  if (!role) return 'patient';
  const r = String(role).toLowerCase();
  return r === 'therapist' ? 'therapist' : 'patient';
}

/**
 * Garante que o documento users/{uid} exista.
 * - Se não existir, cria com a role desejada (ou 'patient' por padrão).
 * - Se existir, mantém a role existente (a não ser que esteja vazia).
 * - Sincroniza campos básicos (displayName, email, photoURL) se estiverem faltando ou diferentes.
 */
export async function ensureUserDocAndRole({
  uid,
  email = null,
  displayName = null,
  photoURL = null,
  desiredRole = null, // 'patient' | 'therapist' | null
}) {
  if (!uid) throw new Error('ensureUserDocAndRole: uid ausente');

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  // Se não existe, cria com tudo que souber agora
  if (!snap.exists()) {
    const role = normalizeRole(desiredRole || 'patient');
    const payload = {
      uid,
      role,
      email: email ?? null,
      displayName: displayName ?? null,
      photoURL: photoURL ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, payload, { merge: true });
    return payload;
  }

  // Se existe, sincroniza campos faltantes/diferentes
  const existing = snap.data() || {};
  const merged = { ...existing };

  // role: só define se não houver
  if (!existing.role) {
    merged.role = normalizeRole(desiredRole || 'patient');
  } else {
    merged.role = normalizeRole(existing.role);
  }

  // Se o displayName veio do Auth e o doc não tem OU está diferente, atualiza
  if (displayName && (!existing.displayName || existing.displayName !== displayName)) {
    merged.displayName = displayName;
  }

  // Email idem (importante para contas Google)
  if (email && (!existing.email || existing.email !== email)) {
    merged.email = email;
  }

  // Foto idem (não sobrescrevo se o doc tem foto e o Auth está sem)
  if (photoURL && (!existing.photoURL || existing.photoURL !== photoURL)) {
    merged.photoURL = photoURL;
  }

  // Somente grava se mudou algo
  const changed =
    merged.role !== existing.role ||
    merged.displayName !== existing.displayName ||
    merged.email !== existing.email ||
    merged.photoURL !== existing.photoURL;

  if (changed) {
    merged.updatedAt = serverTimestamp();
    await updateDoc(userRef, merged);
  }

  return merged;
}

/**
 * Atualiza campos do perfil por role.
 * - Apenas campos permitidos por role são gravados.
 */
export async function updateProfileByRole(uid, role, fields) {
  const userRef = doc(db, 'users', uid);
  const safe = {};
  const r = normalizeRole(role);

  // comum
  if ('displayName' in fields) safe.displayName = fields.displayName || null;
  if ('phone' in fields) safe.phone = fields.phone || null;
  if ('photoURL' in fields) safe.photoURL = fields.photoURL || null;

  if (r === 'patient') {
    if ('birthDate' in fields) safe.birthDate = fields.birthDate || null;
  }

  if (r === 'therapist') {
    if ('professionalId' in fields) safe.professionalId = fields.professionalId || null;
    if ('specialties' in fields) safe.specialties = fields.specialties || null;
  }

  safe.updatedAt = serverTimestamp();
  await updateDoc(userRef, safe);
  return true;
}
