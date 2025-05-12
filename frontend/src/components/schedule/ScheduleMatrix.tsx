import React, { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import GlassmorphicCard from '../common/GlassmorphicCard';
import MatrixCell from './MatrixCell';

export interface CellCoordinates {
  id: string;
  row: number;
  column: number;
}

export interface ScheduleSlot {
  id: string;
  teamHome?: string;
  teamAway?: string;
  venue?: string;
  time?: string;
  date?: string;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  row: number;
  column: number;
}

interface ScheduleMatrixProps {
  scheduleData: ScheduleSlot[];
  onCellUpdate?: (updatedCell: ScheduleSlot) => void;
}

const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({ 
  scheduleData, 
  onCellUpdate 
}) => {
  const [selectedCell, setSelectedCell] = useState<CellCoordinates | null>(null);
  const [draggedItem, setDraggedItem] = useState<ScheduleSlot | null>(null);
  const theme = useTheme();

  // Find the maximum row and column to determine grid dimensions
  const maxRow = Math.max(...scheduleData.map(slot => slot.row), 0);
  const maxColumn = Math.max(...scheduleData.map(slot => slot.column), 0);
  
  // Create a 2D array to represent the grid
  const grid: (ScheduleSlot | null)[][] = Array(maxRow + 1).fill(null)
    .map(() => Array(maxColumn + 1).fill(null));
  
  // Fill the grid with schedule data
  scheduleData.forEach(slot => {
    grid[slot.row][slot.column] = slot;
  });
  
  const handleDragStart = (item: ScheduleSlot) => {
    setDraggedItem(item);
  };
  
  const handleDrop = (targetCell: CellCoordinates) => {
    if (!draggedItem) return;
    
    // Create updated item with new coordinates
    const updatedItem: ScheduleSlot = {
      ...draggedItem,
      row: targetCell.row,
      column: targetCell.column
    };
    
    // Call the update callback
    if (onCellUpdate) {
      onCellUpdate(updatedItem);
    }
    
    setDraggedItem(null);
  };
  
  return (
    <GlassmorphicCard sx={{
      p: 3,
      overflow: 'auto',
      maxHeight: '80vh'
    }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Championship Schedule Matrix
      </Typography>
      
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${maxColumn + 1}, minmax(120px, 1fr))`,
        gap: 1,
        position: 'relative',
      }}>
        {/* Column headers (dates) */}
        <Box sx={{ gridColumn: '1 / 1', gridRow: '1 / 1' }}></Box>
        {Array(maxColumn + 1).fill(null).map((_, colIndex) => (
          <Box 
            key={`col-${colIndex}`} 
            sx={{ 
              gridColumn: `${colIndex + 2} / ${colIndex + 3}`, 
              gridRow: '1 / 1',
              p: 1,
              textAlign: 'center',
              fontWeight: 600,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            {/* Replace with actual date formatting */}
            Day {colIndex + 1}
          </Box>
        ))}
        
        {/* Row headers (time slots) */}
        {Array(maxRow + 1).fill(null).map((_, rowIndex) => (
          <Box 
            key={`row-${rowIndex}`} 
            sx={{ 
              gridColumn: '1 / 1', 
              gridRow: `${rowIndex + 2} / ${rowIndex + 3}`,
              p: 1,
              fontWeight: 600,
              borderRight: `1px solid ${theme.palette.divider}`
            }}
          >
            {/* Replace with actual time formatting */}
            {rowIndex % 2 === 0 ? `${8 + Math.floor(rowIndex / 2)}:00 AM` : `${8 + Math.floor(rowIndex / 2)}:30 AM`}
          </Box>
        ))}
        
        {/* Matrix cells */}
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const cellId = `cell-${rowIndex}-${colIndex}`;
            return (
              <Box 
                key={cellId}
                sx={{ 
                  gridColumn: `${colIndex + 2} / ${colIndex + 3}`, 
                  gridRow: `${rowIndex + 2} / ${rowIndex + 3}`,
                }}
              >
                <MatrixCell
                  data={cell || { id: cellId, row: rowIndex, column: colIndex }}
                  isSelected={selectedCell?.id === cellId}
                  onSelect={() => setSelectedCell({ id: cellId, row: rowIndex, column: colIndex })}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  isEmpty={!cell}
                />
              </Box>
            );
          })
        ))}
      </Box>
    </GlassmorphicCard>
  );
};

export default ScheduleMatrix;
