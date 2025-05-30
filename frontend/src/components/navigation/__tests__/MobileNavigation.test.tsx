import React from 'react';
import { 
  BottomNavigation, 
  FloatingActionButton, 
  SwipeNavigation, 
  MobileDrawer,
  PullToRefresh,
  useTouchGestures
} from '../MobileNavigation';
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor, 
  userEvent,
  renderHook
} from '../../../utils/testUtils';
import { vi } from '@jest/globals';
import { act } from 'react-dom/test-utils';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

describe('BottomNavigation', () => {
  const defaultItems = [
    { id: 'schedule', label: 'Schedule', icon: '📅', path: '/' },
    { id: 'teams', label: 'Teams', icon: '🏆', path: '/teams' },
    { id: 'analytics', label: 'Analytics', icon: '📊', path: '/analytics', badge: 3 },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' },
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render all navigation items', () => {
      render(<BottomNavigation items={defaultItems} />);
      
      defaultItems.forEach(item => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
        expect(screen.getByText(item.icon)).toBeInTheDocument();
      });
    });
    
    it('should show active indicator on current route', () => {
      render(<BottomNavigation items={defaultItems} />);
      
      const scheduleItem = screen.getByText('Schedule').closest('.ft-nav-item');
      expect(scheduleItem).toHaveClass('ft-nav-item-active');
    });
    
    it('should display badge when provided', () => {
      render(<BottomNavigation items={defaultItems} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('3')).toHaveClass('ft-nav-badge');
    });
    
    it('should animate on mount', () => {
      const { container } = render(<BottomNavigation items={defaultItems} />);
      const nav = container.querySelector('.ft-bottom-navigation');
      
      expect(nav).toHaveStyle({ transform: 'translateY(0px)' });
    });
  });
  
  describe('Navigation', () => {
    it('should navigate to path when item is clicked', async () => {
      render(<BottomNavigation items={defaultItems} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Teams'));
      
      expect(mockNavigate).toHaveBeenCalledWith('/teams');
    });
    
    it('should use custom onNavigate when provided', async () => {
      const mockOnNavigate = vi.fn();
      render(<BottomNavigation items={defaultItems} onNavigate={mockOnNavigate} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Analytics'));
      
      expect(mockOnNavigate).toHaveBeenCalledWith('/analytics');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
    
    it('should update active state on navigation', async () => {
      render(<BottomNavigation items={defaultItems} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Teams'));
      
      const teamsItem = screen.getByText('Teams').closest('.ft-nav-item');
      expect(teamsItem).toHaveClass('ft-nav-item-active');
      
      const scheduleItem = screen.getByText('Schedule').closest('.ft-nav-item');
      expect(scheduleItem).not.toHaveClass('ft-nav-item-active');
    });
  });
  
  describe('Animation', () => {
    it('should scale icon on selection', async () => {
      render(<BottomNavigation items={defaultItems} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Teams'));
      
      const icon = screen.getByText('🏆').closest('.ft-nav-icon');
      expect(icon).toHaveStyle({ transform: 'scale(1.2)' });
    });
  });
});

describe('FloatingActionButton', () => {
  const mockOnClick = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render with icon', () => {
      render(<FloatingActionButton icon="➕" onClick={mockOnClick} />);
      
      expect(screen.getByText('➕')).toBeInTheDocument();
    });
    
    it('should apply position class', () => {
      const { container } = render(
        <FloatingActionButton icon="➕" onClick={mockOnClick} position="bottom-left" />
      );
      
      const fab = container.querySelector('.ft-fab');
      expect(fab).toHaveClass('ft-fab-bottom-left');
    });
    
    it('should apply mini size', () => {
      const { container } = render(
        <FloatingActionButton icon="➕" onClick={mockOnClick} mini />
      );
      
      const fab = container.querySelector('.ft-fab');
      expect(fab).toHaveClass('ft-fab-mini');
    });
    
    it('should show label on hover', async () => {
      render(
        <FloatingActionButton icon="➕" onClick={mockOnClick} label="Add Game" />
      );
      const user = userEvent.setup();
      
      const fab = screen.getByText('➕').closest('button');
      await user.hover(fab!);
      
      await waitFor(() => {
        expect(screen.getByText('Add Game')).toBeInTheDocument();
      });
    });
  });
  
  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      render(<FloatingActionButton icon="➕" onClick={mockOnClick} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('➕'));
      
      expect(mockOnClick).toHaveBeenCalled();
    });
    
    it('should animate on click', async () => {
      render(<FloatingActionButton icon="➕" onClick={mockOnClick} />);
      const user = userEvent.setup();
      
      const fab = screen.getByText('➕').closest('button');
      await user.click(fab!);
      
      // Framer Motion applies transform on tap
      expect(fab).toHaveStyle({ transform: 'scale(0.9)' });
    });
  });
});

