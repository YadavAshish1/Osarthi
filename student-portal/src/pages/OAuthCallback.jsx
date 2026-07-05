import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { completeOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      completeOAuth(token).then((user) => {
        if (user?.role === 'teacher') navigate('/teacher');
        else if (user?.role === 'student') navigate('/student');
        else navigate('/');
      });
    } else {
      navigate('/login?error=oauth');
    }
  }, [params, completeOAuth, navigate]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  );
}
