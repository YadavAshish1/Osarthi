import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getApiRoot } from '../config/api';

export default function ApiStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(getApiRoot('/api/health'), { credentials: 'include' });
        if (!cancelled) setOffline(!res.ok);
      } catch {
        if (!cancelled) setOffline(true);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!offline) return null;

  const hint = import.meta.env.DEV
    ? 'Run npm start in the backend folder (port 5000).'
    : 'Check that your Render backend is running.';

  return (
    <div className="bg-amber-600/90 px-4 py-2 text-center text-sm text-white">
      <AlertTriangle className="inline h-4 w-4 mr-2 -mt-0.5" />
      Backend is not reachable. {hint}
    </div>
  );
}
