import { useState, useEffect, useRef, useCallback } from 'react';

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // AudioContext not available
  }
}

export function useRestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  /** Key identifying which set triggered this rest (e.g. "exerciseIdx-setIdx"). */
  const [triggerKey, setTriggerKey] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (duration: number, key?: string) => {
      clear();
      setSeconds(duration);
      setTotalSeconds(duration);
      setTriggerKey(key ?? null);
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clear();
            setIsRunning(false);
            playBeep();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    },
    [clear],
  );

  const stop = useCallback(() => {
    clear();
    setIsRunning(false);
    setSeconds(0);
    setTotalSeconds(0);
    setTriggerKey(null);
  }, [clear]);

  useEffect(() => () => clear(), [clear]);

  return { seconds, totalSeconds, isRunning, triggerKey, start, stop };
}
