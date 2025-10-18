// src/services/jitsiService.js
// Utilidades para geração de salas e metadados do Jitsi Meet

import { Timestamp } from "firebase/firestore";

const FALLBACK_DOMAIN = "https://meet.jit.si";
const ROOM_PREFIX = "viscelius";
const DEFAULT_TTL_MINUTES = 30;

export function getJitsiDomain() {
  const envDomain = process.env.REACT_APP_JITSI_DOMAIN;
  if (envDomain && typeof envDomain === "string" && envDomain.trim().length > 0) {
    return sanitizeDomain(envDomain.trim());
  }
  return FALLBACK_DOMAIN;
}

export function generateJitsiRoomMetadata({
  therapistId,
  patientId,
  appointmentId,
  startsAt,
  endsAt,
  domain,
  ttlMinutes = DEFAULT_TTL_MINUTES,
}) {
  if (!therapistId) throw new Error("therapistId é obrigatório");
  if (!patientId) throw new Error("patientId é obrigatório");
  if (!appointmentId) throw new Error("appointmentId é obrigatório");

  const baseDomain = sanitizeDomain(domain || getJitsiDomain());
  const referenceDate = resolveReferenceDate(startsAt, endsAt);
  const roomName = buildRoomName({
    therapistId,
    patientId,
    appointmentId,
    referenceDate,
  });
  const joinUrl = `${baseDomain}/${roomName}`;
  const expiresAt = buildExpiration(referenceDate, ttlMinutes);

  return {
    provider: "jitsi",
    roomName,
    joinUrl,
    expiresAt,
    config: {
      domain: baseDomain,
      ttlMinutes,
    },
  };
}

export function buildJitsiMeetingOptions({
  roomName,
  displayName,
  email,
  avatar,
  lang = "pt-BR",
  domain,
  interfaceConfig = {},
  config = {},
}) {
  if (!roomName) throw new Error("roomName é obrigatório");
  const baseDomain = sanitizeDomain(domain || getJitsiDomain());
  return {
    domain: baseDomain.replace(/^https?:\/\//, ""),
    roomName,
    userInfo: {
      displayName: displayName || undefined,
      email: email || undefined,
    },
    lang,
    configOverwrite: {
      prejoinConfig: {
        enabled: true,
      },
      ...config,
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      DEFAULT_LOGO_URL: avatar || undefined,
      ...interfaceConfig,
    },
  };
}

function buildRoomName({ therapistId, patientId, appointmentId, referenceDate }) {
  const therapistSlug = slugify(therapistId).slice(0, 12);
  const patientSlug = slugify(patientId).slice(0, 8);
  const dateFragment = buildDateFragment(referenceDate);
  const hashFragment = hashString(`${appointmentId}-${dateFragment}`).slice(0, 6);
  const randomFragment = randomString(4);
  return [
    ROOM_PREFIX,
    therapistSlug,
    patientSlug,
    dateFragment,
    hashFragment,
    randomFragment,
  ]
    .filter(Boolean)
    .join("-");
}

function resolveReferenceDate(startsAt, endsAt) {
  const startTs = toDate(startsAt);
  const endTs = toDate(endsAt);
  return startTs || endTs || new Date();
}

function buildExpiration(referenceDate, ttlMinutes) {
  const base = toDate(referenceDate) || new Date();
  const expires = new Date(base.getTime() + Math.max(ttlMinutes, 5) * 60 * 1000);
  return Timestamp.fromDate(expires);
}

function sanitizeDomain(value) {
  const trimmed = String(value || "").trim();
  if (trimmed.length === 0) return FALLBACK_DOMAIN;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/+$/, "");
  }
  return `https://${trimmed.replace(/\/+$/, "")}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildDateFragment(date) {
  const dt = toDate(date);
  if (!dt) return "";
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function hashString(value) {
  const input = String(value || "");
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function randomString(length) {
  let result = "";
  while (result.length < length) {
    result += Math.random().toString(36).slice(2);
  }
  return result.slice(0, length);
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

