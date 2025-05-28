import React from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import { ScheduleSlot, CellCoordinates } from './ScheduleMatrix';
import { SportType } from '../../types';
import { useSportConfigContext } from '../../contexts/SportConfigContext';

interface MatrixCellProps {
  data: ScheduleSlot;
  isSelected: boolean;
  isEmpty?: boolean;
  onSelect: () => void;
  onDragStart: (item: ScheduleSlot) => void;
  onDrop: (targetCell: CellCoordinates) => void;
}

const MatrixCell: React.FC<MatrixCellProps> = ({
  data,
  isSelected,
  isEmpty = false,
  onSelect,
  onDragStart,
  onDrop
}) => {
  const theme = useTheme();
  const { currentSportType } = useSportConfigContext();
  
  const getStatusColor = (status?: string) => {
    if (!status) return theme.palette.grey[400];
    
    switch (status) {
      case 'scheduled':
        return theme.palette.info.main;
      case 'in-progress':
        return theme.palette.success.main;
      case 'completed':
        return theme.palette.grey[600];
      case 'cancelled':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[400];
    }
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    if (isEmpty) return;
    
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.currentTarget.style.opacity = '0.5';
    onDragStart(data);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const targetCell: CellCoordinates = {
      id: data.id,
      row: data.row,
      column: data.column
    };
    
    onDrop(targetCell);
  };
  
  return (
    <Box
      draggable={!isEmpty}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onSelect}
      sx={{
        height: '100%',
        minHeight: 80,
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${isSelected 
          ? theme.palette.primary.main 
          : theme.palette.divider}`,
        background: isEmpty 
          ? 'transparent' 
          : theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
        cursor: isEmpty ? 'default' : 'grab',
        boxShadow: isSelected 
          ? `0 0 0 2px ${theme.palette.primary.main}` 
          : 'none',
        '&:hover': {
          background: isEmpty 
            ? theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(255, 255, 255, 0.5)'
            : theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(255, 255, 255, 0.85)',
          transform: isEmpty ? 'none' : 'translateY(-2px)',
          boxShadow: isEmpty 
            ? 'none' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        '&:active': {
          cursor: isEmpty ? 'default' : 'grabbing',
          transform: isEmpty ? 'none' : 'scale(0.98)',
        },
      }}
    >
      {!isEmpty && data.teamHome && data.teamAway ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {data.time || ''}
            </Typography>
            
            {data.status && (
              <Chip
                label={data.status}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  backgroundColor: getStatusColor(data.status),
                  color: theme.palette.getContrastText(getStatusColor(data.status)),
                }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {data.teamHome}
            </Typography>
            <Typography variant="body2">
              {data.teamAway}
            </Typography>
          </Box>
          
          {data.venue && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: theme.palette.text.secondary }}>
              {data.venue}
            </Typography>
          )}
        </>
      ) : (
        isEmpty && (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: theme.palette.text.disabled
          }}>
            <Typography variant="caption">Empty Slot</Typography>
          </Box>
        )
      )}
    </Box>
  );
};

export default MatrixCell;
