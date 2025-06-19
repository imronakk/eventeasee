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
import CreateEvent from "./pages/CreateEvent";
import VenueProfile from "./pages/VenueProfile";
import EventDetails from "./pages/EventDetails";
import ArtistProfile from "./pages/ArtistProfile";
import EditArtistProfile from "./pages/EditArtistProfile";
import EditVenueProfile from "./pages/EditVenueProfile";
import Requests from "./pages/Requests";
import VenueRequests from "./pages/VenueRequests";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import About from "./pages/About";
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
              <Route path="/events/:eventId" element={<EventDetails />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/venues/:venueId" element={<VenueProfile />} />
              <Route path="/artist/:artistId" element={<ArtistProfile />} />
              <Route path="/artist/edit/:artistId" element={<EditArtistProfile />} />
              <Route path="/venue/edit/:venueId" element={<EditVenueProfile />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/venue-requests" element={<VenueRequests />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