describe('SwipeNavigation', () => {
  const mockOnSwipe = vi.fn();
  const children = [
    <div key="1">Page 1</div>,
    <div key="2">Page 2</div>,
    <div key="3">Page 3</div>,
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render first page by default', () => {
      render(<SwipeNavigation>{children}</SwipeNavigation>);
      
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });
    
    it('should render page indicators', () => {
      const { container } = render(<SwipeNavigation>{children}</SwipeNavigation>);
      
      const indicators = container.querySelectorAll('.ft-indicator');
      expect(indicators).toHaveLength(3);
      expect(indicators[0]).toHaveClass('ft-indicator-active');
    });
  });
  
  describe('Navigation', () => {
    it('should navigate to page when indicator is clicked', async () => {
      render(<SwipeNavigation onSwipe={mockOnSwipe}>{children}</SwipeNavigation>);
      const user = userEvent.setup();
      
      const indicators = screen.getAllByRole('button');
      await user.click(indicators[1]);
      
      expect(mockOnSwipe).toHaveBeenCalledWith('left', 1);
    });
    
    it('should handle swipe gestures', async () => {
      const { container } = render(
        <SwipeNavigation onSwipe={mockOnSwipe}>{children}</SwipeNavigation>
      );
      
      const swipeContent = container.querySelector('.ft-swipe-content');
      
      // Simulate drag gesture
      fireEvent.mouseDown(swipeContent!, { clientX: 300 });
      fireEvent.mouseMove(swipeContent!, { clientX: 100 });
      fireEvent.mouseUp(swipeContent!, { clientX: 100 });
      
      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalled();
      });
    });
  });
});

