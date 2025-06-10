import React, { useState, useEffect } from 'react';
import { usePWA, CacheManager, NotificationManager, ShareManager } from '../utils/pwaUtils';

interface PWAStatusDashboardProps {
  className?: string;
  showAsModal?: boolean;
  onClose?: () => void;
}

export const PWAStatusDashboard: React.FC<PWAStatusDashboardProps> = ({
  className = '',
  showAsModal = false,
  onClose
}) => {
  const { 
    canInstall, 
    isInstalled, 
    isOnline, 
    install, 
    update, 
    getNetworkStatus, 
    getInstallationInfo 
  } = usePWA();

  const [storageInfo, setStorageInfo] = useState({ used: 0, quota: 0 });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [installationInfo, setInstallationInfo] = useState(getInstallationInfo());
  const [networkInfo, setNetworkInfo] = useState(getNetworkStatus());

  useEffect(() => {
    // Update storage info
    CacheManager.getStorageUsage().then(setStorageInfo);
    
    // Update notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Update installation info periodically
    const interval = setInterval(() => {
      setInstallationInfo(getInstallationInfo());
      setNetworkInfo(getNetworkStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, [getInstallationInfo, getNetworkStatus]);

  const handleClearCache = async () => {
    try {
      await CacheManager.clearAll();
      setStorageInfo(await CacheManager.getStorageUsage());
      alert('Cache cleared successfully!');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await NotificationManager.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
  };

  const handleTestNotification = async () => {
    await NotificationManager.showNotification('FlexTime Test', {
      body: 'PWA notifications are working correctly!',
      icon: '/icons/icon-192x192.png'
    });
  };

  const handleShare = async () => {
    const success = await ShareManager.share({
      title: 'FlexTime - Sports Scheduling Platform',
      text: 'Check out FlexTime, an advanced sports scheduling platform!',
      url: window.location.href
    });
    
    if (!success) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: boolean) => status ? '✅' : '❌';
  const getConnectionType = () => {
    if (!isOnline) return 'Offline';
    if (networkInfo.effectiveType) {
      return networkInfo.effectiveType.toUpperCase();
    }
    return 'Online';
  };

  const containerStyle = {
    background: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 191, 255, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    color: 'white',
    fontFamily: 'Rajdhani, sans-serif',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    ...(showAsModal && {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10000,
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
    })
  };

  return (
    <>
      {showAsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999
          }}
          onClick={onClose}
        />
      )}
      
      <div className={`pwa-status-dashboard ${className}`} style={containerStyle}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #00bfff, #ffffff)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            PWA Status Dashboard
          </h2>
          
          {showAsModal && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#888';
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Status Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Installation Status */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '1.2rem', 
              color: '#00bfff' 
            }}>
              Installation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Installed:</span>
                <span>{getStatusIcon(isInstalled)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Installable:</span>
                <span>{getStatusIcon(canInstall)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Service Worker:</span>
                <span>{getStatusIcon(installationInfo.hasServiceWorker)}</span>
              </div>
            </div>
            
            {!isInstalled && canInstall && (
              <button
                onClick={install}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  background: 'linear-gradient(45deg, #00bfff, #0080ff)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Install App
              </button>
            )}
          </div>

          {/* Network Status */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '1.2rem', 
              color: '#00bfff' 
            }}>
              Network
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status:</span>
                <span style={{ 
                  color: isOnline ? '#51cf66' : '#ff6b6b',
                  fontWeight: '600'
                }}>
                  {getConnectionType()}
                </span>
              </div>
              {networkInfo.downlink && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Speed:</span>
                  <span>{networkInfo.downlink} Mbps</span>
                </div>
              )}
              {networkInfo.rtt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Latency:</span>
                  <span>{networkInfo.rtt}ms</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Storage Information */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '1.2rem', 
            color: '#00bfff' 
          }}>
            Storage Usage
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Used: {formatBytes(storageInfo.used)}</span>
              <span>Quota: {formatBytes(storageInfo.quota)}</span>
            </div>
            
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${storageInfo.quota > 0 ? (storageInfo.used / storageInfo.quota) * 100 : 0}%`,
                background: 'linear-gradient(45deg, #00bfff, #0080ff)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          
          <button
            onClick={handleClearCache}
            style={{
              background: 'rgba(255, 107, 107, 0.2)',
              border: '1px solid rgba(255, 107, 107, 0.4)',
              color: '#ff6b6b',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Clear Cache
          </button>
        </div>

        {/* Feature Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {/* Notifications */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#00bfff' }}>
              Notifications
            </h4>
            <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
              Status: {notificationPermission}
            </div>
            
            {notificationPermission === 'default' && (
              <button
                onClick={handleRequestNotifications}
                style={{
                  width: '100%',
                  background: 'linear-gradient(45deg, #00bfff, #0080ff)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Enable
              </button>
            )}
            
            {notificationPermission === 'granted' && (
              <button
                onClick={handleTestNotification}
                style={{
                  width: '100%',
                  background: 'rgba(81, 207, 102, 0.2)',
                  border: '1px solid rgba(81, 207, 102, 0.4)',
                  color: '#51cf66',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Test
              </button>
            )}
          </div>

          {/* Share */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#00bfff' }}>
              Share
            </h4>
            <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
              {ShareManager.isSupported() ? 'Available' : 'Not supported'}
            </div>
            
            <button
              onClick={handleShare}
              style={{
                width: '100%',
                background: 'linear-gradient(45deg, #00bfff, #0080ff)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Share App
            </button>
          </div>

          {/* Update */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#00bfff' }}>
              Updates
            </h4>
            <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
              Auto-updating
            </div>
            
            <button
              onClick={update}
              style={{
                width: '100%',
                background: 'rgba(255, 193, 7, 0.2)',
                border: '1px solid rgba(255, 193, 7, 0.4)',
                color: '#ffc107',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Check Updates
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PWAStatusDashboard;