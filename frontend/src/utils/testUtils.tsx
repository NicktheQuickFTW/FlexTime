// Test utilities for FlexTime
import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AnimationProvider } from '../contexts/AnimationContext';
import { SportConfigProvider } from '../contexts/SportConfigContext';
import userEvent from '@testing-library/user-event';

// Mock data generators
export const mockUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@flextime.com',
  avatar: null,
  color: '#00bfff',
  isActive: true,
  lastSeen: new Date(),
  ...overrides
});

export const mockGame = (overrides = {}) => ({
  id: 'game-123',
  homeTeam: 'Kansas',
  awayTeam: 'Texas Tech',
  sport: 'Basketball',
  date: '2025-01-15',
  time: '19:00',
  venue: 'Allen Fieldhouse',
  constraints: [],
  ...overrides
});

export const mockTimeSlot = (overrides = {}) => ({
  date: '2025-01-15',
  time: '19:00',
  venue: 'Allen Fieldhouse',
  occupied: false,
  ...overrides
});

export const mockCOMPASSScore = (overrides = {}) => ({
  overall: 85,
  competitiveness: 90,
  optimization: 88,
  minTravelDistance: 82,
  playerWelfare: 87,
  attendance: 83,
  scheduleFairness: 89,
  specialEvents: 80,
  ...overrides
});

export const mockScheduleMetrics = () => [
  { date: '2025-01-01', score: 78, games: 5, conflicts: 0, travelMiles: 1200 },
  { date: '2025-01-08', score: 82, games: 6, conflicts: 1, travelMiles: 1500 },
  { date: '2025-01-15', score: 85, games: 7, conflicts: 0, travelMiles: 1100 },
  { date: '2025-01-22', score: 88, games: 8, conflicts: 0, travelMiles: 900 },
  { date: '2025-01-29', score: 90, games: 6, conflicts: 0, travelMiles: 800 },
];

export const mockTeamMetrics = () => [
  { team: 'Kansas', homeGames: 8, awayGames: 7, avgTravelDistance: 450, restDays: 45, backToBackGames: 2 },
  { team: 'Texas Tech', homeGames: 7, awayGames: 8, avgTravelDistance: 520, restDays: 42, backToBackGames: 3 },
  { team: 'Baylor', homeGames: 8, awayGames: 7, avgTravelDistance: 380, restDays: 48, backToBackGames: 1 },
  { team: 'Iowa State', homeGames: 7, awayGames: 8, avgTravelDistance: 490, restDays: 44, backToBackGames: 2 },
];

// All providers wrapper
interface AllProvidersProps {
  children: React.ReactNode;
  initialRoute?: string;
  theme?: 'dark' | 'light';
}

const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  initialRoute = '/',
  theme = 'dark' 
}) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider initialTheme={{ mode: theme }}>
        <AnimationProvider>
          <SportConfigProvider>
            {children}
          </SportConfigProvider>
        </AnimationProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { 
    initialRoute?: string;
    theme?: 'dark' | 'light';
  }
): RenderResult => {
  const { initialRoute, theme, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialRoute={initialRoute} theme={theme}>
        {children}
      </AllProviders>
    ),
    ...renderOptions
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { userEvent };

// Mock WebSocket for testing
export class MockWebSocket {
  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  constructor(url: string) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen(new Event('open'));
    }, 0);
  }
  
  send(data: string) {
    // Mock implementation - trigger onmessage with echo
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage!(new MessageEvent('message', { data }));
      }, 10);
    }
  }
  
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
  
  // Helper to simulate incoming messages
  simulateMessage(data: any) {
    if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
      this.onmessage(new MessageEvent('message', { 
        data: typeof data === 'string' ? data : JSON.stringify(data) 
      }));
    }
  }
  
  // Helper to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Async utilities
export const waitForLoadingToFinish = () => 
  waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

// Drag and drop test helpers
export const mockDataTransfer = () => {
  const dataTransfer = {
    data: {} as Record<string, any>,
    setData(key: string, value: any) {
      this.data[key] = value;
    },
    getData(key: string) {
      return this.data[key];
    },
    clearData() {
      this.data = {};
    },
    setDragImage() {},
    dropEffect: 'copy' as DataTransfer['dropEffect'],
    effectAllowed: 'all' as DataTransfer['effectAllowed'],
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types: [] as string[],
  };
  return dataTransfer;
};

// Performance testing utilities
export const measureRenderTime = async (component: ReactElement) => {
  const start = performance.now();
  const { unmount } = render(component);
  const end = performance.now();
  unmount();
  return end - start;
};

// Accessibility testing helpers
export const checkA11y = async (container: HTMLElement) => {
  const results = [];
  
  // Check for missing alt text
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      results.push({ type: 'error', message: `Image missing alt text: ${img.src}` });
    }
  });
  
  // Check for proper heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1) {
      results.push({ type: 'warning', message: `Heading hierarchy skip: ${heading.tagName}` });
    }
    lastLevel = level;
  });
  
  // Check for keyboard accessibility
  const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
  interactiveElements.forEach(element => {
    if (element.getAttribute('tabindex') === '-1' && !element.getAttribute('aria-hidden')) {
      results.push({ type: 'warning', message: `Element not keyboard accessible: ${element.tagName}` });
    }
  });
  
  return results;
};

export { waitFor, screen, fireEvent, within } from '@testing-library/react';