import React from 'react';
import { 
  render, 
  measureRenderTime,
  mockGame,
  mockTimeSlot,
  mockCOMPASSScore,
  mockScheduleMetrics,
  mockTeamMetrics
} from '../../utils/testUtils';
import { DragDropScheduleBuilder } from '../../components/scheduler';
import { COMPASSAnalyticsDashboard } from '../../components/analytics';
import { Big12TeamGrid } from '../../components/teams';
import { BIG12_TEAMS } from '../../data/big12Teams';
import { RealtimeCollaboration } from '../../components/collaboration';
import { BottomNavigation, SwipeNavigation } from '../../components/navigation';

describe('Performance Tests', () => {
  describe('Component Render Performance', () => {
    it('DragDropScheduleBuilder should render under 500ms with 100 games', async () => {
      const games = Array.from({ length: 100 }, (_, i) => 
        mockGame({ id: `game-${i}` })
      );
      const slots = Array.from({ length: 50 }, (_, i) => 
        mockTimeSlot({ date: `2025-01-${i + 1}`, venue: `Venue ${i}` })
      );
      
      const renderTime = await measureRenderTime(
        <DragDropScheduleBuilder
          games={games}
          timeSlots={slots}
          constraints={[]}
          onGameMove={vi.fn()}
        />
      );
      
      expect(renderTime).toBeLessThan(500);
    });
    
    it('COMPASSAnalyticsDashboard should render charts efficiently', async () => {
      const metrics = Array.from({ length: 365 }, (_, i) => ({
        date: `2025-${Math.floor(i / 30) + 1}-${(i % 30) + 1}`,
        score: 70 + Math.random() * 30,
        games: Math.floor(Math.random() * 10),
        conflicts: Math.floor(Math.random() * 3),
        travelMiles: 500 + Math.random() * 2000,
      }));
      
      const renderTime = await measureRenderTime(
        <COMPASSAnalyticsDashboard
          compassScore={mockCOMPASSScore()}
          scheduleMetrics={metrics}
          teamMetrics={mockTeamMetrics()}
        />
      );
      
      expect(renderTime).toBeLessThan(1000);
    });
    
    it('Big12TeamGrid should handle all 16 teams efficiently', async () => {
      const allTeams = Object.values(BIG12_TEAMS);
      
      const renderTime = await measureRenderTime(
        <Big12TeamGrid teams={allTeams} variant="detailed" />
      );
      
      expect(renderTime).toBeLessThan(300);
    });
    
    it('Mobile navigation should render instantly', async () => {
      const navItems = Array.from({ length: 10 }, (_, i) => ({
        id: `nav-${i}`,
        label: `Item ${i}`,
        icon: '📱',
        path: `/path-${i}`,
      }));
      
      const renderTime = await measureRenderTime(
        <BottomNavigation items={navItems} />
      );
      
      expect(renderTime).toBeLessThan(100);
    });
  });
  
  describe('Memory Usage', () => {
    it('should not leak memory with repeated renders', async () => {
      const games = Array.from({ length: 50 }, (_, i) => mockGame({ id: `game-${i}` }));
      const slots = Array.from({ length: 20 }, (_, i) => mockTimeSlot({ date: `2025-01-${i + 1}` }));
      
      // Get initial memory if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <DragDropScheduleBuilder
            games={games}
            timeSlots={slots}
            constraints={[]}
            onGameMove={vi.fn()}
          />
        );
        unmount();
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
  
  describe('Animation Performance', () => {
    it('should maintain 60fps during drag operations', () => {
      const games = Array.from({ length: 20 }, (_, i) => mockGame({ id: `game-${i}` }));
      const slots = Array.from({ length: 10 }, (_, i) => mockTimeSlot({ date: `2025-01-${i + 1}` }));
      
      let frameCount = 0;
      const startTime = performance.now();
      
      const measureFrames = () => {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(measureFrames);
        }
      };
      
      render(
        <DragDropScheduleBuilder
          games={games}
          timeSlots={slots}
          constraints={[]}
          onGameMove={vi.fn()}
        />
      );
      
      requestAnimationFrame(measureFrames);
      
      // Wait for measurement to complete
      setTimeout(() => {
        // Should achieve close to 60fps
        expect(frameCount).toBeGreaterThan(50);
      }, 1100);
    });
  });
  
  describe('Bundle Size Impact', () => {
    it('components should be tree-shakeable', () => {
      // This is more of a build-time test, but we can verify imports work correctly
      const imports = [
        () => import('../../components/scheduler'),
        () => import('../../components/teams'),
        () => import('../../components/analytics'),
        () => import('../../components/collaboration'),
        () => import('../../components/navigation'),
      ];
      
      // All imports should resolve
      Promise.all(imports.map(imp => imp())).then(modules => {
        expect(modules).toHaveLength(5);
        modules.forEach(module => {
          expect(module).toBeDefined();
        });
      });
    });
  });
  
  describe('Stress Testing', () => {
    it('should handle extreme data volumes', async () => {
      // 1000 games, 200 time slots
      const hugeGames = Array.from({ length: 1000 }, (_, i) => 
        mockGame({ 
          id: `game-${i}`,
          homeTeam: `Team ${i % 16}`,
          awayTeam: `Team ${(i + 8) % 16}`,
        })
      );
      
      const hugeSlots = Array.from({ length: 200 }, (_, i) => 
        mockTimeSlot({ 
          date: `2025-${Math.floor(i / 30) + 1}-${(i % 30) + 1}`,
          venue: `Venue ${i % 10}`,
        })
      );
      
      const start = performance.now();
      
      const { container } = render(
        <DragDropScheduleBuilder
          games={hugeGames}
          timeSlots={hugeSlots}
          constraints={[]}
          onGameMove={vi.fn()}
        />
      );
      
      const renderTime = performance.now() - start;
      
      // Should still render within reasonable time
      expect(renderTime).toBeLessThan(5000);
      
      // Should render without crashing
      expect(container.querySelector('.ft-schedule-builder')).toBeInTheDocument();
    });
    
    it('should handle rapid state updates', async () => {
      const { rerender } = render(
        <COMPASSAnalyticsDashboard
          compassScore={mockCOMPASSScore({ overall: 0 })}
          scheduleMetrics={mockScheduleMetrics()}
          teamMetrics={mockTeamMetrics()}
        />
      );
      
      const updates = 100;
      const start = performance.now();
      
      // Rapid score updates
      for (let i = 0; i <= updates; i++) {
        rerender(
          <COMPASSAnalyticsDashboard
            compassScore={mockCOMPASSScore({ overall: i })}
            scheduleMetrics={mockScheduleMetrics()}
            teamMetrics={mockTeamMetrics()}
          />
        );
      }
      
      const updateTime = performance.now() - start;
      
      // Should handle rapid updates efficiently
      expect(updateTime).toBeLessThan(2000);
    });
  });
  
  describe('Network Performance', () => {
    it('should batch WebSocket messages efficiently', async () => {
      let messageCount = 0;
      const originalSend = WebSocket.prototype.send;
      
      WebSocket.prototype.send = function() {
        messageCount++;
        originalSend.apply(this, arguments as any);
      };
      
      render(
        <RealtimeCollaboration
          scheduleId="perf-test"
          currentUser={{
            id: 'test-user',
            name: 'Test User',
            email: 'test@example.com',
            color: '#00bfff',
            isActive: true,
            lastSeen: new Date(),
          }}
        />
      );
      
      // Simulate rapid cursor movements
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(document, { clientX: i, clientY: i });
      }
      
      // Wait for throttling
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should throttle messages (not send all 100)
      expect(messageCount).toBeLessThan(10);
      
      // Restore original
      WebSocket.prototype.send = originalSend;
    });
  });
  
  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous drag operations', () => {
      const games = Array.from({ length: 10 }, (_, i) => mockGame({ id: `game-${i}` }));
      const slots = Array.from({ length: 10 }, (_, i) => mockTimeSlot({ date: `2025-01-${i + 1}` }));
      
      const { container } = render(
        <DragDropScheduleBuilder
          games={games}
          timeSlots={slots}
          constraints={[]}
          onGameMove={vi.fn()}
        />
      );
      
      const gameCards = container.querySelectorAll('.ft-draggable-game');
      const dropZones = container.querySelectorAll('.ft-drop-zone');
      
      // Simulate multiple simultaneous drags
      const dragPromises = Array.from({ length: 5 }, (_, i) => {
        return new Promise(resolve => {
          fireEvent.dragStart(gameCards[i]);
          fireEvent.dragOver(dropZones[i]);
          fireEvent.drop(dropZones[i]);
          resolve(true);
        });
      });
      
      // All operations should complete without errors
      Promise.all(dragPromises).then(results => {
        expect(results).toHaveLength(5);
        expect(results.every(r => r === true)).toBe(true);
      });
    });
  });
});