
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/layouts/MainLayout";

// Import pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ArtistDashboard from "./pages/ArtistDashboard";
import VenueDashboard from "./pages/VenueDashboard";
import AudienceDashboard from "./pages/AudienceDashboard";
import Profile from "./pages/Profile";
import Venues from "./pages/Venues";
import Artist from "./pages/Artist";
import Artists from "./pages/Artists";
import Events from "./pages/Events";

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div className="w-3 h-3 bg-primary rounded-full"></div>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />

              {/* Dashboard Routes wrapped with MainLayout */}
              <Route 
                path="/artist-dashboard" 
                element={
                  <MainLayout>
                    <ProtectedRoute allowedRoles={['artist']}>
                      <ArtistDashboard />
                    </ProtectedRoute>
                  </MainLayout>
                } 
              />
              <Route 
                path="/venue-dashboard" 
                element={
                  <MainLayout>
                    <ProtectedRoute allowedRoles={['venue_owner']}>
                      <VenueDashboard />
                    </ProtectedRoute>
                  </MainLayout>
                } 
              />
              <Route 
                path="/audience-dashboard" 
                element={
                  <MainLayout>
                    <ProtectedRoute allowedRoles={['audience']}>
                      <AudienceDashboard />
                    </ProtectedRoute>
                  </MainLayout>
                } 
              />
              
              {/* Artist Routes wrapped with MainLayout */}
              <Route 
                path="/artists" 
                element={
                  <MainLayout>
                    <Artists />
                  </MainLayout>
                } 
              />
              <Route 
                path="/artists/:id" 
                element={
                  <MainLayout>
                    <Artist />
                  </MainLayout>
                } 
              />
              
              {/* Venue Routes wrapped with MainLayout */}
              <Route 
                path="/venues" 
                element={
                  <MainLayout>
                    <Venues />
                  </MainLayout>
                } 
              />
              <Route 
                path="/venues/:id" 
                element={
                  <MainLayout>
                    <NotFound />
                  </MainLayout>
                } 
              />
              
              {/* Event Routes wrapped with MainLayout */}
              <Route 
                path="/events" 
                element={
                  <MainLayout>
                    <Events />
                  </MainLayout>
                } 
              />
              <Route 
                path="/events/:id" 
                element={
                  <MainLayout>
                    <NotFound />
                  </MainLayout>
                } 
              />
              <Route 
                path="/events/:id/book" 
                element={
                  <MainLayout>
                    <ProtectedRoute>
                      <NotFound />
                    </ProtectedRoute>
                  </MainLayout>
                } 
              />
              
              {/* User Profile wrapped with MainLayout */}
              <Route 
                path="/profile" 
                element={
                  <MainLayout>
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  </MainLayout>
                } 
              />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
