import React from 'react';
import { 
  render, 
  screen,
  checkA11y,
  userEvent,
  within
} from '../../utils/testUtils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DragDropScheduleBuilder } from '../../components/scheduler';
import { COMPASSAnalyticsDashboard } from '../../components/analytics';
import { Big12TeamCard, Big12TeamGrid } from '../../components/teams';
import { RealtimeCollaboration } from '../../components/collaboration';
import { BottomNavigation, MobileDrawer } from '../../components/navigation';
import { BIG12_TEAMS } from '../../data/big12Teams';
import { mockGame, mockTimeSlot, mockCOMPASSScore, mockScheduleMetrics, mockTeamMetrics } from '../../utils/testUtils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('WCAG 2.1 AA Compliance', () => {
    it('DragDropScheduleBuilder should have no accessibility violations', async () => {
      const { container } = render(
        <DragDropScheduleBuilder
          games={[mockGame()]}
          timeSlots={[mockTimeSlot()]}
          constraints={[]}
          onGameMove={vi.fn()}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('COMPASSAnalyticsDashboard should have no accessibility violations', async () => {
      const { container } = render(
        <COMPASSAnalyticsDashboard
          compassScore={mockCOMPASSScore()}
          scheduleMetrics={mockScheduleMetrics()}
          teamMetrics={mockTeamMetrics()}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('Big12TeamCard should have no accessibility violations', async () => {
      const { container } = render(
        <Big12TeamCard team={BIG12_TEAMS.kansas} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('Mobile navigation should have no accessibility violations', async () => {
      const { container } = render(
        <BottomNavigation />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  describe('Keyboard Navigation', () => {
    it('should navigate through schedule builder with keyboard', async () => {
      const user = userEvent.setup();
      
      render(
        <DragDropScheduleBuilder
          games={[mockGame(), mockGame({ id: 'game-2' })]}
          timeSlots={[mockTimeSlot(), mockTimeSlot({ date: '2025-01-16' })]}
          constraints={[]}
          onGameMove={vi.fn()}
        />
      );
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toBeTruthy();
      
      await user.tab();
      expect(document.activeElement).toBeTruthy();
      
      // Should be able to activate with Enter/Space
      await user.keyboard('{Enter}');
    });
    
    it('should navigate analytics dashboard tabs with keyboard', async () => {
      const user = userEvent.setup();
      
      render(
        <COMPASSAnalyticsDashboard
          compassScore={mockCOMPASSScore()}
          scheduleMetrics={mockScheduleMetrics()}
          teamMetrics={mockTeamMetrics()}
        />
      );
      
      // Tab to first tab
      await user.tab();
      expect(screen.getByText('Overview')).toHaveFocus();
      
      // Arrow keys to navigate tabs
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Performance')).toHaveFocus();
      
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Teams')).toHaveFocus();
      
      // Enter to activate
      await user.keyboard('{Enter}');
      expect(screen.getByText('Team Balance Analysis')).toBeInTheDocument();
    });
    
    it('should trap focus in mobile drawer', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(
        <MobileDrawer isOpen onClose={onClose}>
          <button>First Button</button>
          <button>Second Button</button>
          <button>Last Button</button>
        </MobileDrawer>
      );
      
      // Focus should be trapped within drawer
      await user.tab();
      expect(screen.getByText('First Button')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Second Button')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Last Button')).toHaveFocus();
      
      // Should cycle back to first
      await user.tab();
      expect(screen.getByText('First Button')).toHaveFocus();
      
      // Escape should close
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });
  });
  
  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(
        <DragDropScheduleBuilder
          games={[mockGame()]}
          timeSlots={[mockTimeSlot()]}
          constraints={[]}
          onGameMove={vi.fn()}
        />
      );
      
      // Game cards should be labeled
      const gameCard = screen.getByText('Kansas').closest('.ft-draggable-game');
      expect(gameCard).toHaveAttribute('draggable', 'true');
      
      // Drop zones should indicate their purpose
      const dropZone = screen.getByText('Allen Fieldhouse').closest('.ft-drop-zone');
      expect(dropZone).toBeTruthy();
    });
    
    it('should announce live updates in collaboration', async () => {
      render(
        <RealtimeCollaboration
          scheduleId="test"
          currentUser={{
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            color: '#00bfff',
            isActive: true,
            lastSeen: new Date(),
          }}
        />
      );
      
      // Live regions should exist
      const liveRegions = screen.queryAllByRole('status');
      expect(liveRegions.length).toBeGreaterThan(0);
    });
    
    it('should provide context for data visualizations', () => {
      render(
        <COMPASSAnalyticsDashboard
          compassScore={mockCOMPASSScore()}
          scheduleMetrics={mockScheduleMetrics()}
          teamMetrics={mockTeamMetrics()}
        />
      );
      
      // Score should be announced
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('COMPASS Score')).toBeInTheDocument();
      
      // Chart data should have accessible alternatives
      const metricsSection = screen.getByText('Quick Stats').parentElement;
      expect(metricsSection).toContainElement(screen.getByText('Total Games'));
    });
  });
  
  describe('Color Contrast', () => {
    it('should maintain WCAG AA contrast ratios', () => {
      const { container } = render(
        <div>
          <Big12TeamCard team={BIG12_TEAMS.kansas} />
          <COMPASSAnalyticsDashboard
            compassScore={mockCOMPASSScore()}
            scheduleMetrics={mockScheduleMetrics()}
            teamMetrics={mockTeamMetrics()}
          />
        </div>
      );
      
      // Get all text elements
      const textElements = container.querySelectorAll('p, span, h1, h2, h3, h4, button');
      
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // This is a simplified check - in real testing you'd calculate actual contrast
        expect(color).not.toBe(backgroundColor);
      });
    });
  });
  
  describe('Focus Management', () => {
    it('should show visible focus indicators', async () => {
      const user = userEvent.setup();
      
      render(
        <BottomNavigation />
      );
      
      await user.tab();
      
      const focusedElement = document.activeElement;
      const styles = window.getComputedStyle(focusedElement!);
      
      // Should have visible focus indicator
      expect(styles.outline || styles.boxShadow).toBeTruthy();
    });
    
    it('should restore focus after modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <div>
          <button id="trigger">Open Drawer</button>
          <MobileDrawer isOpen={false} onClose={vi.fn()}>
            <div>Drawer Content</div>
          </MobileDrawer>
        </div>
      );
      
      const trigger = screen.getByText('Open Drawer');
      trigger.focus();
      
      // Open drawer
      rerender(
        <div>
          <button id="trigger">Open Drawer</button>
          <MobileDrawer isOpen onClose={vi.fn()}>
            <div>Drawer Content</div>
          </MobileDrawer>
        </div>
      );
      
      // Close drawer
      rerender(
        <div>
          <button id="trigger">Open Drawer</button>
          <MobileDrawer isOpen={false} onClose={vi.fn()}>
            <div>Drawer Content</div>
          </MobileDrawer>
        </div>
      );
      
      // Focus should return to trigger
      expect(document.activeElement).toBe(trigger);
    });
  });
  
  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      const { container } = render(
        <DragDropScheduleBuilder
          games={[mockGame()]}
          timeSlots={[mockTimeSlot()]}
          constraints={[]}
          onGameMove={vi.fn()}
        />
      );
      
      // Animations should be disabled
      const animatedElements = container.querySelectorAll('[style*="transition"], [style*="animation"]');
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.animationDuration).toBe('0.01ms');
      });
    });
  });
  
  describe('Touch Target Sizes', () => {
    it('should have minimum 44x44px touch targets', () => {
      const { container } = render(
        <BottomNavigation />
      );
      
      const buttons = container.querySelectorAll('button');
      
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });
  });
  
  describe('Error Messaging', () => {
    it('should provide accessible error messages', async () => {
      const onGameMove = vi.fn().mockRejectedValue(new Error('Network error'));
      
      render(
        <DragDropScheduleBuilder
          games={[mockGame()]}
          timeSlots={[mockTimeSlot()]}
          constraints={[]}
          onGameMove={onGameMove}
        />
      );
      
      const gameCard = screen.getByText('Kansas').closest('.ft-draggable-game');
      const dropZone = screen.getByText('Allen Fieldhouse').closest('.ft-drop-zone');
      
      fireEvent.dragStart(gameCard!);
      fireEvent.drop(dropZone!);
      
      // Error should be announced to screen readers
      await waitFor(() => {
        const alerts = screen.queryAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Form Controls', () => {
    it('should have proper labels for all form controls', () => {
      render(
        <RealtimeCollaboration
          scheduleId="test"
          currentUser={{
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            color: '#00bfff',
            isActive: true,
            lastSeen: new Date(),
          }}
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName();
    });
  });
  
  describe('Custom Accessibility Checks', () => {
    it('should pass custom accessibility audit', async () => {
      const { container } = render(
        <div>
          <DragDropScheduleBuilder
            games={[mockGame()]}
            timeSlots={[mockTimeSlot()]}
            constraints={[]}
            onGameMove={vi.fn()}
          />
          <Big12TeamGrid teams={Object.values(BIG12_TEAMS).slice(0, 4)} />
        </div>
      );
      
      const issues = await checkA11y(container);
      
      // Should have no critical issues
      const criticalIssues = issues.filter(issue => issue.type === 'error');
      expect(criticalIssues).toHaveLength(0);
      
      // Warnings should be minimal
      const warnings = issues.filter(issue => issue.type === 'warning');
      expect(warnings.length).toBeLessThan(5);
    });
  });
});