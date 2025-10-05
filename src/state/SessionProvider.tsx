import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Goal, Protocol, SessionContext } from '../types';
import { addSession, updateModel } from './storage';

const SessionCtx = createContext<SessionContext | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [protocol, setProtocolState] = useState<Protocol | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const setProtocol = (p: Protocol, d: number) => {
    setProtocolState(p);
    setDuration(d);
  };

  const saveRating = (delta: -1 | 0 | 1) => {
    if (!goal || !protocol) return;

    const record = {
      dateISO: new Date().toISOString(),
      goal,
      protocolId: protocol.id,
      seconds: duration,
      delta
    };

    addSession(record);
    updateModel(protocol.id, delta, duration);
  };

  const reset = () => {
    setGoal(null);
    setProtocolState(null);
    setDuration(0);
  };

  return (
    <SessionCtx.Provider value={{ goal, protocol, duration, setGoal, setProtocol, saveRating, reset }}>
      {children}
    </SessionCtx.Provider>
  );
}

export function useSession(): SessionContext {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
