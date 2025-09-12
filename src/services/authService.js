// src/services/authService.js
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  ensureUserDocAndRole,
  normalizeRole,
} from './userService';

/** Rota pós-auth por role */
export function nextRouteByRole(role) {
  return role === 'therapist' ? '/dashboard' : '/inicio';
}

/** LOGIN: email/senha + garante role */
export async function loginWithEmail({ email, password, desiredRole }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  const docUser = await ensureUserDocAndRole({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    desiredRole: desiredRole ?? null,
  });

  const finalRole = normalizeRole(docUser.role);
  return { user, role: finalRole, nextRoute: nextRouteByRole(finalRole) };
}

/** LOGIN: Google + garante role */
export async function loginWithGoogle({ desiredRole }) {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const docUser = await ensureUserDocAndRole({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    desiredRole: desiredRole ?? null,
  });

  const finalRole = normalizeRole(docUser.role);
  return { user, role: finalRole, nextRoute: nextRouteByRole(finalRole) };
}

/** CADASTRO: paciente (email/senha) + define role patient
 *  Usa sessionStorage para “dica” de role, evitando corrida com o AuthContext.
 */
export async function registerPatient({ name, email, password, birthDate }) {
  // dica para o AuthContext, caso ele crie o doc primeiro
  sessionStorage.setItem('viscelius_desired_role', 'patient');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  if (name) await updateProfile(user, { displayName: name });

  const docUser = await ensureUserDocAndRole({
    uid: user.uid,
    email: user.email,
    displayName: name || user.displayName || null,
    desiredRole: 'patient',
  });

  // limpar dica
  sessionStorage.removeItem('viscelius_desired_role');

  const finalRole = normalizeRole(docUser.role);
  return { user, role: finalRole, nextRoute: nextRouteByRole(finalRole) };
}

/** CADASTRO: terapeuta (email/senha) + define role therapist
 *  Usa sessionStorage para “dica” de role, evitando corrida com o AuthContext.
 */
export async function registerTherapist({ name, email, password, phone, professionalId, specialties }) {
  // dica para o AuthContext, caso ele crie o doc primeiro
  sessionStorage.setItem('viscelius_desired_role', 'therapist');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  if (name) await updateProfile(user, { displayName: name });

  const docUser = await ensureUserDocAndRole({
    uid: user.uid,
    email: user.email,
    displayName: name || user.displayName || null,
    desiredRole: 'therapist',
  });

  // limpar dica
  sessionStorage.removeItem('viscelius_desired_role');

  const finalRole = normalizeRole(docUser.role);
  return { user, role: finalRole, nextRoute: nextRouteByRole(finalRole) };
}

/** LOGOUT */
export async function logout() {
  await signOut(auth);
}
