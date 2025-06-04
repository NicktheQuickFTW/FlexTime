import React from 'react';
import { 
  render, 
  screen, 
  waitFor, 
  userEvent,
  fireEvent,
  mockGame,
  mockTimeSlot,
  MockWebSocket
} from '../../utils/testUtils';
import { DragDropScheduleBuilder } from '../../components/scheduler';
import { RealtimeCollaboration } from '../../components/collaboration';
import { COMPASSAnalyticsDashboard } from '../../components/analytics';

// Global vi is available from setupTests

// Mock WebSocket
global.WebSocket = MockWebSocket as any;

describe('Complete Scheduling Flow Integration', () => {
  const mockOnGameMove = vi.fn().mockResolvedValue(undefined);
  const mockOnScheduleChange = vi.fn();
  const mockOnConflictDetected = vi.fn();
  const mockOnRefresh = vi.fn();
  
  const testUser = {
    id: 'test-user',
    name: 'Test Scheduler',
    email: 'test@flextime.com',
    color: '#00bfff',
    isActive: true,
    lastSeen: new Date(),
  };
  
  const games = [
    mockGame({ id: 'game-1', date: undefined, time: undefined }),
    mockGame({ id: 'game-2', homeTeam: 'Baylor', awayTeam: 'TCU' }),
    mockGame({ id: 'game-3', homeTeam: 'Iowa State', awayTeam: 'Kansas State' }),
  ];
  
  const timeSlots = [
    mockTimeSlot({ date: '2025-01-15', time: '19:00', venue: 'Allen Fieldhouse' }),
    mockTimeSlot({ date: '2025-01-16', time: '20:00', venue: 'Foster Pavilion' }),
    mockTimeSlot({ date: '2025-01-17', time: '19:30', venue: 'Bramlage Coliseum' }),
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Multi-User Scheduling Scenario', () => {
    it('should handle complete scheduling workflow with collaboration', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup();
      
      // Render the complete scheduling interface
      const { container } = render(
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem' }}>
          <DragDropScheduleBuilder
            games={games}
            timeSlots={timeSlots}
            constraints={[]}
            onGameMove={mockOnGameMove}
            onConflictDetected={mockOnConflictDetected}
          />
          <RealtimeCollaboration
            scheduleId="test-schedule"
            currentUser={testUser}
            onScheduleChange={mockOnScheduleChange}
            onConflictDetected={mockOnConflictDetected}
          />
        </div>
      );
      
      // Wait for components to initialize
      await waitFor(() => {
        expect(screen.getByText('Unscheduled Games')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
      
      // Step 1: Another user joins
      const mockWebSocket = (global as any).WebSocket.instances[0];
      mockWebSocket.simulateMessage({
        type: 'user_joined',
        userId: 'other-user',
        data: {
          id: 'other-user',
          name: 'Other Scheduler',
          email: 'other@flextime.com',
          color: '#ff6b6b',
        },
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Other Scheduler')).toBeInTheDocument();
        expect(screen.getByText('Active Collaborators (1)')).toBeInTheDocument();
      });
      
      // Step 2: Current user drags a game
      const gameCard = screen.getByText('Kansas').closest('.ft-draggable-game');
      const dropZone = screen.getByText('Allen Fieldhouse').closest('.ft-drop-zone');
      
      // Simulate drag and drop
      fireEvent.dragStart(gameCard!);
      fireEvent.dragOver(dropZone!);
      fireEvent.drop(dropZone!);
      
      await waitFor(() => {
        expect(mockOnGameMove).toHaveBeenCalledWith('game-1', expect.objectContaining({
          date: '2025-01-15',
          time: '19:00',
          venue: 'Allen Fieldhouse',
        }));
      });
      
      // Step 3: Other user makes a change
      mockWebSocket.simulateMessage({
        type: 'schedule_change',
        userId: 'other-user',
        data: {
          userName: 'Other Scheduler',
          type: 'move',
          description: 'moved Baylor vs TCU to Jan 16',
          gameId: 'game-2',
        },
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText(/moved Baylor vs TCU/)).toBeInTheDocument();
        expect(mockOnScheduleChange).toHaveBeenCalled();
      });
      
      // Step 4: Conflict detected
      mockWebSocket.simulateMessage({
        type: 'conflict_detected',
        userId: 'system',
        data: {
          id: 'conflict-1',
          conflictType: 'Venue Overlap',
          severity: 'error',
          affectedGames: ['game-1', 'game-2'],
          proposedSolution: 'Move one game to a different time slot',
        },
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Conflicts Detected (1)')).toBeInTheDocument();
        expect(mockOnConflictDetected).toHaveBeenCalled();
      });
      
      // Step 5: Resolve conflict
      await user.click(screen.getByText('Apply Solution'));
      
      // Verify the complete flow worked
      expect(container.querySelectorAll('.ft-draggable-game').length).toBeGreaterThan(0);
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });
  });
  
  describe('Analytics Integration', () => {
    it('should update analytics dashboard after scheduling changes', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup();
      
      const compassScore = {
        overall: 75,
        competitiveness: 80,
        optimization: 78,
        minTravelDistance: 72,
        playerWelfare: 77,
        attendance: 73,
        scheduleFairness: 79,
        specialEvents: 70,
      };
      
      const scheduleMetrics = [
        { date: '2025-01-15', score: 75, games: 3, conflicts: 1, travelMiles: 1200 },
      ];
      
      const teamMetrics = [
        { team: 'Kansas', homeGames: 5, awayGames: 5, avgTravelDistance: 450, restDays: 40, backToBackGames: 2 },
      ];
      
      const { rerender } = render(
        <div>
          <DragDropScheduleBuilder
            games={games}
            timeSlots={timeSlots}
            constraints={[]}
            onGameMove={mockOnGameMove}
          />
          <COMPASSAnalyticsDashboard
            compassScore={compassScore}
            scheduleMetrics={scheduleMetrics}
            teamMetrics={teamMetrics}
            onRefresh={mockOnRefresh}
          />
        </div>
      );
      
      // Initial state
      expect(screen.getByText('75')).toBeInTheDocument(); // COMPASS score
      expect(screen.getByText('Active Conflicts')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Conflicts count
      
      // Make a schedule change
      const gameCard = screen.getByText('Kansas').closest('.ft-draggable-game');
      const dropZone = screen.getByText('Foster Pavilion').closest('.ft-drop-zone');
      
      fireEvent.dragStart(gameCard!);
      fireEvent.drop(dropZone!);
      
      await waitFor(() => {
        expect(mockOnGameMove).toHaveBeenCalled();
      });
      
      // Update metrics after change
      const updatedScore = { ...compassScore, overall: 85 };
      const updatedMetrics = [
        { date: '2025-01-15', score: 85, games: 3, conflicts: 0, travelMiles: 1000 },
      ];
      
      rerender(
        <div>
          <DragDropScheduleBuilder
            games={games}
            timeSlots={timeSlots}
            constraints={[]}
            onGameMove={mockOnGameMove}
          />
          <COMPASSAnalyticsDashboard
            compassScore={updatedScore}
            scheduleMetrics={updatedMetrics}
            teamMetrics={teamMetrics}
            onRefresh={mockOnRefresh}
          />
        </div>
      );
      
      // Verify analytics updated
      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument(); // New score
        expect(screen.getByText('0')).toBeInTheDocument(); // No conflicts
      });
      
      // Test refresh functionality
      await user.click(screen.getByText('Refresh'));
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });
  
  describe('Mobile Integration', () => {
    it('should work seamlessly on mobile devices', async () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        writable: true,
      });
      
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));
      
      render(
        <div>
          <DragDropScheduleBuilder
            games={games}
            timeSlots={timeSlots}
            constraints={[]}
            onGameMove={mockOnGameMove}
          />
        </div>
      );
      
      // Verify mobile-optimized rendering
      expect(screen.getByText('Unscheduled Games')).toBeInTheDocument();
      expect(screen.getByText('Schedule Grid')).toBeInTheDocument();
      
      // Components should be touch-ready
      const gameCards = screen.getAllByText(/Kansas|Baylor|Iowa State/);
      expect(gameCards.length).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup();
      
      // Mock failed game move
      mockOnGameMove.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <DragDropScheduleBuilder
          games={games}
          timeSlots={timeSlots}
          constraints={[]}
          onGameMove={mockOnGameMove}
        />
      );
      
      const gameCard = screen.getByText('Kansas').closest('.ft-draggable-game');
      const dropZone = screen.getByText('Allen Fieldhouse').closest('.ft-drop-zone');
      
      fireEvent.dragStart(gameCard!);
      fireEvent.drop(dropZone!);
      
      await waitFor(() => {
        expect(mockOnGameMove).toHaveBeenCalled();
        // Error should be handled without crashing
        expect(screen.getByText('Unscheduled Games')).toBeInTheDocument();
      });
    });
    
    it('should handle WebSocket disconnection', async () => {
      render(
        <RealtimeCollaboration
          scheduleId="test-schedule"
          currentUser={testUser}
          onScheduleChange={mockOnScheduleChange}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
      
      // Simulate disconnection
      const mockWebSocket = (global as any).WebSocket.instances[0];
      mockWebSocket.close();
      
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
      
      // Should attempt to reconnect
      await waitFor(() => {
        expect((global as any).WebSocket.instances.length).toBeGreaterThan(1);
      }, { timeout: 4000 });
    });
  });
  
  describe('Performance Under Load', () => {
    it('should handle large numbers of games efficiently', async () => {
      const manyGames = Array.from({ length: 100 }, (_, i) => 
        mockGame({ 
          id: `game-${i}`, 
          homeTeam: `Team ${i}`, 
          awayTeam: `Team ${i + 100}`,
          date: i < 50 ? undefined : '2025-01-15',
          time: i < 50 ? undefined : '19:00',
        })
      );
      
      const manySlots = Array.from({ length: 50 }, (_, i) => 
        mockTimeSlot({ 
          date: `2025-01-${15 + i}`, 
          time: '19:00', 
          venue: `Venue ${i}` 
        })
      );
      
      const start = performance.now();
      
      render(
        <DragDropScheduleBuilder
          games={manyGames}
          timeSlots={manySlots}
          constraints={[]}
          onGameMove={mockOnGameMove}
        />
      );
      
      const renderTime = performance.now() - start;
      
      // Should render within performance budget
      expect(renderTime).toBeLessThan(2000);
      
      // Should display all elements
      expect(screen.getByText('Unscheduled Games')).toBeInTheDocument();
      expect(screen.getAllByText(/Team \d+/).length).toBeGreaterThan(20);
    });
    
    it('should handle rapid user interactions', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup();
      
      render(
        <div>
          <DragDropScheduleBuilder
            games={games}
            timeSlots={timeSlots}
            constraints={[]}
            onGameMove={mockOnGameMove}
          />
          <RealtimeCollaboration
            scheduleId="test-schedule"
            currentUser={testUser}
            onScheduleChange={mockOnScheduleChange}
          />
        </div>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
      
      // Rapid mouse movements for cursor tracking
      const movements = Array.from({ length: 20 }, (_, i) => ({ x: i * 10, y: i * 10 }));
      
      movements.forEach(pos => {
        fireEvent.mouseMove(document, { clientX: pos.x, clientY: pos.y });
      });
      
      // Should throttle updates appropriately
      const mockWebSocket = (global as any).WebSocket.instances[0];
      const sendSpy = vi.spyOn(mockWebSocket, 'send');
      
      await waitFor(() => {
        // Should not send all 20 updates due to throttling
        expect(sendSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});