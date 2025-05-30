/**
 * PWA Utilities for FlexTime Application
 * Provides hooks and utilities for Progressive Web App functionality
 */

export interface PWAInstallationInfo {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  installPrompt?: any;
}

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

/**
 * Hook for PWA installation functionality
 */
export class PWAManager {
  private static instance: PWAManager;
  private installPrompt: any = null;
  private networkCallbacks: ((status: NetworkStatus) => void)[] = [];
  private updateCallbacks: (() => void)[] = [];

  private constructor() {
    this.initializePWA();
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private initializePWA() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
    });

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      console.log('[PWA] FlexTime installed successfully');
    });

    // Listen for network changes
    window.addEventListener('online', () => this.notifyNetworkChange());
    window.addEventListener('offline', () => this.notifyNetworkChange());

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.notifyUpdate();
      });
    }
  }

  /**
   * Check if app can be installed
   */
  public canInstall(): boolean {
    return !!this.installPrompt;
  }

  /**
   * Show install prompt
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.installPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Check if app is installed
   */
  public isInstalled(): boolean {
    // Check standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Check iOS home screen launch
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    return false;
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    };
  }

  /**
   * Subscribe to network status changes
   */
  public onNetworkChange(callback: (status: NetworkStatus) => void): () => void {
    this.networkCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.networkCallbacks.indexOf(callback);
      if (index > -1) {
        this.networkCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to app updates
   */
  public onUpdate(callback: () => void): () => void {
    this.updateCallbacks.push(callback);
    
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Force app update
   */
  public async updateApp(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }

  /**
   * Get installation info
   */
  public getInstallationInfo(): PWAInstallationInfo {
    return {
      isInstalled: this.isInstalled(),
      isInstallable: this.canInstall(),
      isOnline: navigator.onLine,
      hasServiceWorker: 'serviceWorker' in navigator,
      installPrompt: this.installPrompt
    };
  }

  private notifyNetworkChange() {
    const status = this.getNetworkStatus();
    this.networkCallbacks.forEach(callback => callback(status));
  }

  private notifyUpdate() {
    this.updateCallbacks.forEach(callback => callback());
  }
}

/**
 * React hook for PWA functionality
 */
export function usePWA() {
  const pwa = PWAManager.getInstance();
  
  return {
    canInstall: pwa.canInstall(),
    isInstalled: pwa.isInstalled(),
    isOnline: navigator.onLine,
    install: () => pwa.showInstallPrompt(),
    update: () => pwa.updateApp(),
    getNetworkStatus: () => pwa.getNetworkStatus(),
    getInstallationInfo: () => pwa.getInstallationInfo(),
    onNetworkChange: (callback: (status: NetworkStatus) => void) => pwa.onNetworkChange(callback),
    onUpdate: (callback: () => void) => pwa.onUpdate(callback)
  };
}

/**
 * Cache management utilities
 */
export class CacheManager {
  /**
   * Clear all caches
   */
  static async clearAll(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  /**
   * Get cache storage usage
   */
  static async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    
    return { used: 0, quota: 0 };
  }

  /**
   * Preload critical resources
   */
  static async preloadCritical(urls: string[]): Promise<void> {
    if ('caches' in window) {
      const cache = await caches.open('flextime-critical');
      await Promise.all(
        urls.map(url => 
          fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
          }).catch(error => {
            console.warn('[PWA] Failed to preload:', url, error);
          })
        )
      );
    }
  }
}

/**
 * Notification utilities
 */
export class NotificationManager {
  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Show notification
   */
  static async showNotification(
    title: string, 
    options: NotificationOptions = {}
  ): Promise<void> {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && Notification.permission === 'granted') {
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options
        });
      }
    }
  }

  /**
   * Schedule notification
   */
  static async scheduleNotification(
    title: string,
    options: NotificationOptions,
    delay: number
  ): Promise<void> {
    setTimeout(() => {
      this.showNotification(title, options);
    }, delay);
  }
}

/**
 * Share API utilities
 */
export class ShareManager {
  /**
   * Check if Web Share API is supported
   */
  static isSupported(): boolean {
    return 'share' in navigator;
  }

  /**
   * Share content using Web Share API
   */
  static async share(data: ShareData): Promise<boolean> {
    if (this.isSupported()) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.warn('[PWA] Share failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Share schedule data
   */
  static async shareSchedule(
    title: string, 
    description: string, 
    url?: string
  ): Promise<boolean> {
    return this.share({
      title: `FlexTime Schedule: ${title}`,
      text: description,
      url: url || window.location.href
    });
  }
}

// Export default PWA manager instance
export default PWAManager.getInstance();