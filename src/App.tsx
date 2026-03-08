import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TrainingProvider } from "@/contexts/TrainingContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProgramPage from "./pages/ProgramPage";
import ProgramManagerPage from "./pages/ProgramManagerPage";
import ProgramGenerator from "./pages/ProgramGenerator";
import LeaderboardPage from "./pages/LeaderboardPage";
import WorkoutPage from "./pages/WorkoutPage";
import AppModeWorkout from "./pages/AppModeWorkout";
import AnalyticsPage from "./pages/AnalyticsPage";
import CoachPage from "./pages/CoachPage";
import ProfilePage from "./pages/ProfilePage";
import PlateCalculator from "./pages/PlateCalculator";
import RankingsPage from "./pages/RankingsPage";
import GymPage from "./pages/GymPage";
import RivalsPage from "./pages/RivalsPage";
import PowerScorePage from "./pages/PowerScorePage";
import PredictorPage from "./pages/PredictorPage";
import AchievementsPage from "./pages/AchievementsPage";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import SocialFeedPage from "./pages/SocialFeedPage";
import DiscoverPage from "./pages/DiscoverPage";
import AthleteProfilePage from "./pages/AthleteProfilePage";
import AuthPage from "./pages/AuthPage";
import InstallPage from "./pages/InstallPage";
import StreakLeaderboardPage from "./pages/StreakLeaderboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <TrainingProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/programs" element={<ProgramManagerPage />} />
          <Route path="/generate" element={<ProgramGenerator />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/train" element={<AppModeWorkout />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/gym" element={<GymPage />} />
          <Route path="/rivals" element={<RivalsPage />} />
          <Route path="/powerscore" element={<PowerScorePage />} />
          <Route path="/predictor" element={<PredictorPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/feed" element={<SocialFeedPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/athlete/:userId" element={<AthleteProfilePage />} />
          <Route path="/plates" element={<PlateCalculator />} />
          <Route path="/streaks" element={<StreakLeaderboardPage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </TrainingProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/install" element={<InstallPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
