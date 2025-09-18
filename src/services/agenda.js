// src/services/agenda.js
// Serviço central da Agenda (Firestore)
// Fluxo: terapeuta publica horários -> paciente solicita -> terapeuta aprova/nega -> paciente vê status

import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// ===================== MODELOS (referência) =====================
/**
 * Slot (disponibilidade do terapeuta):
 * therapists/{therapistId}/slots/{slotId} = {
 *   therapistId, startsAt: ISOString, endsAt: ISOString,
 *   status: 'OPEN' | 'HELD' | 'BOOKED',
 *   requestedBy?: patientId,
 *   createdAt, updatedAt
 * }
 *
 * Appointment:
 * appointments/{appointmentId} = {
 *   therapistId, patientId,
 *   slotPath, slotStartsAt, slotEndsAt,
 *   status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELED',
 *   createdAt, updatedAt
 * }
 */

// ===================== SLOTS (TERAPEUTA) =====================

export async function publishSlots(therapistId, slots) {
  if (!therapistId) throw new Error("therapistId é obrigatório");
  const base = collection(db, "therapists", therapistId, "slots");

  const results = [];
  for (const s of slots) {
    const starts = toIso(s.startsAt);
    const ends = toIso(s.endsAt);

    // id estável a partir da data/hora
    const slotId = starts.replace(/[:.]/g, "_");
    const ref = doc(base, slotId);

    await setDoc(
      ref,
      {
        therapistId,
        startsAt: starts,
        endsAt: ends,
        status: "OPEN",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    results.push(ref);
  }
  return results;
}

/**
 * Lista slots OPEN/HELD de um terapeuta.
 * Versão sem índice composto: faz duas queries e ordena no cliente.
 */
export async function listOpenSlotsByTherapist(therapistId, fromIso) {
  const base = collection(db, "therapists", therapistId, "slots");

  const [openSnap, heldSnap] = await Promise.all([
    getDocs(query(base, where("status", "==", "OPEN"))),
    getDocs(query(base, where("status", "==", "HELD"))),
  ]);

  const rows = [
    ...openSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ...heldSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  ];

  const filtered = rows.filter((x) => (fromIso ? x.startsAt >= fromIso : true));
  filtered.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
  return filtered;
}

/** stream de todos os slots do terapeuta (ordenados por startsAt) */
export function subscribeSlots(therapistId, cb) {
  const base = collection(db, "therapists", therapistId, "slots");
  const qy = query(base, orderBy("startsAt", "asc"));
  return onSnapshot(qy, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(data);
  });
}

/** excluir slot somente quando status = OPEN */
export async function deleteSlot(therapistId, slotId) {
  const slotRef = doc(db, "therapists", therapistId, "slots", slotId);
  const snap = await getDoc(slotRef);
  if (!snap.exists()) throw new Error("Slot não encontrado");

  const slot = snap.data();
  if (slot.status !== "OPEN") {
    throw new Error(
      "Só é possível excluir horários com status ABERTO. Recuse a solicitação pendente ou cancele o agendamento antes."
    );
  }

  await deleteDoc(slotRef);
}

// ===================== APPOINTMENTS (SOLICITAÇÃO/CONFIRMAÇÃO) =====================

/** paciente solicita um horário (slot -> HELD, cria appointment PENDING) */
export async function requestAppointment({ patientId, therapistId, slotId }) {
  if (!patientId || !therapistId || !slotId)
    throw new Error("patientId, therapistId e slotId são obrigatórios");

  const slotRef = doc(db, "therapists", therapistId, "slots", slotId);
  const slotSnap = await getDoc(slotRef);
  if (!slotSnap.exists()) throw new Error("Slot não encontrado");
  const slot = slotSnap.data();
  if (slot.status !== "OPEN") throw new Error("Slot não está disponível");

  await updateDoc(slotRef, {
    status: "HELD",
    requestedBy: patientId,
    updatedAt: serverTimestamp(),
  });

  const apptRef = await addDoc(collection(db, "appointments"), {
    therapistId,
    patientId,
    slotPath: slotRef.path,
    slotStartsAt: slot.startsAt,
    slotEndsAt: slot.endsAt,
    status: "PENDING",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: apptRef.id };
}

/** terapeuta aprova (appointment -> CONFIRMED, slot -> BOOKED) */
export async function approveAppointment(appointmentId) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento não encontrado");
  const appt = apptSnap.data();

  await updateDoc(apptRef, { status: "CONFIRMED", updatedAt: serverTimestamp() });

  const slotRef = docFromPath(appt.slotPath);
  await updateDoc(slotRef, { status: "BOOKED", updatedAt: serverTimestamp() });
}

/** terapeuta recusa (appointment -> DECLINED, slot -> OPEN) */
export async function declineAppointment(appointmentId) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento não encontrado");
  const appt = apptSnap.data();

  await updateDoc(apptRef, { status: "DECLINED", updatedAt: serverTimestamp() });

  const slotRef = docFromPath(appt.slotPath);
  await updateDoc(slotRef, {
    status: "OPEN",
    requestedBy: null,
    updatedAt: serverTimestamp(),
  });
}

/** paciente (ou terapeuta) cancela (appointment -> CANCELED, slot -> OPEN) */
export async function cancelAppointment(appointmentId) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento não encontrado");
  const appt = apptSnap.data();

  await updateDoc(apptRef, { status: "CANCELED", updatedAt: serverTimestamp() });

  const slotRef = docFromPath(appt.slotPath);
  await updateDoc(slotRef, {
    status: "OPEN",
    requestedBy: null,
    updatedAt: serverTimestamp(),
  });
}

/** listar agendamentos por usuário (terapeuta ou paciente) */
export async function listAppointmentsByUser(userId, role) {
  const base = collection(db, "appointments");
  const field = role === "therapist" ? "therapistId" : "patientId";
  const qy = query(base, where(field, "==", userId), orderBy("slotStartsAt", "asc"));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** streams em tempo real */
export function subscribeTherapistAppointments(therapistId, cb) {
  const base = collection(db, "appointments");
  const qy = query(base, where("therapistId", "==", therapistId), orderBy("createdAt", "desc"));
  return onSnapshot(qy, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(data);
  });
}

export function subscribePatientAppointments(patientId, cb) {
  const base = collection(db, "appointments");
  const qy = query(base, where("patientId", "==", patientId), orderBy("createdAt", "desc"));
  return onSnapshot(qy, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(data);
  });
}

// ===================== BUSCA GLOBAL POR SLOTS (opcional) =====================

/**
 * Descobre terapeutas que têm slots OPEN/HELD (usa collectionGroup)
 * Retorna um Set de therapistIds.
 */
export async function findTherapistsWithOpenSlots() {
  const cg = await getDocs(collectionGroup(db, "slots"));
  const ids = new Set();
  cg.forEach((d) => {
    const data = d.data();
    if (data?.status === "OPEN" || data?.status === "HELD") {
      const parts = d.ref.path.split("/"); // therapists/{tid}/slots/{sid}
      const tid = parts[1];
      if (tid) ids.add(tid);
    }
  });
  return Array.from(ids);
}

// ===================== HELPERS =====================

function toIso(v) {
  if (!v) return null;
  if (typeof v === "string") return new Date(v).toISOString();
  if (v instanceof Date) return v.toISOString();
  throw new Error("Data inválida");
}

function docFromPath(path) {
  return doc(db, path);
}
