import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Rule as RuleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Constraint, ConstraintType, ConstraintCategory } from '../../types';
import { ScheduleService } from '../../services/api';

interface ConstraintsTableProps {
  constraints: Constraint[];
  scheduleId: number;
  onConstraintUpdated: () => void;
}

const ConstraintsTable: React.FC<ConstraintsTableProps> = ({ constraints, scheduleId, onConstraintUpdated }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [constraintToDelete, setConstraintToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (constraintId: number) => {
    setConstraintToDelete(constraintId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (constraintToDelete) {
      try {
        const response = await ScheduleService.deleteConstraint(scheduleId, constraintToDelete);
        if (response.success) {
          onConstraintUpdated();
        } else {
          setError(response.error || 'Failed to delete constraint');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      }
    }
    setDeleteDialogOpen(false);
    setConstraintToDelete(null);
  };

  const getCategoryColor = (category: ConstraintCategory) => {
    switch (category) {
      case ConstraintCategory.TEAM:
        return '#2196F3'; // Blue
      case ConstraintCategory.VENUE:
        return '#FFC627'; // ASU Gold
      case ConstraintCategory.SCHEDULE:
        return '#AB0520'; // Big 12 cardinal red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 9) return '#F44336'; // High - Red
    if (priority >= 5) return '#FFA726'; // Medium - Orange
    return '#66BB6A'; // Low - Green
  };

  const formatConstraintType = (type: ConstraintType): string => {
    // Convert from camelCase to readable format
    return type.replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const formatConstraintParameters = (parameters: Record<string, any>): string => {
    try {
      const paramEntries = Object.entries(parameters);
      if (paramEntries.length === 0) return 'No parameters';
      
      return paramEntries.map(([key, value]) => {
        // Format key from camelCase to readable
        const formattedKey = key.replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        
        // Format value based on type
        let formattedValue = value;
        if (Array.isArray(value)) {
          formattedValue = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          formattedValue = JSON.stringify(value);
        }
        
        return `${formattedKey}: ${formattedValue}`;
      }).join('; ');
    } catch (error) {
      console.error('Error formatting constraint parameters:', error);
      return 'Error parsing parameters';
    }
  };

  if (constraints.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Constraints
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          This schedule doesn't have any constraints yet.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RuleIcon />}
          onClick={() => navigate(`/schedules/${scheduleId}/constraints/new`)}
        >
          Add First Constraint
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Parameters</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {constraints
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((constraint) => (
                <TableRow key={constraint.constraint_id}>
                  <TableCell>
                    {formatConstraintType(constraint.type)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={constraint.category} 
                      size="small"
                      sx={{ 
                        bgcolor: getCategoryColor(constraint.category),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={constraint.priority} 
                      size="small"
                      sx={{ 
                        bgcolor: getPriorityColor(constraint.priority),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {formatConstraintParameters(constraint.parameters)}
                  </TableCell>
                  <TableCell>
                    {constraint.teams && constraint.teams.length > 0 
                      ? constraint.teams.map(team => team.name).join(', ')
                      : 'All Teams'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Constraint">
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/schedules/${scheduleId}/constraints/${constraint.constraint_id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Constraint">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(constraint.constraint_id!)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={constraints.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Constraint</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this constraint? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConstraintsTable;
