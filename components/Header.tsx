import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';

const Header = () => {
  const { profile, signOut } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    // The ProtectedRoute component will handle the redirect.
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Also check if the click was on the toggle button itself
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle && !mobileMenuToggle.contains(event.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navLinks = (
    <>
      <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors block px-4 py-2 lg:p-0">Dashboard</Link>
      <Link to="/modules" className="text-gray-300 hover:text-white transition-colors block px-4 py-2 lg:p-0">Modules</Link>
      {profile?.role === 'admin' && (
        <Link to="/admin/modules" className="text-gray-300 hover:text-white transition-colors block px-4 py-2 lg:p-0">Manage Modules</Link>
      )}
    </>
  );

  return (
    <header className="bg-neutral-900/50 backdrop-blur-sm p-4 sticky top-0 z-50 animate-fade-in-up">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src="https://cdn.jsdelivr.net/gh/ginting719/Audio/LOGO-01.png" alt="Alpro Learning Hour Logo" className="h-8 w-auto" />
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Alpro Learning Hour
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks}
          <div className="relative" ref={userDropdownRef}>
            <button 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
              className="flex items-center gap-2 pl-1 pr-3 py-1 border-2 border-primary rounded-full hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-primary"
              aria-haspopup="true"
              aria-expanded={isUserDropdownOpen}
            >
              <Avatar name={profile?.full_name || 'User'} />
              <span className="text-gray-300 font-medium">Hi, {profile?.full_name || 'User'}!</span>
            </button>

            {isUserDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-neutral-800/80 backdrop-blur-md rounded-md shadow-lg border border-neutral-700 py-1 origin-top-right animate-fade-in-up"
                style={{ animationDuration: '150ms' }}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                <button
                  onClick={handleSignOut}
                  role="menuitem"
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <button 
            id="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-300 hover:text-white focus:outline-none"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" ref={mobileMenuRef} className="lg:hidden mt-4 bg-neutral-800/60 backdrop-blur-lg rounded-lg border border-neutral-700 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
          <nav className="flex flex-col gap-2 p-2">
            {navLinks}
            <div className="border-t border-neutral-700 mt-2 pt-2 px-4 py-2">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar name={profile?.full_name || 'User'} size={32}/>
                    <span className="text-gray-200 font-medium">Hi, {profile?.full_name || 'User'}!</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors p-2 rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Logout
                </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;