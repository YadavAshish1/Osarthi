import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ApiStatusBanner from './ApiStatusBanner';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ApiStatusBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
