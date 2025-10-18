// src/services/consultations.js
// Serviço responsável pelo histórico de consultas realizados via plataforma

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitConstraint,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "consultations";

export async function createConsultation(payload) {
  const data = buildConsultationCreatePayload(payload);
  const ref = await addDoc(collection(db, COLLECTION_NAME), data);
  return { id: ref.id };
}

export async function updateConsultation(consultationId, changes) {
  if (!consultationId) throw new Error("consultationId é obrigatório");
  const partial = buildConsultationUpdatePayload(changes);
  if (!partial || Object.keys(partial).length === 0) return;

  const ref = doc(db, COLLECTION_NAME, consultationId);
  await updateDoc(ref, {
    ...partial,
    updatedAt: serverTimestamp(),
  });
}

export async function getConsultation(consultationId) {
  if (!consultationId) throw new Error("consultationId é obrigatório");
  const ref = doc(db, COLLECTION_NAME, consultationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapConsultationSnapshot(snap);
}

export async function listConsultationsByPatient(patientId, options = {}) {
  if (!patientId) throw new Error("patientId é obrigatório");
  const constraints = [
    where("patientId", "==", patientId),
    orderBy("startsAt", "desc"),
  ];
  if (options.limit) {
    constraints.push(limitConstraint(options.limit));
  }

  const snap = await getDocs(query(collection(db, COLLECTION_NAME), ...constraints));
  return snap.docs.map(mapConsultationSnapshot);
}

export async function listConsultationsByTherapist(therapistId, options = {}) {
  if (!therapistId) throw new Error("therapistId é obrigatório");
  const constraints = [
    where("therapistId", "==", therapistId),
    orderBy("startsAt", "desc"),
  ];
  if (options.limit) {
    constraints.push(limitConstraint(options.limit));
  }

  const snap = await getDocs(query(collection(db, COLLECTION_NAME), ...constraints));
  return snap.docs.map(mapConsultationSnapshot);
}

export function subscribePatientConsultations(patientId, cb, onError) {
  if (!patientId) throw new Error("patientId é obrigatório");
  const constraints = [
    where("patientId", "==", patientId),
    orderBy("startsAt", "desc"),
  ];
  return subscribeConsultations(constraints, cb, onError);
}

export function subscribeTherapistConsultations(therapistId, cb, onError) {
  if (!therapistId) throw new Error("therapistId é obrigatório");
  const constraints = [
    where("therapistId", "==", therapistId),
    orderBy("startsAt", "desc"),
  ];
  return subscribeConsultations(constraints, cb, onError);
}

function subscribeConsultations(constraints, cb, onError) {
  const observer = {
    next: (snap) => {
      const data = snap.docs.map(mapConsultationSnapshot);
      cb(data);
    },
  };
  if (onError) observer.error = onError;

  const coll = collection(db, COLLECTION_NAME);
  const qy = query(coll, ...constraints);
  return onSnapshot(qy, observer);
}

function buildConsultationCreatePayload(input = {}) {
  const {
    appointmentId,
    therapistId,
    patientId,
    startsAt,
    endsAt,
    sessionStatus,
    meeting,
    summaryNotes,
    resources,
    followUp,
    completedAt,
    createdBy,
    updatedBy,
  } = input;

  if (!appointmentId) throw new Error("appointmentId é obrigatório");
  if (!therapistId) throw new Error("therapistId é obrigatório");
  if (!patientId) throw new Error("patientId é obrigatório");

  const starts = toTimestamp(startsAt);
  const ends = toTimestamp(endsAt);
  if (!starts) throw new Error("startsAt é obrigatório");
  if (!ends) throw new Error("endsAt é obrigatório");

  const now = serverTimestamp();
  return {
    appointmentId,
    therapistId,
    patientId,
    startsAt: starts,
    endsAt: ends,
    sessionStatus: normalizeSessionStatus(sessionStatus || "COMPLETED"),
    meeting: buildMeetingPayload(meeting),
    summaryNotes: summaryNotes ?? "",
    resources: buildResourcesPayload(resources),
    followUp: buildFollowUpPayload(followUp),
    completedAt: toTimestamp(completedAt) ?? ends,
    createdBy: createdBy ?? therapistId ?? null,
    updatedBy: updatedBy ?? createdBy ?? therapistId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildConsultationUpdatePayload(input = {}) {
  const data = {};
  if ("appointmentId" in input) data.appointmentId = input.appointmentId;
  if ("therapistId" in input) data.therapistId = input.therapistId;
  if ("patientId" in input) data.patientId = input.patientId;

  if ("startsAt" in input) data.startsAt = toTimestamp(input.startsAt);
  if ("endsAt" in input) data.endsAt = toTimestamp(input.endsAt);

  if ("sessionStatus" in input) {
    data.sessionStatus = normalizeSessionStatus(input.sessionStatus);
  }

  if ("meeting" in input) data.meeting = buildMeetingPayload(input.meeting);

  if ("summaryNotes" in input) data.summaryNotes = input.summaryNotes ?? "";
  if ("resources" in input) data.resources = buildResourcesPayload(input.resources);
  if ("followUp" in input) data.followUp = buildFollowUpPayload(input.followUp);
  if ("completedAt" in input) data.completedAt = toTimestamp(input.completedAt);
  if ("updatedBy" in input) data.updatedBy = input.updatedBy ?? null;

  return data;
}

function buildMeetingPayload(meeting = {}) {
  const hasProvider = Object.prototype.hasOwnProperty.call(meeting || {}, "provider");
  const provider = hasProvider ? meeting.provider ?? null : "jitsi";
  return {
    provider,
    roomName: meeting.roomName ?? null,
    joinUrl: meeting.joinUrl ?? null,
    expiresAt: toTimestamp(meeting.expiresAt),
    config: meeting.config ?? null,
  };
}

function buildResourcesPayload(resources = {}) {
  return {
    playlists: Array.isArray(resources.playlists) ? resources.playlists : [],
    exercises: Array.isArray(resources.exercises) ? resources.exercises : [],
    files: Array.isArray(resources.files) ? resources.files : [],
  };
}

function buildFollowUpPayload(followUp = {}) {
  return {
    tasks: Array.isArray(followUp.tasks) ? followUp.tasks : [],
    reminderAt: toTimestamp(followUp.reminderAt),
  };
}

function mapConsultationSnapshot(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    ...data,
    startsAt: coerceTimestamp(data.startsAt),
    endsAt: coerceTimestamp(data.endsAt),
    sessionStatus: normalizeSessionStatus(data.sessionStatus),
    meeting: {
      provider: data?.meeting?.provider ?? null,
      roomName: data?.meeting?.roomName ?? null,
      joinUrl: data?.meeting?.joinUrl ?? null,
      expiresAt: coerceTimestamp(data?.meeting?.expiresAt),
      config: data?.meeting?.config ?? null,
    },
    summaryNotes: data.summaryNotes ?? "",
    resources: buildResourcesPayload(data.resources),
    followUp: {
      tasks: Array.isArray(data?.followUp?.tasks) ? data.followUp.tasks : [],
      reminderAt: coerceTimestamp(data?.followUp?.reminderAt),
    },
    completedAt: coerceTimestamp(data.completedAt),
    createdAt: coerceTimestamp(data.createdAt) ?? null,
    updatedAt: coerceTimestamp(data.updatedAt) ?? null,
    createdBy: data.createdBy ?? null,
    updatedBy: data.updatedBy ?? null,
  };
}

function toTimestamp(value) {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === "number") return Timestamp.fromMillis(value);
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return Timestamp.fromDate(date);
  }
  return null;
}

function coerceTimestamp(value) {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  if (typeof value.toDate === "function") return value;
  return toTimestamp(value);
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
      return "completed";
  }
}
