import React, { useState, useEffect } from 'react';
import { usePWA, PWAManager } from '../utils/pwaUtils';

interface PWAInstallPromptProps {
  className?: string;
  showAsButton?: boolean;
  autoShow?: boolean;
  position?: 'top' | 'bottom' | 'fixed-bottom' | 'fixed-top';
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className = '',
  showAsButton = false,
  autoShow = true,
  position = 'fixed-bottom'
}) => {
  const { canInstall, isInstalled, install } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show prompt if installable and not dismissed
    if (canInstall && !isInstalled && !isDismissed && autoShow) {
      // Delay showing prompt to avoid interrupting user
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, isDismissed, autoShow]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await install();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('[PWA] Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't render if not installable or already installed
  if (!canInstall || isInstalled) {
    return null;
  }

  // Button variant
  if (showAsButton) {
    return (
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className={`pwa-install-button ${className}`}
        style={{
          background: 'linear-gradient(45deg, #00bfff, #0080ff)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: isInstalling ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          opacity: isInstalling ? 0.7 : 1,
          transform: isInstalling ? 'scale(0.98)' : 'scale(1)',
          boxShadow: '0 4px 15px rgba(0, 191, 255, 0.3)'
        }}
        onMouseEnter={(e) => {
          if (!isInstalling) {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 191, 255, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isInstalling) {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 191, 255, 0.3)';
          }
        }}
      >
        <span style={{ fontSize: '1.2em' }}>📱</span>
        {isInstalling ? 'Installing...' : 'Install FlexTime'}
      </button>
    );
  }

  // Banner/notification variant
  if (!isVisible) return null;

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10000,
      maxWidth: '500px',
      width: '90%'
    };

    switch (position) {
      case 'top':
        return { ...baseStyles, top: '20px' };
      case 'bottom':
        return { ...baseStyles, bottom: '20px' };
      case 'fixed-top':
        return { ...baseStyles, top: '0px' };
      case 'fixed-bottom':
        return { ...baseStyles, bottom: '0px' };
      default:
        return { ...baseStyles, bottom: '20px' };
    }
  };

  return (
    <div
      className={`pwa-install-prompt ${className}`}
      style={{
        ...getPositionStyles(),
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 191, 255, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        color: 'white',
        fontFamily: 'Rajdhani, sans-serif',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .pwa-install-prompt {
            margin: 0 10px;
            width: calc(100% - 20px);
          }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          fontSize: '2rem',
          background: 'linear-gradient(45deg, #00bfff, #0080ff)',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          📱
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '1.4rem',
            fontWeight: '700',
            color: '#00bfff'
          }}>
            Install FlexTime App
          </h3>
          
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '1rem',
            color: '#b0b8c1',
            lineHeight: '1.4'
          }}>
            Get faster access, offline functionality, and a native app experience
          </p>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              style={{
                background: 'linear-gradient(45deg, #00bfff, #0080ff)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: isInstalling ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isInstalling ? 0.7 : 1,
                minWidth: '100px'
              }}
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                color: '#b0b8c1',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Not Now
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#888';
          }}
          title="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Network status indicator component
export const NetworkStatusIndicator: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { isOnline, getNetworkStatus } = usePWA();
  const [networkInfo, setNetworkInfo] = useState(getNetworkStatus());

  useEffect(() => {
    const updateNetworkInfo = () => {
      setNetworkInfo(getNetworkStatus());
    };

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
    };
  }, [getNetworkStatus]);

  if (isOnline) return null;

  return (
    <div
      className={`network-status-indicator ${className}`}
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(45deg, #ff6b6b, #ff5252)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '0.9rem',
        fontWeight: '600',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
      
      <span>📡</span>
      <span>You're offline</span>
    </div>
  );
};

// App update indicator
export const UpdateAvailableIndicator: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { update, onUpdate } = usePWA();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onUpdate(() => {
      setUpdateAvailable(true);
    });

    return unsubscribe;
  }, [onUpdate]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    await update();
  };

  if (!updateAvailable) return null;

  return (
    <div
      className={`update-available-indicator ${className}`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 191, 255, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        color: 'white',
        fontFamily: 'Rajdhani, sans-serif',
        zIndex: 10000,
        maxWidth: '350px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          fontSize: '24px',
          animation: 'spin 2s linear infinite'
        }}>
          🔄
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', color: '#00bfff', marginBottom: '4px' }}>
            Update Available
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            A new version of FlexTime is ready!
          </div>
        </div>
        
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          style={{
            background: 'linear-gradient(45deg, #00bfff, #0080ff)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            opacity: isUpdating ? 0.7 : 1
          }}
        >
          {isUpdating ? 'Updating...' : 'Update'}
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;