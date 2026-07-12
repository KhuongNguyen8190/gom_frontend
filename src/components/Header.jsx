import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-900/50">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-wider text-white">
              GOM <span className="text-cyan-400 font-extrabold text-base">BADMINTON</span>
            </span>
          </Link>

          {/* Navigation Links - Chỉ dành cho khách */}
          <nav className="flex items-center space-x-2 text-xs font-bold sm:text-sm">
            <Link 
              to="/" 
              className={`rounded-xl px-4 py-2 transition-all duration-200 ${isActive('/') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              Đặt lịch
            </Link>
            <Link 
              to="/tra-cuu" 
              className={`rounded-xl px-4 py-2 transition-all duration-200 ${isActive('/tra-cuu') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              Tra cứu
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}