import React from 'react';
import { RealtimeCollaboration } from '../RealtimeCollaboration';
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor, 
  userEvent,
  mockUser,
  MockWebSocket
} from '../../../utils/testUtils';
// Global vi is available from setupTests

// Mock WebSocket globally
global.WebSocket = MockWebSocket as any;

describe('RealtimeCollaboration', () => {
  const mockCurrentUser = mockUser({
    id: 'current-user',
    name: 'Current User',
    email: 'current@flextime.com',
  });
  
  const mockOnScheduleChange = vi.fn();
  const mockOnConflictDetected = vi.fn();
  
  const defaultProps = {
    scheduleId: 'schedule-123',
    currentUser: mockCurrentUser,
    wsUrl: 'wss://api.flextime.com/collaboration',
    onScheduleChange: mockOnScheduleChange,
    onConflictDetected: mockOnConflictDetected,
  };
  
  let mockWebSocket: MockWebSocket;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Capture WebSocket instance
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const originalWebSocket = global.WebSocket;
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        mockWebSocket = this;
      }
    } as any;
  });
  
  describe('Connection Management', () => {
    it('should establish WebSocket connection on mount', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
        expect(mockWebSocket.url).toBe(`${defaultProps.wsUrl}/${defaultProps.scheduleId}`);
        expect(mockWebSocket.readyState).toBe(WebSocket.OPEN);
      });
    });
    
    it('should send user joined message on connection', async () => {
      const sendSpy = vi.spyOn(MockWebSocket.prototype, 'send');
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"user_joined"')
        );
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"userId":"current-user"')
        );
      });
    });
    
    it('should show connection status', () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Collaboration On')).toBeInTheDocument();
    });
    
    it('should handle disconnection', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      // Simulate disconnection
      mockWebSocket.close();
      
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });
  });
  
  describe('Collaboration Toggle', () => {
    it('should toggle collaboration on/off', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      const user = userEvent.setup();
      
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeChecked();
      
      await user.click(toggle);
      
      expect(toggle).not.toBeChecked();
      expect(screen.getByText('Collaboration Off')).toBeInTheDocument();
    });
    
    it('should close WebSocket when collaboration is turned off', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const closeSpy = vi.spyOn(mockWebSocket, 'close');
      const toggle = screen.getByRole('checkbox');
      
      await user.click(toggle);
      
      expect(closeSpy).toHaveBeenCalled();
    });
  });
  
  describe('Active Users Panel', () => {
    it('should show active collaborators', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      // Simulate another user joining
      const newUser = mockUser({
        id: 'user-2',
        name: 'Jane Doe',
        color: '#ff6b6b',
      });
      
      mockWebSocket.simulateMessage({
        type: 'user_joined',
        userId: newUser.id,
        data: newUser,
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('Active Collaborators (1)')).toBeInTheDocument();
      });
    });
    
    it('should show user status', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const activeUser = mockUser({
        id: 'user-3',
        name: 'Active User',
        cursor: { x: 100, y: 200 },
      });
      
      mockWebSocket.simulateMessage({
        type: 'user_joined',
        userId: activeUser.id,
        data: activeUser,
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });
    
    it('should handle user leaving', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      // Add a user
      const leavingUser = mockUser({ id: 'user-4', name: 'Leaving User' });
      mockWebSocket.simulateMessage({
        type: 'user_joined',
        userId: leavingUser.id,
        data: leavingUser,
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Leaving User')).toBeInTheDocument();
      });
      
      // User leaves
      mockWebSocket.simulateMessage({
        type: 'user_left',
        userId: leavingUser.id,
        data: {},
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Leaving User')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Live Changes Feed', () => {
    it('should display schedule changes', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      mockWebSocket.simulateMessage({
        type: 'schedule_change',
        userId: 'user-5',
        data: {
          userName: 'John Smith',
          type: 'move',
          description: 'moved Kansas vs Texas Tech to Jan 20',
          gameId: 'game-456',
        },
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText(/moved Kansas vs Texas Tech/)).toBeInTheDocument();
        expect(screen.getByText('just now')).toBeInTheDocument();
      });
    });
    
    it('should show appropriate icons for change types', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const changeTypes = [
        { type: 'move', icon: '↔️' },
        { type: 'add', icon: '➕' },
        { type: 'delete', icon: '❌' },
        { type: 'edit', icon: '✏️' },
      ];
      
      for (const change of changeTypes) {
        mockWebSocket.simulateMessage({
          type: 'schedule_change',
          userId: `user-${change.type}`,
          data: {
            userName: 'Test User',
            type: change.type,
            description: `${change.type} action`,
          },
          timestamp: new Date(),
        });
      }
      
      await waitFor(() => {
        changeTypes.forEach(change => {
          expect(screen.getByText(change.icon)).toBeInTheDocument();
        });
      });
    });
    
    it('should call onScheduleChange callback', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const changeData = {
        userName: 'Test User',
        type: 'move',
        description: 'moved game',
        gameId: 'game-789',
      };
      
      mockWebSocket.simulateMessage({
        type: 'schedule_change',
        userId: 'user-6',
        data: changeData,
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(mockOnScheduleChange).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'move',
            description: 'moved game',
            gameId: 'game-789',
          })
        );
      });
    });
  });
  
  describe('Conflict Resolution', () => {
    it('should display conflict resolution panel', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const conflict = {
        id: 'conflict-1',
        conflictType: 'Venue Overlap',
        severity: 'error',
        affectedGames: ['game-1', 'game-2'],
        proposedSolution: 'Move game-2 to alternate venue',
      };
      
      mockWebSocket.simulateMessage({
        type: 'conflict_detected',
        userId: 'system',
        data: conflict,
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Conflicts Detected (1)')).toBeInTheDocument();
        expect(screen.getByText('Venue Overlap')).toBeInTheDocument();
        expect(screen.getByText('Affects: game-1, game-2')).toBeInTheDocument();
        expect(screen.getByText(/Move game-2 to alternate venue/)).toBeInTheDocument();
      });
    });
    
    it('should handle conflict resolution', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const conflict = {
        id: 'conflict-2',
        conflictType: 'Time Conflict',
        severity: 'warning',
        affectedGames: ['game-3'],
        proposedSolution: 'Adjust start time',
      };
      
      mockWebSocket.simulateMessage({
        type: 'conflict_detected',
        userId: 'system',
        data: conflict,
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Apply Solution')).toBeInTheDocument();
      });
      
      const sendSpy = vi.spyOn(mockWebSocket, 'send');
      await user.click(screen.getByText('Apply Solution'));
      
      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"conflict_resolved"')
      );
    });
    
    it('should handle conflict dismissal', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const conflict = {
        id: 'conflict-3',
        conflictType: 'Minor Warning',
        severity: 'info',
        affectedGames: ['game-4'],
      };
      
      mockWebSocket.simulateMessage({
        type: 'conflict_detected',
        userId: 'system',
        data: conflict,
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Dismiss')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Dismiss'));
      
      await waitFor(() => {
        expect(screen.queryByText('Minor Warning')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Cursor Tracking', () => {
    it('should send cursor position updates', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const sendSpy = vi.spyOn(mockWebSocket, 'send');
      
      // Simulate mouse movement
      fireEvent.mouseMove(document, { clientX: 100, clientY: 200 });
      
      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"cursor_move"')
        );
      });
    });
    
    it('should display other users cursors', async () => {
      const { container } = render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const otherUser = mockUser({
        id: 'user-7',
        name: 'Other User',
        color: '#4ecdc4',
      });
      
      // User joins
      mockWebSocket.simulateMessage({
        type: 'user_joined',
        userId: otherUser.id,
        data: otherUser,
        timestamp: new Date(),
      });
      
      // User moves cursor
      mockWebSocket.simulateMessage({
        type: 'cursor_move',
        userId: otherUser.id,
        data: { x: 300, y: 400 },
        timestamp: new Date(),
      });
      
      await waitFor(() => {
        const cursor = container.querySelector('.ft-user-cursor');
        expect(cursor).toBeInTheDocument();
        expect(cursor).toHaveStyle({ left: '300px', top: '400px' });
      });
    });
  });
  
  describe('Performance', () => {
    it('should throttle cursor updates', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      const sendSpy = vi.spyOn(mockWebSocket, 'send');
      sendSpy.mockClear();
      
      // Rapid mouse movements
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(document, { clientX: i * 10, clientY: i * 10 });
      }
      
      // Should throttle updates
      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledTimes(1);
      });
    });
    
    it('should limit number of displayed changes', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      });
      
      // Send many changes
      for (let i = 0; i < 20; i++) {
        mockWebSocket.simulateMessage({
          type: 'schedule_change',
          userId: `user-${i}`,
          data: {
            userName: `User ${i}`,
            type: 'move',
            description: `Change ${i}`,
          },
          timestamp: new Date(),
        });
      }
      
      await waitFor(() => {
        const changeItems = screen.getAllByText(/Change \d+/);
        expect(changeItems.length).toBeLessThanOrEqual(10); // Max 10 items
      });
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      
      expect(screen.getByRole('checkbox')).toHaveAccessibleName();
    });
    
    it('should be keyboard navigable', async () => {
      render(<RealtimeCollaboration {...defaultProps} />);
      const user = userEvent.setup();
      
      await user.tab();
      expect(screen.getByRole('checkbox')).toHaveFocus();
    });
  });
});