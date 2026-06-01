import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import { ProtectedRoute, GuestOnly } from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
import Landing from './pages/Landing';
import RoleSelect from './pages/RoleSelect';
import Signup from './pages/Signup';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import QuizTake from './pages/QuizTake';
import QuizResult from './pages/QuizResult';
import Notifications from './pages/Notifications';
import About from './pages/About';
import Contact from './pages/Contact';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages — dedicated layout, no marketing chrome */}
          <Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />

          <Route element={<Layout />}>
            <Route path="/" element={<AuthRedirect><Landing /></AuthRedirect>} />
            <Route path="/get-started" element={<GuestOnly><RoleSelect /></GuestOnly>} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/quiz/:id" element={<ProtectedRoute role="student"><QuizTake /></ProtectedRoute>} />
            <Route path="/student/result/:id" element={<ProtectedRoute role="student"><QuizResult /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute role="student"><Notifications /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
