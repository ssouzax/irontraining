import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import LandingPage from "./pages/LandingPage";
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

import BodyCompositionPage from "./pages/BodyCompositionPage";
import PRSimulatorPage from "./pages/PRSimulatorPage";
import RecoveryPage from "./pages/RecoveryPage";
import CoTrainingPage from "./pages/CoTrainingPage";
import BarVelocityPage from "./pages/BarVelocityPage";
import WearablePage from "./pages/WearablePage";
import Replay3DPage from "./pages/Replay3DPage";
import ExecutionGradingPage from "./pages/ExecutionGradingPage";
import SubscribePage from "./pages/SubscribePage";
import ShopPage from "./pages/ShopPage";
import PremiumContentPage from "./pages/PremiumContentPage";
import AdminPage from "./pages/AdminPage";
import DietPage from "./pages/DietPage";
import InfluencerPage from "./pages/InfluencerPage";
import GroupsPage from "./pages/GroupsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import TrainingNotesPage from "./pages/TrainingNotesPage";
import NotFound from "./pages/NotFound";
import OnboardingTutorial from "./components/OnboardingTutorial";
import { useState } from "react";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('iron_onboarding_done');
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (showOnboarding) {
    return (
      <OnboardingTutorial onComplete={() => {
        localStorage.setItem('iron_onboarding_done', 'true');
        setShowOnboarding(false);
      }} />
    );
  }

  return (
    <TrainingProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/programs" element={<ProgramManagerPage />} />
          <Route path="/generate" element={<PremiumGate requiredTier="basic" feature="Gerar Programa"><ProgramGenerator /></PremiumGate>} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/train" element={<AppModeWorkout />} />
          <Route path="/analytics" element={<PremiumGate requiredTier="basic" feature="Análises"><AnalyticsPage /></PremiumGate>} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/gym" element={<GymPage />} />
          <Route path="/rivals" element={<RivalsPage />} />
          <Route path="/powerscore" element={<PremiumGate requiredTier="standard" feature="Power Score"><PowerScorePage /></PremiumGate>} />
          <Route path="/predictor" element={<PremiumGate requiredTier="basic" feature="Preditor IA"><PredictorPage /></PremiumGate>} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/feed" element={<SocialFeedPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/athlete/:userId" element={<AthleteProfilePage />} />
          <Route path="/plates" element={<PlateCalculator />} />
          <Route path="/streaks" element={<StreakLeaderboardPage />} />
          <Route path="/coach" element={<PremiumGate requiredTier="premium" feature="Coach IA"><CoachPage /></PremiumGate>} />
          
          <Route path="/body" element={<BodyCompositionPage />} />
          <Route path="/prsimulator" element={<PremiumGate requiredTier="standard" feature="Simulador PR"><PRSimulatorPage /></PremiumGate>} />
          <Route path="/recovery" element={<PremiumGate requiredTier="standard" feature="Recuperação"><RecoveryPage /></PremiumGate>} />
          <Route path="/cotraining" element={<CoTrainingPage />} />
          <Route path="/barvelocity" element={<PremiumGate requiredTier="premium" feature="Velocidade da Barra"><BarVelocityPage /></PremiumGate>} />
          <Route path="/wearable" element={<PremiumGate requiredTier="premium" feature="Wearable"><WearablePage /></PremiumGate>} />
          <Route path="/replay3d" element={<PremiumGate requiredTier="premium" feature="Replay 3D"><Replay3DPage /></PremiumGate>} />
          <Route path="/grading" element={<PremiumGate requiredTier="basic" feature="Notas de Execução"><ExecutionGradingPage /></PremiumGate>} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/premium-content" element={<PremiumGate requiredTier="premium" feature="Conteúdo Premium"><PremiumContentPage /></PremiumGate>} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/diet" element={<PremiumGate requiredTier="premium" feature="Dieta IA"><DietPage /></PremiumGate>} />
          <Route path="/influencer" element={<InfluencerPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/training-notes" element={<TrainingNotesPage />} />
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
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/install" element={<InstallPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
