import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestOnly } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeacherApplications from './pages/TeacherApplications';
import UserManagement from './pages/UserManagement';
import TaxonomyRequests from './pages/TaxonomyRequests';
import TaxonomyManagement from './pages/TaxonomyManagement';
import SupportTickets from './pages/SupportTickets';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={<GuestOnly><Login /></GuestOnly>}
          />
          <Route
            path="/signup"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/applications"
            element={<ProtectedRoute><TeacherApplications /></ProtectedRoute>}
          />
          <Route
            path="/users"
            element={<ProtectedRoute><UserManagement /></ProtectedRoute>}
          />
          <Route
            path="/taxonomy-requests"
            element={<ProtectedRoute><TaxonomyRequests /></ProtectedRoute>}
          />
          <Route
            path="/taxonomy"
            element={<ProtectedRoute><TaxonomyManagement /></ProtectedRoute>}
          />
          <Route
            path="/support-tickets"
            element={<ProtectedRoute><SupportTickets /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
