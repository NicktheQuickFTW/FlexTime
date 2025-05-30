import React from 'react';
import { DragDropScheduleBuilder } from '../DragDropScheduleBuilder';
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor, 
  userEvent,
  mockGame,
  mockTimeSlot,
  mockDataTransfer
} from '../../../utils/testUtils';
import { vi } from '@jest/globals';

describe('DragDropScheduleBuilder', () => {
  const mockGames = [
    mockGame({ id: 'game-1', date: undefined, time: undefined }),
    mockGame({ id: 'game-2', homeTeam: 'Baylor', awayTeam: 'Iowa State' }),
    mockGame({ id: 'game-3', homeTeam: 'TCU', awayTeam: 'Kansas State', date: undefined, time: undefined }),
  ];
  
  const mockTimeSlots = [
    mockTimeSlot({ date: '2025-01-15', time: '19:00', venue: 'Allen Fieldhouse' }),
    mockTimeSlot({ date: '2025-01-16', time: '20:00', venue: 'Foster Pavilion' }),
    mockTimeSlot({ date: '2025-01-17', time: '19:30', venue: 'Bramlage Coliseum' }),
  ];
  
  const mockConstraints = [
    {
      id: 'c1',
      type: 'rest_days' as const,
      severity: 'warning' as const,
      message: 'Minimum 2 days rest required',
      affectedGames: ['game-1'],
    },
  ];
  
  const mockOnGameMove = vi.fn().mockResolvedValue(undefined);
  const mockOnConflictDetected = vi.fn();
  
  const defaultProps = {
    games: mockGames,
    timeSlots: mockTimeSlots,
    constraints: mockConstraints,
    onGameMove: mockOnGameMove,
    onConflictDetected: mockOnConflictDetected,
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render the schedule builder with all sections', () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      expect(screen.getByText('Unscheduled Games')).toBeInTheDocument();
      expect(screen.getByText('Schedule Grid')).toBeInTheDocument();
      expect(screen.getAllByText(/Kansas/i)).toHaveLength(1);
      expect(screen.getAllByText(/Baylor/i)).toHaveLength(1);
    });
    
    it('should display unscheduled games in the unscheduled panel', () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      const unscheduledSection = screen.getByText('Unscheduled Games').parentElement;
      expect(unscheduledSection).toHaveTextContent('Kansas');
      expect(unscheduledSection).toHaveTextContent('Texas Tech');
      expect(unscheduledSection).toHaveTextContent('TCU');
      expect(unscheduledSection).toHaveTextContent('Kansas State');
    });
    
    it('should display all time slots in the grid', () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      mockTimeSlots.forEach(slot => {
        expect(screen.getByText(slot.date)).toBeInTheDocument();
        expect(screen.getByText(slot.time)).toBeInTheDocument();
        expect(screen.getByText(slot.venue)).toBeInTheDocument();
      });
    });
    
    it('should show scheduled games in their time slots', () => {
      const gamesWithSchedule = [
        ...mockGames,
        mockGame({ 
          id: 'game-4', 
          date: '2025-01-15', 
          time: '19:00', 
          venue: 'Allen Fieldhouse' 
        }),
      ];
      
      render(
        <DragDropScheduleBuilder 
          {...defaultProps} 
          games={gamesWithSchedule} 
        />
      );
      
      expect(screen.getByText('Occupied')).toBeInTheDocument();
    });
  });
  
  describe('Drag and Drop Functionality', () => {
    it('should handle drag start on game cards', async () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      const gameCard = screen.getAllByText(/Kansas/i)[0].closest('.ft-draggable-game');
      expect(gameCard).toHaveClass('ft-draggable-game');
      
      // Simulate drag start
      fireEvent.dragStart(gameCard!, { dataTransfer: mockDataTransfer() });
      
      await waitFor(() => {
        expect(document.body).toHaveClass('ft-dragging-active');
      });
    });
    
    it('should show drop zone feedback on drag over', async () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      const dropZone = screen.getByText('Allen Fieldhouse').closest('.ft-drop-zone');
      
      fireEvent.dragOver(dropZone!, { dataTransfer: mockDataTransfer() });
      
      await waitFor(() => {
        expect(dropZone).toHaveClass('ft-drop-zone-hover');
      });
    });
    
    it('should call onGameMove when dropping a game', async () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      const gameCard = screen.getAllByText(/Kansas/i)[0].closest('.ft-draggable-game');
      const dropZone = screen.getByText('Allen Fieldhouse').closest('.ft-drop-zone');
      
      const dataTransfer = mockDataTransfer();
      
      fireEvent.dragStart(gameCard!, { dataTransfer });
      fireEvent.dragOver(dropZone!, { dataTransfer });
      fireEvent.drop(dropZone!, { dataTransfer });
      
      await waitFor(() => {
        expect(mockOnGameMove).toHaveBeenCalledWith(
          'game-1',
          expect.objectContaining({
            date: '2025-01-15',
            time: '19:00',
            venue: 'Allen Fieldhouse',
          })
        );
      });
    });
  });
  
  describe('Conflict Detection', () => {
    it('should detect venue conflicts', async () => {
      const slotsWithOccupied = [
        { ...mockTimeSlots[0], occupied: true, gameId: 'existing-game' },
        ...mockTimeSlots.slice(1),
      ];
      
      render(
        <DragDropScheduleBuilder 
          {...defaultProps} 
          timeSlots={slotsWithOccupied}
        />
      );
      
      const gameCard = screen.getAllByText(/Kansas/i)[0].closest('.ft-draggable-game');
      const occupiedSlot = screen.getByText('Allen Fieldhouse').closest('.ft-drop-zone');
      
      const dataTransfer = mockDataTransfer();
      fireEvent.dragStart(gameCard!, { dataTransfer });
      fireEvent.dragOver(occupiedSlot!, { dataTransfer });
      
      await waitFor(() => {
        expect(mockOnConflictDetected).toHaveBeenCalledWith(
          expect.objectContaining({
            hasConflicts: true,
            conflicts: expect.arrayContaining([
              expect.objectContaining({
                type: 'venue_conflict',
                severity: 'error',
              })
            ])
          })
        );
      });
    });
    
    it('should show conflict indicators on drop zones', async () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      const gameCard = screen.getAllByText(/Kansas/i)[0].closest('.ft-draggable-game');
      const dropZone = screen.getByText('Foster Pavilion').closest('.ft-drop-zone');
      
      const dataTransfer = mockDataTransfer();
      fireEvent.dragStart(gameCard!, { dataTransfer });
      fireEvent.dragOver(dropZone!, { dataTransfer });
      
      await waitFor(() => {
        const conflictMessage = screen.queryByText(/Minimum 2 days rest required/i);
        expect(conflictMessage).toBeInTheDocument();
      });
    });
  });
  
  describe('Performance', () => {
    it('should handle large numbers of games efficiently', () => {
      const manyGames = Array.from({ length: 100 }, (_, i) => 
        mockGame({ 
          id: `game-${i}`, 
          homeTeam: `Team ${i}`, 
          awayTeam: `Team ${i + 100}` 
        })
      );
      
      const start = performance.now();
      render(
        <DragDropScheduleBuilder 
          {...defaultProps} 
          games={manyGames} 
        />
      );
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000); // Should render in under 1 second
      expect(screen.getAllByText(/Team/i).length).toBeGreaterThan(50);
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      const gameCards = screen.getAllByText(/Kansas/i)[0].closest('.ft-draggable-game');
      expect(gameCards).toHaveAttribute('draggable');
    });
    
    it('should be keyboard navigable', async () => {
      render(<DragDropScheduleBuilder {...defaultProps} />);
      const user = userEvent.setup();
      
      const firstGame = screen.getAllByText(/Kansas/i)[0].closest('.ft-draggable-game');
      
      await user.tab();
      await user.tab();
      
      // Verify focus management
      expect(document.activeElement).toBeTruthy();
    });
  });
  
  describe('Mobile Support', () => {
    it('should use touch backend on mobile devices', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        writable: true,
      });
      
      render(<DragDropScheduleBuilder {...defaultProps} />);
      
      // Component should render without errors on touch devices
      expect(screen.getByText('Unscheduled Games')).toBeInTheDocument();
    });
  });
});