export const mockDashboardData = {
  user: {
    name: "Ananya Sharma",
    avatar: "https://i.pravatar.cc/150?img=5",
    streak: 0,
    maxStreak: 0,
    progress: 0,
    totalQuizzes: 100,
    completedQuizzes: 0,
  },
  dailyGoal: {
    completed: 0,
    total: 3,
  },
  lastQuiz: null,
  availableQuizzesCount: 48,
  recentAttempts: [],
  performanceStats: {
    quizzesAttempted: 0,
    averageScore: 0,
    accuracy: 0,
    timeSpent: "0h 0m",
  },
  chartData: [],
  notifications: [
    {
      id: 1,
      text: "Welcome to QuizGen AI! Start your first quiz today.",
      time: "Just now",
      iconType: "star",
    },
  ],
};
