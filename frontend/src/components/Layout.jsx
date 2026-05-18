import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full bg-surface-light dark:bg-surface-dark shadow-sm py-4 px-6 flex items-center justify-between transition-colors duration-200">
        <Link to="/" className="flex items-center gap-2 text-brand font-bold text-2xl tracking-tight">
          <img 
            src="/logo.svg" 
            alt="question.io logo" 
            className="w-8 h-8 object-contain bg-slate-200 dark:bg-slate-700 rounded-md" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-8 h-8 bg-brand text-white items-center justify-center rounded-lg font-black text-lg">
            q
          </div>
          <span>question.io</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            title="Змінити тему"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated && user && !user.isGuest ? (
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-brand dark:hover:text-brand transition-colors hidden md:block">
                {user.name}
              </Link>
              <button onClick={logout} className="text-sm font-medium text-red-500 hover:underline">
                Вийти
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-semibold bg-brand text-white px-4 py-2 rounded-full hover:bg-brand-hover transition-colors shadow-md"
            >
              Увійти
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}