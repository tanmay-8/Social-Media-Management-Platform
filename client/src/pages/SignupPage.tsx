import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { signupUser } from '../services/auth';

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
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-field">
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          placeholder="Your name"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>

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
          placeholder="Create a password"
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && (
          <p className="field-error">{errors.password.message}</p>
        )}
      </div>

      {submitError && <p className="field-error">{submitError}</p>}

      <button className="btn primary w-full" type="submit" disabled={isSubmitting}>
        Create account
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


