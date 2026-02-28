import React, { createContext, useCallback, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { useShiftTimer } from '@/hooks/use-shift-timer';

export type User = {
  id: string;
  name: string;
  role: string;
  department: string;
};

type Summary = {
  todaySeconds: number;
  months: { month: string; seconds: number }[];
  yearSeconds: number;
};

type UserDetail = User & {
  itemsMadeToday?: number;
  summary?: Summary;
};

type AppContextValue = {
  user: User | null;
  userDetail: UserDetail | null;
  summary: Summary | null;
  setUser: (user: User | null) => void;
  refreshUserDetail: () => Promise<void>;
  logout: () => void;
  shift: ReturnType<typeof useShiftTimer>;
};

export const AppContext = createContext<AppContextValue>({
  user: null,
  userDetail: null,
  summary: null,
  setUser: () => {},
  refreshUserDetail: async () => {},
  logout: () => {},
  shift: {
    elapsedSeconds: 0,
    isRunning: false,
    isPaused: false,
    isAutoPaused: false,
    startShift: () => {},
    pauseShift: () => {},
    resumeShift: () => {},
    stopShift: () => 0,
    reset: () => {},
  },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const shift = useShiftTimer();

  const refreshUserDetail = useCallback(async () => {
    if (!user) return;
    const detail = await api.get<UserDetail>(`/users/${user.id}`);
    setUserDetail(detail);
    if (detail.summary) {
      setSummary(detail.summary);
    } else {
      const summaryData = await api.get<Summary>(`/time/${user.id}/summary`);
      setSummary(summaryData);
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setSummary(null);
    setUserDetail(null);
    shift.reset();
  }, [shift]);

  const value = useMemo(
    () => ({
      user,
      userDetail,
      summary,
      setUser,
      refreshUserDetail,
      logout,
      shift,
    }),
    [user, userDetail, summary, refreshUserDetail, logout, shift]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
