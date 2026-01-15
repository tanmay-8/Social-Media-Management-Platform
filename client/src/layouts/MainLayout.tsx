import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Sparkles } from 'lucide-react';

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
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#003049] via-[#002139] to-[#00182a] px-6 py-4 shadow-lg backdrop-blur-sm">
        <div className="flex cursor-pointer items-center gap-3 transition-transform hover:scale-105" onClick={() => navigate('/')}>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c1121f] to-[#780000] shadow-lg ring-2 ring-white/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Social Automation</span>
        </div>
        {user && (
          <button
            type="button"
            className="group inline-flex cursor-pointer items-center gap-3 rounded-xl border-0 bg-white/10 px-4 py-2 backdrop-blur-sm transition-all hover:bg-white/20"
            onClick={() => setIsPanelOpen(true)}
            aria-label="Account menu"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#c1121f] to-[#780000] text-sm font-semibold text-white shadow-md ring-2 ring-white/30">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="hidden text-sm font-medium text-white sm:block">{user.name}</span>
            <svg className="h-4 w-4 text-white/70 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </header>

      <main className="flex-1 overflow-auto bg-gradient-cream p-6 md:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-600">
            © 2026 Social Automation. All rights reserved.
          </p>
          <div className="flex gap-6">
            <NavLink
              to="/terms-of-service"
              className="text-sm text-[#669bbc] hover:text-[#003049] transition-colors"
            >
              Terms of Service
            </NavLink>
            <NavLink
              to="/privacy-policy"
              className="text-sm text-[#669bbc] hover:text-[#003049] transition-colors"
            >
              Privacy Policy
            </NavLink>
          </div>
        </div>
      </footer>

      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={closePanel}>
          <aside
            className="flex h-full w-80 max-w-[85vw] flex-col gap-6 bg-white p-6 shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="m-0 text-lg font-bold text-[#003049]">Account Settings</h3>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                onClick={closePanel}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] p-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#c1121f] to-[#780000] text-base font-semibold text-white shadow-md">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="m-0 font-semibold text-[#003049]">{user?.name}</p>
                <p className="m-0 text-xs text-gray-500">Active Account</p>
              </div>
            </div>
            
            <nav className="flex flex-1 flex-col gap-2">
              <NavLink
                to="/profile"
                className="group flex items-center gap-3 rounded-xl border-0 bg-transparent px-4 py-3 text-left text-[0.95rem] font-medium text-[#003049] no-underline transition-all hover:bg-[#f8f9fa]"
                onClick={closePanel}
              >
                <svg className="h-5 w-5 text-[#669bbc] transition-colors group-hover:text-[#003049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Update Profile
              </NavLink>
              <NavLink
                to="/subscription"
                className="group flex items-center gap-3 rounded-xl border-0 bg-transparent px-4 py-3 text-left text-[0.95rem] font-medium text-[#003049] no-underline transition-all hover:bg-[#f8f9fa]"
                onClick={closePanel}
              >
                <svg className="h-5 w-5 text-[#669bbc] transition-colors group-hover:text-[#003049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Subscription
              </NavLink>
              
              {/* Admin Link - Only visible to admins */}
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className="group flex items-center gap-3 rounded-xl border-0 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 text-left text-[0.95rem] font-medium text-purple-700 no-underline transition-all hover:from-purple-100 hover:to-blue-100"
                  onClick={closePanel}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin Panel
                </NavLink>
              )}
              
              <button
                type="button"
                className="group mt-auto flex items-center gap-3 rounded-xl border-0 bg-red-50 px-4 py-3 text-left text-[0.95rem] font-medium text-[#c1121f] transition-all hover:bg-red-100"
                onClick={handleLogout}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};