describe('MobileDrawer', () => {
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render when open', () => {
      render(
        <MobileDrawer isOpen onClose={mockOnClose}>
          <div>Drawer Content</div>
        </MobileDrawer>
      );
      
      expect(screen.getByText('Drawer Content')).toBeInTheDocument();
    });
    
    it('should not render when closed', () => {
      render(
        <MobileDrawer isOpen={false} onClose={mockOnClose}>
          <div>Drawer Content</div>
        </MobileDrawer>
      );
      
      expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument();
    });
    
    it('should render backdrop when open', () => {
      const { container } = render(
        <MobileDrawer isOpen onClose={mockOnClose}>
          <div>Content</div>
        </MobileDrawer>
      );
      
      expect(container.querySelector('.ft-drawer-backdrop')).toBeInTheDocument();
    });
    
    it('should apply position class', () => {
      const { container } = render(
        <MobileDrawer isOpen onClose={mockOnClose} position="right">
          <div>Content</div>
        </MobileDrawer>
      );
      
      const drawer = container.querySelector('.ft-drawer');
      expect(drawer).toHaveClass('ft-drawer-right');
    });
  });
  
  describe('Interactions', () => {
    it('should close when backdrop is clicked', async () => {
      const { container } = render(
        <MobileDrawer isOpen onClose={mockOnClose}>
          <div>Content</div>
        </MobileDrawer>
      );
      const user = userEvent.setup();
      
      const backdrop = container.querySelector('.ft-drawer-backdrop');
      await user.click(backdrop!);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
    
    it('should close on swipe gesture', async () => {
      const { container } = render(
        <MobileDrawer isOpen onClose={mockOnClose} position="left">
          <div>Content</div>
        </MobileDrawer>
      );
      
      const drawer = container.querySelector('.ft-drawer');
      
      // Simulate swipe to close
      fireEvent.mouseDown(drawer!, { clientX: 50 });
      fireEvent.mouseMove(drawer!, { clientX: -100 });
      fireEvent.mouseUp(drawer!, { clientX: -100 });
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
  
  describe('Animation', () => {
    it('should animate in from correct side', () => {
      const { container } = render(
        <MobileDrawer isOpen onClose={mockOnClose} position="left">
          <div>Content</div>
        </MobileDrawer>
      );
      
      const drawer = container.querySelector('.ft-drawer');
      expect(drawer).toHaveStyle({ transform: 'translateX(0px)' });
    });
  });
});

describe('PullToRefresh', () => {
  const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content to refresh</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content to refresh')).toBeInTheDocument();
    });
    
    it('should not show indicator by default', () => {
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const indicator = container.querySelector('.ft-pull-indicator');
      expect(indicator).toHaveStyle({ opacity: '0' });
    });
  });
  
  describe('Pull Gesture', () => {
    it('should handle pull gesture when at top', async () => {
      // Mock scroll position at top
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
      
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const pullContainer = container.querySelector('.ft-pull-refresh');
      
      // Simulate pull down
      fireEvent.touchStart(pullContainer!, { touches: [{ clientY: 0 }] });
      fireEvent.touchMove(pullContainer!, { touches: [{ clientY: 120 }] });
      fireEvent.touchEnd(pullContainer!);
      
      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });
    
    it('should not trigger refresh if pull is too short', async () => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
      
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const pullContainer = container.querySelector('.ft-pull-refresh');
      
      // Small pull
      fireEvent.touchStart(pullContainer!, { touches: [{ clientY: 0 }] });
      fireEvent.touchMove(pullContainer!, { touches: [{ clientY: 50 }] });
      fireEvent.touchEnd(pullContainer!);
      
      await waitFor(() => {
        expect(mockOnRefresh).not.toHaveBeenCalled();
      });
    });
    
    it('should show spinner during refresh', async () => {
      mockOnRefresh.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
      
      const { container } = render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const pullContainer = container.querySelector('.ft-pull-refresh');
      
      fireEvent.touchStart(pullContainer!, { touches: [{ clientY: 0 }] });
      fireEvent.touchMove(pullContainer!, { touches: [{ clientY: 120 }] });
      fireEvent.touchEnd(pullContainer!);
      
      await waitFor(() => {
        const spinner = container.querySelector('.ft-spinning');
        expect(spinner).toBeInTheDocument();
      });
    });
  });
});

describe('useTouchGestures', () => {
  it('should detect horizontal swipe', () => {
    const { result } = renderHook(() => useTouchGestures());
    
    act(() => {
      result.current.handleTouchStart({ 
        targetTouches: [{ clientX: 200, clientY: 100 }] 
      } as any);
      
      result.current.handleTouchMove({ 
        targetTouches: [{ clientX: 50, clientY: 100 }] 
      } as any);
      
      const direction = result.current.handleTouchEnd();
      expect(direction).toBe('left');
    });
  });
  
  it('should detect vertical swipe', () => {
    const { result } = renderHook(() => useTouchGestures());
    
    act(() => {
      result.current.handleTouchStart({ 
        targetTouches: [{ clientX: 100, clientY: 200 }] 
      } as any);
      
      result.current.handleTouchMove({ 
        targetTouches: [{ clientX: 100, clientY: 50 }] 
      } as any);
      
      const direction = result.current.handleTouchEnd();
      expect(direction).toBe('up');
    });
  });
  
  it('should return null for small movements', () => {
    const { result } = renderHook(() => useTouchGestures());
    
    act(() => {
      result.current.handleTouchStart({ 
        targetTouches: [{ clientX: 100, clientY: 100 }] 
      } as any);
      
      result.current.handleTouchMove({ 
        targetTouches: [{ clientX: 110, clientY: 110 }] 
      } as any);
      
      const direction = result.current.handleTouchEnd();
      expect(direction).toBeNull();
    });
  });
});