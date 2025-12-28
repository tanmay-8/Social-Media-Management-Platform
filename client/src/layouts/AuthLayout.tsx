import { Outlet, NavLink } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Social Media Automation</h1>
          <p>Auto-generate festival posts tailored to your audience.</p>
        </header>
        <nav className="auth-tabs">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? 'auth-tab active' : 'auth-tab'
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/signup"
            className={({ isActive }) =>
              isActive ? 'auth-tab active' : 'auth-tab'
            }
          >
            Signup
          </NavLink>
        </nav>
        <Outlet />
      </div>
    </div>
  );
};





