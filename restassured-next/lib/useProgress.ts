"use client";
import { useState, useEffect, useCallback } from "react";

type State = {
  completed: Record<string, boolean>;
  xp: number;
};

const KEY = "ra-next-state-v1";

export function useProgress() {
  const [state, setState] = useState<State>({ completed: {}, xp: 0 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setState(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const complete = useCallback((id: string) => {
    setState((s) => {
      if (s.completed[id]) return s;
      return { ...s, completed: { ...s.completed, [id]: true }, xp: s.xp + 100 };
    });
  }, []);

  const addXp = useCallback((amount: number) => {
    setState((s) => ({ ...s, xp: s.xp + amount }));
  }, []);

  const reset = useCallback(() => {
    setState({ completed: {}, xp: 0 });
  }, []);

  return { state, complete, addXp, reset, hydrated };
}
