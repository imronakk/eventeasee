
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Artists from './pages/Artists';
import Venues from './pages/Venues';
import Events from './pages/Events';
import ArtistDashboard from './pages/ArtistDashboard';
import VenueDashboard from './pages/VenueDashboard';
import AudienceDashboard from './pages/AudienceDashboard';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import BookEventTickets from './pages/BookEventTickets';
import UserTickets from './pages/UserTickets';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout><Outlet /></MainLayout>}>
            <Route index element={<Index />} />
            <Route path="auth" element={<Auth />} />
            <Route path="artists" element={<Artists />} />
            <Route path="venues" element={<Venues />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:eventId/book" element={<BookEventTickets />} />
            <Route path="tickets" element={<UserTickets />} />
            <Route path="dashboard/artist" element={<ArtistDashboard />} />
            <Route path="dashboard/venue" element={<VenueDashboard />} />
            <Route path="dashboard/audience" element={<AudienceDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
