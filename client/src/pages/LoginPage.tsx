import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { authService } from '../services/authService';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>();
  const login = useAppStore((s) => s.login);
  const currentUser = useAppStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitError(null);
    try {
      const result = await authService.login({
        email: data.email,
        password: data.password
      });
      
      // Update store with user data including role
      login({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        photoUrl: result.user.profile?.footerImage?.url
      });
      
      navigate('/profile');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to login. Please try again.';
      setSubmitError(message);
    }
  };

  const handleFacebookLogin = () => {
    authService.loginWithFacebook();
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-[#003049]">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="rounded-xl border-2 border-[rgba(0,48,73,0.15)] bg-[#fafafa] px-4 py-3 text-[0.95rem] text-[#003049] placeholder:text-[#a0a0a0] transition-all focus:border-[#669bbc] focus:outline-none focus:ring-4 focus:ring-[#669bbc]/10 focus:bg-white"
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && (
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-[#c1121f]">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-[#003049]">Password</label>
          <button type="button" className="text-xs font-medium text-[#669bbc] hover:text-[#003049] transition-colors">Forgot?</button>
        </div>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          className="rounded-xl border-2 border-[rgba(0,48,73,0.15)] bg-[#fafafa] px-4 py-3 text-[0.95rem] text-[#003049] placeholder:text-[#a0a0a0] transition-all focus:border-[#669bbc] focus:outline-none focus:ring-4 focus:ring-[#669bbc]/10 focus:bg-white"
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && (
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-[#c1121f]">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.password.message}
          </p>
        )}
      </div>

      {submitError && <p className="m-0 rounded-lg bg-red-50 p-3 text-sm font-medium text-[#c1121f] border border-red-200">{submitError}</p>}

      <button 
        className="group relative mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border-0 bg-gradient-to-r from-[#780000] via-[#c1121f] to-[#780000] bg-size-200 px-6 py-3.5 text-[0.95rem] font-semibold text-white shadow-lg transition-all duration-300 hover:bg-pos-100 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100" 
        type="submit" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Login
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgba(0,48,73,0.1)]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-4 text-[#7f7270]">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        className="group inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-[rgba(0,48,73,0.15)] bg-white px-4 py-3 text-[0.95rem] font-medium text-[#003049] transition-all duration-200 hover:border-[#1877F2] hover:bg-[#f8f9fa] hover:shadow-md"
        onClick={handleFacebookLogin}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Continue with Facebook
      </button>
    </form>
  );
};
