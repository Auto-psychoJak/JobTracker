export type WeeklySummary = {
    weekEnding: string;
    totalJobs: number;
    totalEarned: number;
    unpaidJobs: number;
  };
  export type RootStackParamList = {
    Home: undefined; // No parameters for the Home screen
    WeeklySummary: { weeklyData: any }; // WeeklySummary expects weeklyData
  };
  