// src/context/PlayerContext.js
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const PlayerContext = createContext(null);

export const sanitizeTrack = (track = {}) => {
  if (!track) return null;
  const url = track.url || track.audioUrl || track.fileUrl;
  if (!url) return null;
  return {
    id: track.id || track.url || `${url}-${track.name || track.title || ''}`,
    name: track.name || track.title || 'Faixa sem nome',
    artist: track.artist || track.desc || track.subtitle || '',
    image:
      track.image ||
      track.cover ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
    url,
    ...track,
  };
};

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const canPlay = !!audioRef.current;

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = '';
    setIsPlaying(false);
    setCurrentTrack(null);
    setQueue([]);
    setCurrentIndex(-1);
  }, []);

  const loadAndPlay = useCallback(
    async (track) => {
      const audio = audioRef.current;
      if (!audio || !track?.url) {
        console.warn('[Player] Não foi possível iniciar a reprodução: URL inválida.');
        return;
      }
      try {
        audio.src = track.url;
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('[Player] Erro ao reproduzir a faixa', error);
        setIsPlaying(false);
      }
    },
    [],
  );

  const playTrack = useCallback(
    (rawTrack, options = {}) => {
      if (!canPlay) return;
      const track = sanitizeTrack(rawTrack);
      if (!track) return;

      const providedQueue = Array.isArray(options.queue)
        ? options.queue.map(sanitizeTrack).filter(Boolean)
        : [];

      let finalQueue = providedQueue;
      let index = options.index ?? -1;

      if (finalQueue.length === 0) {
        finalQueue = [track];
        index = 0;
      } else {
        if (index < 0) {
          index = finalQueue.findIndex((item) => item.id === track.id);
        }
        if (index < 0) {
          finalQueue = [track, ...finalQueue];
          index = 0;
        }
      }

      const trackToPlay = finalQueue[index] || track;

      setQueue(finalQueue);
      setCurrentIndex(index);
      setCurrentTrack(trackToPlay);
      loadAndPlay(trackToPlay);
    },
    [canPlay, loadAndPlay],
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => console.error('[Player] Erro ao retomar audio', error));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    if (queue.length === 1) {
      stop();
      return;
    }
    const nextIndex = (currentIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];
    setCurrentIndex(nextIndex);
    setCurrentTrack(nextTrack);
    loadAndPlay(nextTrack);
  }, [currentIndex, queue, loadAndPlay, stop]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;
    if (queue.length === 1) {
      stop();
      return;
    }
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevTrack = queue[prevIndex];
    setCurrentIndex(prevIndex);
    setCurrentTrack(prevTrack);
    loadAndPlay(prevTrack);
  }, [currentIndex, queue, loadAndPlay, stop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handleEnded = () => {
      playNext();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playNext]);

  const value = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      playTrack,
      togglePlayPause,
      playNext,
      playPrevious,
      stop,
      queue,
    }),
    [currentTrack, isPlaying, playTrack, togglePlayPause, playNext, playPrevious, stop, queue],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer deve ser utilizado dentro de um PlayerProvider');
  }
  return context;
};
