import React, { createContext, useContext, useState } from 'react';

export type WeeklySummary = {
  weekEnding: string;
  totalJobs: number;
  totalEarned: number;
  unpaidJobs: number;
};

type WeeklyDataContextType = {
  weeklyData: WeeklySummary[];
  setWeeklyData: React.Dispatch<React.SetStateAction<WeeklySummary[]>>;
};

const WeeklyDataContext = createContext<WeeklyDataContextType | undefined>(undefined);

export const WeeklyDataProvider: React.FC = ({ children }) => {
  const [weeklyData, setWeeklyData] = useState<WeeklySummary[]>([]);
  return (
    <WeeklyDataContext.Provider value={{ weeklyData, setWeeklyData }}>
      {children}
    </WeeklyDataContext.Provider>
  );
};

export const useWeeklyData = () => {
  const context = useContext(WeeklyDataContext);
  if (!context) {
    throw new Error('useWeeklyData must be used within a WeeklyDataProvider');
  }
  return context;
};
