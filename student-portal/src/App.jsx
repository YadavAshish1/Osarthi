import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentPortal from './pages/StudentPortal';
import PublicBlogReader from './pages/PublicBlogReader';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root → Explore */}
        <Route path="/" element={<Navigate to="/explore" replace />} />

        {/* Public student portal — no auth needed */}
        <Route path="/explore" element={<StudentPortal />} />
        <Route path="/explore/blog/:id" element={<PublicBlogReader />} />

        {/* Catch-all → Explore */}
        <Route path="*" element={<Navigate to="/explore" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
