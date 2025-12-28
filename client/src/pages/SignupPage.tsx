import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { signupUser } from '../services/auth';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
}

export const SignupPage = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignupFormValues>();
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();

  const onSubmit = async (data: SignupFormValues) => {
    setSubmitError(null);
    try {
      const user = await signupUser({
        name: data.name,
        email: data.email,
        password: data.password
      });
      login({
        id: user.id,
        name: user.name
      });
      navigate('/profile');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to create account. Please try again.';
      setSubmitError(message);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Plug Google OAuth here
    login({
      id: 'google-user',
      name: 'Google User'
    });
    navigate('/profile');
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-[#003049]">Full Name</label>
        <input
          id="name"
          placeholder="John Doe"
          className="rounded-xl border-2 border-[rgba(0,48,73,0.15)] bg-[#fafafa] px-4 py-3 text-[0.95rem] text-[#003049] placeholder:text-[#a0a0a0] transition-all focus:border-[#669bbc] focus:outline-none focus:ring-4 focus:ring-[#669bbc]/10 focus:bg-white"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && (
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-[#c1121f]">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.name.message}
          </p>
        )}
      </div>

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
        <label htmlFor="password" className="text-sm font-medium text-[#003049]">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Create a strong password"
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
            Creating account...
          </>
        ) : (
          <>
            Create Account
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
        className="group inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-[rgba(0,48,73,0.15)] bg-white px-4 py-3 text-[0.95rem] font-medium text-[#003049] transition-all duration-200 hover:border-[#669bbc] hover:bg-[#f8f9fa] hover:shadow-md"
        onClick={handleGoogleSignup}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    </form>
  );
};


