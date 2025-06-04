import React from 'react';
import { COMPASSAnalyticsDashboard } from '../COMPASSAnalyticsDashboard';
import { 
  render, 
  screen, 
  waitFor, 
  userEvent,
  mockCOMPASSScore,
  mockScheduleMetrics,
  mockTeamMetrics
} from '../../../utils/testUtils';

// Global vi is available from setupTests

describe('COMPASSAnalyticsDashboard', () => {
  const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
  
  const defaultProps = {
    scheduleId: 'schedule-123',
    compassScore: mockCOMPASSScore(),
    scheduleMetrics: mockScheduleMetrics(),
    teamMetrics: mockTeamMetrics(),
    onRefresh: mockOnRefresh,
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render the dashboard with all sections', () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('COMPASS Analytics')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });
    
    it('should display the COMPASS score meter', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument(); // Overall score
        expect(screen.getByText('COMPASS Score')).toBeInTheDocument();
      });
    });
    
    it('should show all metric breakdowns', () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Competitiveness')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      expect(screen.getByText('Min Travel Distance')).toBeInTheDocument();
      expect(screen.getByText('Player Welfare')).toBeInTheDocument();
      expect(screen.getByText('Attendance')).toBeInTheDocument();
      expect(screen.getByText('Schedule Fairness')).toBeInTheDocument();
      expect(screen.getByText('Special Events')).toBeInTheDocument();
    });
    
    it('should display quick stats cards', () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Total Games')).toBeInTheDocument();
      expect(screen.getByText('Active Conflicts')).toBeInTheDocument();
      expect(screen.getByText('Avg Travel')).toBeInTheDocument();
      expect(screen.getByText('Schedule Health')).toBeInTheDocument();
    });
  });
  
  describe('View Navigation', () => {
    it('should switch between views when tabs are clicked', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      // Initially on Overview
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      
      // Switch to Performance
      await user.click(screen.getByText('Performance'));
      expect(screen.getByText('Schedule Performance Trends')).toBeInTheDocument();
      
      // Switch to Teams
      await user.click(screen.getByText('Teams'));
      expect(screen.getByText('Team Balance Analysis')).toBeInTheDocument();
    });
    
    it('should highlight active tab', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      const overviewTab = screen.getByText('Overview');
      const performanceTab = screen.getByText('Performance');
      
      expect(overviewTab).toHaveClass('ft-tab-active');
      expect(performanceTab).not.toHaveClass('ft-tab-active');
      
      await user.click(performanceTab);
      
      expect(overviewTab).not.toHaveClass('ft-tab-active');
      expect(performanceTab).toHaveClass('ft-tab-active');
    });
  });
  
  describe('Score Animation', () => {
    it('should animate score from 0 to final value', async () => {
      const { rerender } = render(
        <COMPASSAnalyticsDashboard 
          {...defaultProps} 
          compassScore={mockCOMPASSScore({ overall: 0 })}
        />
      );
      
      expect(screen.getByText('0')).toBeInTheDocument();
      
      rerender(
        <COMPASSAnalyticsDashboard 
          {...defaultProps} 
          compassScore={mockCOMPASSScore({ overall: 85 })}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
  
  describe('Performance View', () => {
    it('should render performance chart', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Performance'));
      
      expect(screen.getByText('Schedule Performance Trends')).toBeInTheDocument();
      // Chart elements would be rendered by Recharts
      expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      expect(screen.getByText('Conflict Resolution')).toBeInTheDocument();
    });
    
    it('should show insights cards', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Performance'));
      
      expect(screen.getByText(/Schedule optimization has improved/)).toBeInTheDocument();
      expect(screen.getByText(/venue conflicts resolved/)).toBeInTheDocument();
    });
  });
  
  describe('Teams View', () => {
    it('should render team balance chart and metrics table', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Teams'));
      
      expect(screen.getByText('Team Balance Analysis')).toBeInTheDocument();
      expect(screen.getByText('Team Metrics Details')).toBeInTheDocument();
      
      // Check table headers
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Away')).toBeInTheDocument();
      expect(screen.getByText('Avg Travel')).toBeInTheDocument();
      expect(screen.getByText('Rest Days')).toBeInTheDocument();
      expect(screen.getByText('Back-to-Back')).toBeInTheDocument();
    });
    
    it('should display all teams in the metrics table', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Teams'));
      
      const teamMetrics = mockTeamMetrics();
      teamMetrics.forEach(team => {
        expect(screen.getByText(team.team)).toBeInTheDocument();
      });
    });
    
    it('should highlight concerning metrics', async () => {
      const metricsWithHighBackToBack = mockTeamMetrics();
      metricsWithHighBackToBack[1].backToBackGames = 5; // High number
      
      render(
        <COMPASSAnalyticsDashboard 
          {...defaultProps} 
          teamMetrics={metricsWithHighBackToBack}
        />
      );
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Teams'));
      
      const highBackToBack = screen.getByText('5');
      expect(highBackToBack).toHaveClass('ft-warning');
    });
  });
  
  describe('Refresh Functionality', () => {
    it('should call onRefresh when refresh button is clicked', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      const refreshButton = screen.getByText('Refresh');
      await user.click(refreshButton);
      
      expect(mockOnRefresh).toHaveBeenCalled();
    });
    
    it('should show loading state during refresh', async () => {
      mockOnRefresh.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      const refreshButton = screen.getByText('Refresh');
      await user.click(refreshButton);
      
      const dashboard = screen.getByText('COMPASS Analytics').closest('.ft-compass-dashboard');
      expect(dashboard).toHaveClass('ft-loading');
      
      await waitFor(() => {
        expect(dashboard).not.toHaveClass('ft-loading');
      });
    });
  });
  
  describe('Score Color Coding', () => {
    it('should use success color for high scores', () => {
      render(
        <COMPASSAnalyticsDashboard 
          {...defaultProps} 
          compassScore={mockCOMPASSScore({ overall: 95 })}
        />
      );
      
      const scoreElement = screen.getByText('95');
      const computedStyle = window.getComputedStyle(scoreElement);
      expect(computedStyle.color).toContain('rgb(0, 255, 136)'); // Success color
    });
    
    it('should use warning color for medium scores', () => {
      render(
        <COMPASSAnalyticsDashboard 
          {...defaultProps} 
          compassScore={mockCOMPASSScore({ overall: 65 })}
        />
      );
      
      const scoreElement = screen.getByText('65');
      const computedStyle = window.getComputedStyle(scoreElement);
      expect(computedStyle.color).toContain('rgb(255, 165, 0)'); // Warning color
    });
    
    it('should use error color for low scores', () => {
      render(
        <COMPASSAnalyticsDashboard 
          {...defaultProps} 
          compassScore={mockCOMPASSScore({ overall: 45 })}
        />
      );
      
      const scoreElement = screen.getByText('45');
      const computedStyle = window.getComputedStyle(scoreElement);
      expect(computedStyle.color).toContain('rgb(255, 68, 68)'); // Error color
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      
      const h2 = container.querySelector('h2');
      const h3s = container.querySelectorAll('h3');
      const h4s = container.querySelectorAll('h4');
      
      expect(h2).toHaveTextContent('COMPASS Analytics');
      expect(h3s.length).toBeGreaterThan(0);
      expect(h4s.length).toBeGreaterThan(0);
    });
    
    it('should be keyboard navigable', async () => {
      render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      const user = userEvent.setup();
      
      await user.tab();
      expect(screen.getByText('Overview')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Performance')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Teams')).toHaveFocus();
    });
  });
  
  describe('Responsive Behavior', () => {
    it('should render appropriately on different screen sizes', () => {
      // Test with smaller viewport
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      
      const { container } = render(<COMPASSAnalyticsDashboard {...defaultProps} />);
      
      // Dashboard should still render all essential elements
      expect(screen.getByText('COMPASS Analytics')).toBeInTheDocument();
      expect(container.querySelector('.ft-compass-dashboard')).toBeInTheDocument();
    });
  });
});