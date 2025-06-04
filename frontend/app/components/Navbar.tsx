'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlexTimeShinyButton } from '../../src/components/ui/FlexTimeShinyButton';
import { FTLogo } from '../../src/components/ui/FTLogo';
import { FlexTimeThemeToggle } from '../../src/components/ui/FlexTimeThemeToggle';

// Glassmorphic navbar component for FlexTime
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect for glassmorphic transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Menu items with corresponding routes
  const menuItems = [
    { label: 'Home', path: '/dashboard' },
    { label: 'FT Builder', path: '/schedule-builder' },
    { label: 'Big 12 Sports', path: '/sports' },
    { label: 'Analytics', path: '/analytics' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-cyan-900/30 shadow-[0_2px_20px_rgba(0,191,255,0.4)]' 
          : 'bg-transparent shadow-[0_2px_15px_rgba(0,191,255,0.3)]'
      }`}
    >
      <div className="max-w-[calc(100%-4rem)] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and brand */}
          <Link href="/" className="flex items-center gap-2">
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
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`transition-all ${
                  pathname === item.path 
                    ? 'border-b-2 border-black dark:border-[color:var(--ft-neon)]' 
                    : ''
                }`}
              >
                <h2 className={`text-sm font-medium ${pathname === item.path ? 'bg-gradient-to-r from-black dark:from-white to-black dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent' : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-black hover:to-gray-600 dark:hover:from-white dark:hover:to-[color:var(--ft-neon)] hover:bg-clip-text hover:text-transparent'}`} style={{ fontFamily: 'var(--ft-font-secondary)' }}>
                  {item.label.toUpperCase()}
                </h2>
              </Link>
            ))}
          </div>

          {/* User menu */}
          <div className="hidden md:flex items-center space-x-4">
            <FlexTimeThemeToggle />
            <FlexTimeShinyButton variant="secondary" className="px-4 py-2 text-sm">
              Settings
            </FlexTimeShinyButton>
            <FlexTimeShinyButton variant="secondary" className="px-4 py-2 text-sm">
              Sign In
            </FlexTimeShinyButton>
          </div>

          {/* Mobile menu button */}
          <FlexTimeShinyButton
            variant="secondary" 
            className="md:hidden p-2 !min-w-0 !min-h-0" 
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
          <div className="md:hidden mt-4 pb-4 space-y-3 animate-fadeIn">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`block py-2 px-4 text-base font-medium rounded-md transition-all ${
                  pathname === item.path 
                    ? 'bg-gray-200 dark:bg-black/40 text-black dark:text-[color:var(--ft-neon)] border-l-2 border-black dark:border-[color:var(--ft-neon)]' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black/20'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col space-y-2">
              <FlexTimeShinyButton variant="secondary" className="py-2 text-sm">
                Settings
              </FlexTimeShinyButton>
              <FlexTimeShinyButton variant="secondary" className="py-2 text-sm">
                Sign In
              </FlexTimeShinyButton>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
