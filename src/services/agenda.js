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
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { createConsultation, updateConsultation } from "./consultations";
import { generateJitsiRoomMetadata } from "./jitsiService";

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
 *   startTime: Timestamp, endTime: Timestamp,
 *   status: 'pending' | 'confirmed' | 'declined' | 'canceled' | 'completed',
 *   sessionStatus: 'scheduled' | 'in_progress' | 'completed' | 'canceled',
 *   meetingProvider: 'jitsi' | null,
 *   meetingRoom, meetingUrl, meetingConfig,
 *   meetingExpiresAt: Timestamp | null,
 *   completedAt: Timestamp | null,
 *   historyId: string | null,
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
export function subscribeSlots(therapistId, cb, onError) {
  const base = collection(db, "therapists", therapistId, "slots");
  const qy = query(base, orderBy("startsAt", "asc"));
  const observer = {
    next: (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(data);
    },
  };
  if (onError) observer.error = onError;
  return onSnapshot(qy, observer);
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

  const startTime = coerceTimestamp(null, slot.startsAt);
  const endTime = coerceTimestamp(null, slot.endsAt);

  const apptRef = await addDoc(collection(db, "appointments"), {
    therapistId,
    patientId,
    slotPath: slotRef.path,
    slotStartsAt: slot.startsAt,
    slotEndsAt: slot.endsAt,
    startTime,
    endTime,
    status: normalizeAppointmentStatus("PENDING"),
    sessionStatus: normalizeSessionStatus("SCHEDULED"),
    meetingProvider: null,
    meetingRoom: null,
    meetingUrl: null,
    meetingConfig: null,
    meetingExpiresAt: null,
    completedAt: null,
    historyId: null,
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
  const meetingFields = prepareJitsiMeetingFields(appointmentId, appt);

  await updateDoc(apptRef, {
    status: normalizeAppointmentStatus("CONFIRMED"),
    sessionStatus: normalizeSessionStatus(appt.sessionStatus || "SCHEDULED"),
    ...meetingFields,
    updatedAt: serverTimestamp(),
  });

  const slotRef = docFromPath(appt.slotPath);
  await updateDoc(slotRef, { status: "BOOKED", updatedAt: serverTimestamp() });
}

/** terapeuta recusa (appointment -> DECLINED, slot -> OPEN) */
export async function declineAppointment(appointmentId) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento não encontrado");
  const appt = apptSnap.data();

  await updateDoc(apptRef, {
    status: normalizeAppointmentStatus("DECLINED"),
    sessionStatus: normalizeSessionStatus("CANCELED"),
    meetingProvider: null,
    meetingRoom: null,
    meetingUrl: null,
    meetingConfig: null,
    meetingExpiresAt: null,
    updatedAt: serverTimestamp(),
  });

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

  await updateDoc(apptRef, {
    status: normalizeAppointmentStatus("CANCELED"),
    sessionStatus: normalizeSessionStatus("CANCELED"),
    meetingProvider: null,
    meetingRoom: null,
    meetingUrl: null,
    meetingConfig: null,
    meetingExpiresAt: null,
    updatedAt: serverTimestamp(),
  });

  const slotRef = docFromPath(appt.slotPath);
  await updateDoc(slotRef, {
    status: "OPEN",
    requestedBy: null,
    updatedAt: serverTimestamp(),
  });
}

export async function regenerateAppointmentMeeting(appointmentId, options = {}) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento nao encontrado");
  const appt = apptSnap.data();
  const normalizedStatus = normalizeAppointmentStatus(appt.status);
  if (normalizedStatus !== "confirmed") {
    throw new Error("Somente consultas confirmadas podem gerar link de reuniao");
  }

  const meetingFields = prepareJitsiMeetingFields(appointmentId, appt, options);
  await updateDoc(apptRef, {
    ...meetingFields,
    updatedAt: serverTimestamp(),
  });

  return meetingFields;
}

