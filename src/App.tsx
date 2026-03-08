import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TrainingProvider } from "@/contexts/TrainingContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProgramPage from "./pages/ProgramPage";
import WorkoutPage from "./pages/WorkoutPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CoachPage from "./pages/CoachPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TrainingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/program" element={<ProgramPage />} />
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/coach" element={<CoachPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TrainingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
