// src/components/wellness/BreathingExercise.js
import React, { useEffect, useMemo, useState } from 'react';

const PHASES = [
  { key: 'inhale', label: 'Inspire', duration: 4 },
  { key: 'hold', label: 'Segure', duration: 7 },
  { key: 'exhale', label: 'Expire', duration: 8 },
];

const phaseColors = {
  inhale: '#34D399',
  hold: '#FBBF24',
  exhale: '#60A5FA',
};

const circleSizes = {
  inhale: 220,
  hold: 260,
  exhale: 180,
};

const BreathingExercise = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(PHASES[0].duration);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const currentPhase = PHASES[phaseIndex];

  useEffect(() => {
    if (!isRunning) return undefined;
    if (remainingTime <= 0) return undefined;

    const timeoutId = setTimeout(() => {
      setRemainingTime((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isRunning, remainingTime]);

  useEffect(() => {
    if (!isRunning || remainingTime > 0) return;

    setPhaseIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % PHASES.length;
      if (nextIndex === 0) {
        setCyclesCompleted((cycles) => cycles + 1);
      }
      setRemainingTime(PHASES[nextIndex].duration);
      return nextIndex;
    });
  }, [isRunning, remainingTime]);

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhaseIndex(0);
    setRemainingTime(PHASES[0].duration);
    setCyclesCompleted(0);
  };

  const circleStyle = useMemo(() => {
    const size = circleSizes[currentPhase.key] || 220;
    return {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: `radial-gradient(circle at center, ${phaseColors[currentPhase.key]}33 0%, ${phaseColors[currentPhase.key]}22 60%, ${phaseColors[currentPhase.key]}11 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0F172A',
      transition: 'all 0.8s ease',
      fontSize: '2.5rem',
      fontWeight: 700,
      boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
    };
  }, [currentPhase.key]);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '2rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
          Respiração guiada 4-7-8
        </h3>
        <p style={{ margin: '0.5rem 0 0 0', color: '#6B7280' }}>
          Dica: faça 4 ciclos, 2–3x ao dia. Não use enquanto dirige.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={circleStyle}>
          <span>{remainingTime}s</span>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          color: '#4B5563',
          fontSize: '1.25rem',
          fontWeight: 600,
        }}
      >
        {currentPhase.label}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          style={{
            minWidth: 120,
            padding: '0.75rem 1rem',
            borderRadius: 999,
            border: 'none',
            background: '#4C1D95',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={handleStart}
          disabled={isRunning}
        >
          Iniciar
        </button>
        <button
          type="button"
          style={{
            minWidth: 120,
            padding: '0.75rem 1rem',
            borderRadius: 999,
            border: '1px solid #4C1D95',
            background: 'transparent',
            color: '#4C1D95',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={handlePause}
          disabled={!isRunning}
        >
          Pausar
        </button>
        <button
          type="button"
          style={{
            minWidth: 120,
            padding: '0.75rem 1rem',
            borderRadius: 999,
            border: '1px solid #6B7280',
            background: 'transparent',
            color: '#6B7280',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={handleReset}
        >
          Reiniciar
        </button>
      </div>

      <div
        style={{
          textAlign: 'center',
          color: '#4B5563',
          fontWeight: 600,
        }}
      >
        Ciclos concluídos: {cyclesCompleted}
      </div>
    </div>
  );
};

export default BreathingExercise;
