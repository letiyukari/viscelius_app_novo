// src/components/therapists/TherapistList.js
import React from "react";
import { resolveTherapistLabel } from "../../services/usersService";

export default function TherapistList({ therapists, selectedId, onSelect, loading, error }) {
  if (loading) {
    return <div className="tw-empty-state">Carregando musicoterapeutas...</div>;
  }

  if (error) {
    return <div className="tw-alert-error">{error}</div>;
  }

  if (!therapists.length) {
    return <div className="tw-empty-state">Nenhum musicoterapeuta disponível agora.</div>;
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {therapists.map((therapist) => {
        const { name, specialtyText } = resolveTherapistLabel({ uid: therapist.id, profile: therapist });
        const isActive = therapist.id === selectedId;
        const cardClassName = isActive ? "tw-therapist-card tw-therapist-card-active" : "tw-therapist-card";
        const initials = name
          .split(" ")
          .map((piece) => piece.charAt(0))
          .join("")
          .substring(0, 2)
          .toUpperCase();

        return (
          <button
            key={therapist.id}
            type="button"
            className={cardClassName}
            onClick={() => onSelect(therapist.id)}
            aria-label={`Selecionar musicoterapeuta: ${name} — ${specialtyText}`}
          >
            {therapist.photoURL ? (
              <img src={therapist.photoURL} alt={name} className="tw-therapist-photo" />
            ) : (
              <div className="tw-therapist-fallback">{initials || "MT"}</div>
            )}
            <div className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-sm tw-font-semibold tw-text-slate-900">{name}</span>
              <span className="tw-text-xs tw-text-slate-500">{specialtyText}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
