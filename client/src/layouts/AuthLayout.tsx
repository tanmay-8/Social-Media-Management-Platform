import { Outlet, NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-cream px-6 py-12">
      <div className="w-full max-w-[520px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c1121f] to-[#780000] shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <div className="rounded-3xl border border-[rgba(0,48,73,0.08)] bg-white/95 p-8 shadow-elegant backdrop-blur-sm">
          <header className="mb-8 text-center">
            <h1 className="m-0 mb-3 text-3xl font-bold tracking-tight text-[#003049]">Welcome Back</h1>
            <p className="m-0 text-[0.95rem] leading-relaxed text-[#669bbc]">Auto-generate stunning festival posts for your audience</p>
          </header>
          
          <nav className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-gradient-to-r from-[#f5d9c7] to-[#f8e4d0] p-1.5">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive 
                  ? 'rounded-xl py-2.5 px-4 text-center text-sm font-semibold no-underline bg-gradient-to-r from-[#c1121f] to-[#8b0000] text-white shadow-lg transition-all duration-300' 
                  : 'rounded-xl py-2.5 px-4 text-center text-sm font-medium no-underline text-[#780000] hover:bg-white/50 transition-all duration-200'
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/signup"
              className={({ isActive }) =>
                isActive 
                  ? 'rounded-xl py-2.5 px-4 text-center text-sm font-semibold no-underline bg-gradient-to-r from-[#c1121f] to-[#8b0000] text-white shadow-lg transition-all duration-300' 
                  : 'rounded-xl py-2.5 px-4 text-center text-sm font-medium no-underline text-[#780000] hover:bg-white/50 transition-all duration-200'
              }
            >
              Signup
            </NavLink>
          </nav>
          
          <Outlet />
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex gap-4">
            <NavLink
              to="/terms-of-service"
              className="text-xs text-[#669bbc] hover:text-[#003049] transition-colors"
            >
              Terms of Service
            </NavLink>
            <NavLink
              to="/privacy-policy"
              className="text-xs text-[#669bbc] hover:text-[#003049] transition-colors"
            >
              Privacy Policy
            </NavLink>
          </div>
          <p className="text-center text-xs text-[#7f7270]">© 2026 Social Automation. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};





