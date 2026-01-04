import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { authService } from '../services/authService';
import { Loader2 } from 'lucide-react';

export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login?error=' + error);
        return;
      }

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const result = await authService.handleOAuthCallback(token);
        
        login({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          facebookId: result.user.facebookId,
          photoUrl: result.user.profile?.footerImage?.url
        });
        
        navigate('/profile');
      } catch (err) {
        console.error('OAuth callback error:', err);
        navigate('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdf0d5] via-white to-[#fffaf0]">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#669bbc]" />
        <p className="mt-4 text-lg text-[#003049]">Completing login...</p>
      </div>
    </div>
  );
};
