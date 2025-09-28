// src/services/usersService.js
// Serviço de perfis de usuário com cache em memória

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

const profileCache = new Map();
const labelCache = new Map();

function normalizeSpecialty(data = {}) {
  const source = data || {};
  const specialties = source.specialties;
  if (Array.isArray(specialties)) {
    return specialties
      .map((value) => (value == null ? "" : String(value).trim()))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof specialties === "string") {
    return specialties
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .join(", ");
  }
  const single = source.specialty == null ? "" : String(source.specialty).trim();
  return single;
}

function normalizeProfile(uid, data) {
  if (!uid || !data) return null;
  const specialtyText = normalizeSpecialty(data);
  return { uid, ...data, specialtyText };
}

function rememberProfile(uid, profile) {
  profileCache.set(uid, profile);
  if (uid) labelCache.delete(uid);
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  if (profileCache.has(uid)) return profileCache.get(uid);
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const profile = snap.exists() ? normalizeProfile(snap.id, snap.data()) : null;
  rememberProfile(uid, profile);
  return profile;
}

export async function getMultipleUserProfiles(uids = [], options = {}) {
  const { forceRefresh = false } = options || {};
  const unique = Array.from(new Set((uids || []).filter(Boolean)));
  if (unique.length === 0) return {};

  const result = {};
  const pending = [];

  unique.forEach((uid) => {
    if (!forceRefresh && profileCache.has(uid)) {
      result[uid] = profileCache.get(uid);
    } else {
      pending.push(uid);
    }
  });

  if (pending.length > 0) {
    await Promise.all(
      pending.map(async (uid) => {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        const profile = snap.exists() ? normalizeProfile(snap.id, snap.data()) : null;
        rememberProfile(uid, profile);
        result[uid] = profile;
      })
    );
  }

  unique.forEach((uid) => {
    if (!Object.prototype.hasOwnProperty.call(result, uid)) {
      result[uid] = profileCache.get(uid) || null;
    }
  });

  return result;
}

export async function getTherapists(options = {}) {
  const { specialty } = options;
  const filters = [where("role", "==", "therapist")];
  if (specialty && specialty !== "all") {
    filters.push(where("specialty", "==", specialty));
  }

  const q = query(collection(db, "users"), ...filters);
  const snap = await getDocs(q);

  const items = snap.docs.map((docSnap) => {
    const profile = normalizeProfile(docSnap.id, docSnap.data());
    rememberProfile(docSnap.id, profile);
    return profile;
  });

  return items;
}

export function resolveTherapistLabel({ uid, profile } = {}) {
  if (uid && labelCache.has(uid)) {
    return labelCache.get(uid);
  }

  const source = profile || (uid ? profileCache.get(uid) : null) || {};
  const name = (source.displayName || source.name || "").toString().trim() || "Usuário";
  const specialtyRaw = (source.specialtyText || normalizeSpecialty(source) || "").trim();
  const specialtyText = specialtyRaw || "Especialidade não informada";
  const value = { name, specialtyText };

  if (uid) {
    labelCache.set(uid, value);
  }

  return value;
}

export function clearUserProfileCache() {
  profileCache.clear();
  labelCache.clear();
}

export function invalidateUserProfileCache(uid) {
  if (!uid) return;
  profileCache.delete(uid);
  labelCache.delete(uid);
}

