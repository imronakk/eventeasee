
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ArtistDashboard from "./pages/ArtistDashboard";
import VenueDashboard from "./pages/VenueDashboard";
import AudienceDashboard from "./pages/AudienceDashboard";
import Venues from "./pages/Venues";
import Events from "./pages/Events";
import Artists from "./pages/Artists";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/artist-dashboard" element={<ArtistDashboard />} />
              <Route path="/venue-dashboard" element={<VenueDashboard />} />
              <Route path="/audience-dashboard" element={<AudienceDashboard />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/events" element={<Events />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