export async function completeAppointment(appointmentId, payload = {}) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento nao encontrado");

  const appt = apptSnap.data();
  const normalizedStatus = normalizeAppointmentStatus(appt.status);
  if (normalizedStatus !== "confirmed" && normalizedStatus !== "completed") {
    throw new Error("Somente consultas confirmadas podem ser finalizadas");
  }

  const actorId = payload.updatedBy || appt.therapistId;
  const therapistId = appt.therapistId || actorId;
  if (!therapistId) throw new Error("Agendamento sem therapistId");
  if (!appt.patientId) throw new Error("Agendamento sem patientId");

  const startTime = coerceTimestamp(appt.startTime, appt.slotStartsAt);
  const endTime = coerceTimestamp(appt.endTime, appt.slotEndsAt);
  const completedDate = new Date();
  const completedTs = Timestamp.fromDate(completedDate);

  const meetingData = extractMeetingFromAppointment(appt, payload.meeting);
  const resources = {
    playlists: Array.isArray(payload?.resources?.playlists) ? payload.resources.playlists : [],
    exercises: Array.isArray(payload?.resources?.exercises) ? payload.resources.exercises : [],
    files: Array.isArray(payload?.resources?.files) ? payload.resources.files : [],
  };
  const followUp = {
    tasks: Array.isArray(payload?.followUp?.tasks) ? payload.followUp.tasks : [],
    reminderAt: payload?.followUp?.reminderAt ?? null,
  };

  const consultationPayload = {
    appointmentId,
    therapistId,
    patientId: appt.patientId,
    startsAt: startTime ?? appt.slotStartsAt,
    endsAt: endTime ?? appt.slotEndsAt,
    sessionStatus: "COMPLETED",
    meeting: meetingData,
    summaryNotes: payload.summaryNotes ?? "",
    resources,
    followUp,
    completedAt: completedDate,
    createdBy: actorId ?? therapistId ?? null,
    updatedBy: actorId ?? therapistId ?? null,
  };

  let consultationId = appt.historyId || null;
  if (consultationId) {
    await updateConsultation(consultationId, {
      appointmentId: consultationPayload.appointmentId,
      therapistId: consultationPayload.therapistId,
      patientId: consultationPayload.patientId,
      startsAt: consultationPayload.startsAt,
      endsAt: consultationPayload.endsAt,
      sessionStatus: "COMPLETED",
      meeting: meetingData,
      summaryNotes: consultationPayload.summaryNotes,
      resources,
      followUp,
      completedAt: completedDate,
      updatedBy: consultationPayload.updatedBy,
    });
  } else {
    const result = await createConsultation(consultationPayload);
    consultationId = result?.id || null;
  }

  await updateDoc(apptRef, {
    therapistId,
    status: normalizeAppointmentStatus("COMPLETED"),
    sessionStatus: normalizeSessionStatus("COMPLETED"),
    completedAt: completedTs,
    historyId: consultationId,
    updatedAt: serverTimestamp(),
  });

  return { consultationId };
}
/** listar agendamentos por usuário (terapeuta ou paciente) */
export async function listAppointmentsByUser(userId, role) {
  const base = collection(db, "appointments");
  const field = role === "therapist" ? "therapistId" : "patientId";
  const qy = query(base, where(field, "==", userId), orderBy("slotStartsAt", "asc"));
  const snap = await getDocs(qy);
  return snap.docs.map(mapAppointmentSnapshot);
}

/** streams em tempo real */
export function subscribeTherapistAppointments(therapistId, cb) {
  const base = collection(db, "appointments");
  const qy = query(base, where("therapistId", "==", therapistId), orderBy("createdAt", "desc"));
  return onSnapshot(qy, (snap) => {
    const data = snap.docs.map(mapAppointmentSnapshot);
    cb(data);
  });
}

export function subscribePatientAppointments(patientId, cb) {
  const base = collection(db, "appointments");
  const qy = query(base, where("patientId", "==", patientId), orderBy("createdAt", "desc"));
  return onSnapshot(qy, (snap) => {
    const data = snap.docs.map(mapAppointmentSnapshot);
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

function normalizeAppointmentStatus(raw) {
  const value = String(raw || "").toLowerCase();
  switch (value) {
    case "pending":
    case "confirmed":
    case "canceled":
    case "declined":
    case "completed":
      return value;
    default:
      return "pending";
  }
}

function normalizeSessionStatus(raw) {
  const value = String(raw || "").toLowerCase();
  switch (value) {
    case "scheduled":
    case "in_progress":
    case "completed":
    case "canceled":
      return value;
    default:
      return "scheduled";
  }
}

function prepareJitsiMeetingFields(appointmentId, appt, options = {}) {
  if (!appt) throw new Error("Dados do agendamento nao encontrados");
  if (!appt.therapistId) throw new Error("therapistId ausente no agendamento");
  if (!appt.patientId) throw new Error("patientId ausente no agendamento");

  const metadata = generateJitsiRoomMetadata({
    therapistId: appt.therapistId,
    patientId: appt.patientId,
    appointmentId,
    startsAt: appt.startTime || appt.slotStartsAt,
    endsAt: appt.endTime || appt.slotEndsAt,
    domain: options.domain,
    ttlMinutes: options.ttlMinutes,
  });

  return {
    meetingProvider: metadata.provider,
    meetingRoom: metadata.roomName,
    meetingUrl: metadata.joinUrl,
    meetingConfig: metadata.config,
    meetingExpiresAt: metadata.expiresAt,
  };
}

function extractMeetingFromAppointment(appt = {}, override = {}) {
  const source = { ...(appt || {}) };
  const applied = { ...(override || {}) };
  const provider =
    applied.provider ?? source.meetingProvider ?? (source.meetingUrl ? "jitsi" : null);
  return {
    provider,
    roomName: applied.roomName ?? source.meetingRoom ?? null,
    joinUrl: applied.joinUrl ?? source.meetingUrl ?? null,
    expiresAt: applied.expiresAt ?? source.meetingExpiresAt ?? null,
    config: applied.config ?? source.meetingConfig ?? null,
  };
}

function mapAppointmentSnapshot(docSnap) {
  const data = docSnap.data() || {};
  const startTime = coerceTimestamp(data.startTime, data.slotStartsAt);
  const endTime = coerceTimestamp(data.endTime, data.slotEndsAt);
  return {
    id: docSnap.id,
    ...data,
    status: normalizeAppointmentStatus(data.status),
    sessionStatus: normalizeSessionStatus(data.sessionStatus),
    startTime,
    endTime,
    meetingExpiresAt: coerceTimestamp(data.meetingExpiresAt),
    completedAt: coerceTimestamp(data.completedAt),
  };
}

function coerceTimestamp(value, fallbackIso) {
  if (value && typeof value.toDate === "function") return value;
  const source = value ?? fallbackIso;
  if (!source) return undefined;
  const date =
    source instanceof Date
      ? source
      : typeof source === "string"
      ? new Date(source)
      : null;
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return Timestamp.fromDate(date);
}


