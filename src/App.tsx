
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Import pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
            <Route path="/login" element={<NotFound />} />
            <Route path="/register" element={<NotFound />} />
            
            {/* Artist Routes */}
            <Route path="/artists" element={<NotFound />} />
            <Route path="/artists/:id" element={<NotFound />} />
            <Route path="/artist-dashboard" element={<NotFound />} />
            
            {/* Venue Routes */}
            <Route path="/venues" element={<NotFound />} />
            <Route path="/venues/:id" element={<NotFound />} />
            <Route path="/venue-dashboard" element={<NotFound />} />
            
            {/* Event Routes */}
            <Route path="/events" element={<NotFound />} />
            <Route path="/events/:id" element={<NotFound />} />
            <Route path="/events/:id/book" element={<NotFound />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
