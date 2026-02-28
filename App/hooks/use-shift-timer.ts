import { useCallback, useEffect, useRef, useState } from 'react';

function isOffHours(date: Date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const isLunch = hour === 13;
  const isNight = hour >= 19 || hour < 8;
  if (isLunch) {
    return true;
  }
  if (isNight) {
    return true;
  }
  if (hour === 14 && minute === 0) {
    return false;
  }
  return false;
}

export function useShiftTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = new Date();
      const offHours = isOffHours(now);
      setIsAutoPaused(offHours);
      setElapsedSeconds((prev) => {
        if (isPaused || offHours) {
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isRunning, isPaused]);

  const startShift = useCallback(() => {
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsAutoPaused(false);
    setIsRunning(true);
  }, []);

  const pauseShift = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeShift = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopShift = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setIsAutoPaused(false);
    const total = elapsedSeconds;
    setElapsedSeconds(0);
    return total;
  }, [elapsedSeconds]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setIsAutoPaused(false);
    setElapsedSeconds(0);
  }, []);

  return {
    elapsedSeconds,
    isRunning,
    isPaused,
    isAutoPaused,
    startShift,
    pauseShift,
    resumeShift,
    stopShift,
    reset,
  };
}
