'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlexTimeShinyButton } from '../../src/components/ui/FlexTimeShinyButton';
import { FTLogo } from '../../src/components/ui/FTLogo';
import { FlexTimeThemeToggle } from '../../src/components/ui/FlexTimeThemeToggle';
import { SignInModal } from '../../src/components/ui/SignInModal';

// Glassmorphic navbar component for FlexTime
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const pathname = usePathname();

  // Ensure component is mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect for glassmorphic transparency
  useEffect(() => {
    if (!mounted) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  // Menu items with corresponding routes
  const menuItems = [
    { label: 'HOME', path: '/dashboard' },
    { label: 'FT BUILDER', path: '/schedule-builder' },
    { label: 'BIG 12 SPORTS', path: '/sports' },
    { label: 'BIG 12 SCHOOLS', path: '/schools' },
    { label: 'INSIDE THE 12', path: '/teams' },
    { label: 'VECTOR SEARCH', path: '/vector-search' },
  ];

  // Prevent hydration mismatch by not rendering dynamic content until mounted
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 h-[72px]">
        <div className="max-w-7xl mx-auto px-8 py-4">
          {/* Placeholder for navbar content during SSR */}
        </div>
      </nav>
    );
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${  
        isScrolled 
          ? 'ft-glass-card shadow-[0_8px_32px_rgba(0,0,0,0.12)]' 
          : 'bg-transparent'
      }`}
      style={{
        borderBottom: isScrolled 
          ? '4px solid rgba(0, 191, 255, 1)' 
          : '2px solid rgba(0, 191, 255, 0.4)',
        boxShadow: isScrolled 
          ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 8px 30px rgba(0, 191, 255, 0.7), 0 20px 50px -10px rgba(0, 191, 255, 0.9), inset 0 -6px 30px rgba(0, 191, 255, 0.5)' 
          : '0 4px 20px rgba(0, 191, 255, 0.25), 0 8px 25px -5px rgba(0, 191, 255, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated neon border effect - moved to nav container */}
      {mounted && (
        <div 
          className="absolute inset-x-0 bottom-0 h-1 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--ft-neon), transparent)',
            opacity: isScrolled ? 1 : 0.6,
            animation: 'slideGlow 3s linear infinite',
            filter: 'blur(2px)'
          }}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div 
          className="flex items-center justify-between text-white"
          data-component-name="Navbar"
          style={{
            padding: '1rem 2rem',
            borderRadius: 'var(--ft-radius-xl)',
            background: isScrolled ? 'var(--ft-glass-primary)' : 'transparent',
            border: 'none',
            boxShadow: isScrolled 
              ? 'var(--ft-shadow-card)' 
              : 'none',
            backdropFilter: isScrolled ? 'blur(20px) saturate(1.8)' : 'none',
            transition: 'var(--ft-transition-smooth)',
            position: 'relative',
            overflow: 'hidden',
            color: 'white'
          }}>
          
          {/* Logo and brand */}
          <Link href="/" className="flex items-center gap-2 relative z-10">
            <div className="flex items-center">
              <FTLogo 
                variant="black" 
                size="sm" 
                alt="FlexTime Logo"
                showText
                className="flex items-center dark:hidden"
              />
              <FTLogo 
                variant="white" 
                size="sm" 
                alt="FlexTime Logo"
                showText
                className="hidden dark:flex items-center"
              />
            </div>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex relative z-10">
            <div className="ft-nav-pills-container">
              {menuItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`ft-nav-pill ${pathname === item.path ? 'active' : ''}`}
                  style={{
                    fontFamily: 'var(--ft-font-secondary)',
                    fontWeight: 'var(--ft-weight-semibold)',
                    fontSize: '0.875rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User menu */}
          <div className="hidden md:flex items-center space-x-4 relative z-10">
            <FlexTimeThemeToggle />
            
            <FlexTimeShinyButton 
              variant="glass" 
              className="text-sm flex items-center gap-2 px-4 py-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              SETTINGS
            </FlexTimeShinyButton>
            
            <FlexTimeShinyButton 
              variant="neon" 
              className="text-sm flex items-center gap-2 px-4 py-2"
              onClick={() => setIsSignInOpen(true)}
              data-component-name="Navbar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              SIGN IN
            </FlexTimeShinyButton>
          </div>

          {/* Mobile menu button */}
          <FlexTimeShinyButton
            variant="secondary" 
            className="md:hidden p-2 !min-w-0 !min-h-0 relative z-10" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              )}
            </svg>
          </FlexTimeShinyButton>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 animate-fadeIn ft-glass-card rounded-2xl p-4 border border-white/10">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`ft-list-item ${pathname === item.path ? 'border-l-2 border-accent' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="ft-list-item-content">
                  <span 
                    className={`ft-list-item-title ${pathname === item.path ? 'text-accent' : ''}`}
                    style={{
                      fontFamily: 'var(--ft-font-secondary)',
                      fontWeight: 'var(--ft-weight-semibold)',
                      fontSize: '0.875rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
            <div className="pt-4 flex flex-col space-y-3">
              <FlexTimeShinyButton 
                variant="glass" 
                className="text-sm flex items-center gap-2 justify-center w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                SETTINGS
              </FlexTimeShinyButton>
              <FlexTimeShinyButton 
                variant="neon" 
                className="text-sm flex items-center gap-2 justify-center w-full"
                onClick={() => {
                  setIsSignInOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                SIGN IN
              </FlexTimeShinyButton>
            </div>
          </div>
        )}
      </div>
      
      {/* Sign In Modal */}
      <SignInModal 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)} 
      />
    </nav>
  );
}