import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ApiStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/health', { credentials: 'include' });
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

  return (
    <div className="bg-amber-600/90 px-4 py-2 text-center text-sm text-white">
      <AlertTriangle className="inline h-4 w-4 mr-2 -mt-0.5" />
      Backend is not reachable. Run <code className="rounded bg-black/20 px-1">npm start</code> in the{' '}
      <code className="rounded bg-black/20 px-1">backend</code> folder (port 5000).
    </div>
  );
}
