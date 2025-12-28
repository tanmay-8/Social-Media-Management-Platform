import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { loginUser } from '../services/auth';

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
      const user = await loginUser({
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
        err instanceof Error ? err.message : 'Unable to login. Please try again.';
      setSubmitError(message);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Plug actual Google OAuth flow here
    login({
      id: 'google-user',
      name: 'Google User'
    });
    navigate('/profile');
  };

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && (
          <p className="field-error">{errors.email.message}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && (
          <p className="field-error">{errors.password.message}</p>
        )}
      </div>

      {submitError && <p className="field-error">{submitError}</p>}

      <button className="btn primary w-full" type="submit" disabled={isSubmitting}>
        Login
      </button>

      <div className="divider">
        <span>or</span>
      </div>

      <button
        type="button"
        className="btn ghost w-full"
        onClick={handleGoogleSignup}
      >
        Continue with Google
      </button>
    </form>
  );
};


