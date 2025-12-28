import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

export const MainLayout = () => {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closePanel = () => setIsPanelOpen(false);

  return (
    <div className="app-shell no-sidebar">
      <header className="topbar">
        <div className="topbar-left" onClick={() => navigate('/')}>
          <span className="app-logo">✨</span>
          <span className="topbar-title">Social Automation</span>
        </div>
        {user && (
          <button
            type="button"
            className="avatar-button"
            onClick={() => setIsPanelOpen(true)}
            aria-label="Account menu"
          >
            <div className="avatar">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </button>
        )}
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      {isPanelOpen && (
        <div className="drawer-backdrop" onClick={closePanel}>
          <aside
            className="drawer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="drawer-header">
              <h3>Account</h3>
            </div>
            <nav className="drawer-nav">
              <NavLink
                to="/profile"
                className="drawer-link"
                onClick={closePanel}
              >
                Update profile
              </NavLink>
              <NavLink
                to="/subscription"
                className="drawer-link"
                onClick={closePanel}
              >
                Subscription
              </NavLink>
              <button
                type="button"
                className="drawer-link danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </nav>
            <button
              type="button"
              className="btn ghost w-full"
              onClick={closePanel}
            >
              Close
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};


