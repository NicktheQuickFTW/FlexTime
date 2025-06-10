import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  Collapse,
  Card,
  CardContent,
  Grid,
  Button,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Constraint, ConstraintType, ConstraintCategory } from '../../types';

interface ConstraintListProps {
  constraints: Constraint[];
  onEdit: (constraint: Constraint) => void;
  onDelete: (constraintId: number) => void;
  scheduleId: number;
}

const ConstraintList: React.FC<ConstraintListProps> = ({
  constraints,
  onEdit,
  onDelete,
  scheduleId
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConstraintType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ConstraintCategory | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredConstraints = useMemo(() => {
    return constraints.filter(constraint => {
      const matchesSearch = searchTerm === '' || 
        JSON.stringify(constraint).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === '' || constraint.type === typeFilter;
      const matchesCategory = categoryFilter === '' || constraint.category === categoryFilter;
      
      let matchesPriority = true;
      if (priorityFilter === 'high') matchesPriority = constraint.priority >= 8;
      else if (priorityFilter === 'medium') matchesPriority = constraint.priority >= 5 && constraint.priority < 8;
      else if (priorityFilter === 'low') matchesPriority = constraint.priority < 5;
      
      return matchesSearch && matchesType && matchesCategory && matchesPriority;
    });
  }, [constraints, searchTerm, typeFilter, categoryFilter, priorityFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRowExpansion = (constraintId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(constraintId)) {
      newExpanded.delete(constraintId);
    } else {
      newExpanded.add(constraintId);
    }
    setExpandedRows(newExpanded);
  };

  const getCategoryColor = (category: ConstraintCategory) => {
    switch (category) {
      case ConstraintCategory.TEAM:
        return '#2196F3';
      case ConstraintCategory.VENUE:
        return '#FFC627';
      case ConstraintCategory.SCHEDULE:
        return '#AB0520';
      default:
        return '#9E9E9E';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return '#F44336';
    if (priority >= 5) return '#FFA726';
    return '#66BB6A';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
  };

  const formatConstraintType = (type: ConstraintType): string => {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  const renderParameterValue = (key: string, value: any): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <Box>
          {value.map((item, index) => (
            <Chip 
              key={index} 
              label={item} 
              size="small" 
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      );
    } else if (typeof value === 'boolean') {
      return <Chip label={value ? 'Yes' : 'No'} size="small" color={value ? 'success' : 'default'} />;
    } else if (typeof value === 'object' && value !== null) {
      return <pre style={{ margin: 0, fontSize: '0.875rem' }}>{JSON.stringify(value, null, 2)}</pre>;
    }
    return value?.toString() || '-';
  };

  const constraintStats = useMemo(() => {
    const stats = {
      total: constraints.length,
      high: constraints.filter(c => c.priority >= 8).length,
      medium: constraints.filter(c => c.priority >= 5 && c.priority < 8).length,
      low: constraints.filter(c => c.priority < 5).length,
      byCategory: {
        [ConstraintCategory.TEAM]: constraints.filter(c => c.category === ConstraintCategory.TEAM).length,
        [ConstraintCategory.VENUE]: constraints.filter(c => c.category === ConstraintCategory.VENUE).length,
        [ConstraintCategory.SCHEDULE]: constraints.filter(c => c.category === ConstraintCategory.SCHEDULE).length,
      }
    };
    return stats;
  }, [constraints]);

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha('#2196F3', 0.1) }}>
            <CardContent>
              <Typography variant="h6">{constraintStats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Constraints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha('#F44336', 0.1) }}>
            <CardContent>
              <Typography variant="h6">{constraintStats.high}</Typography>
              <Typography variant="body2" color="text.secondary">High Priority</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha('#FFA726', 0.1) }}>
            <CardContent>
              <Typography variant="h6">{constraintStats.medium}</Typography>
              <Typography variant="body2" color="text.secondary">Medium Priority</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha('#66BB6A', 0.1) }}>
            <CardContent>
              <Typography variant="h6">{constraintStats.low}</Typography>
              <Typography variant="body2" color="text.secondary">Low Priority</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search constraints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant={showFilters ? "contained" : "outlined"}
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </Stack>

          <Collapse in={showFilters}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as ConstraintType | '')}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.values(ConstraintType).map(type => (
                    <MenuItem key={type} value={type}>
                      {formatConstraintType(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as ConstraintCategory | '')}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Object.values(ConstraintCategory).map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="high">High (8-10)</MenuItem>
                  <MenuItem value="medium">Medium (5-7)</MenuItem>
                  <MenuItem value="low">Low (1-4)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      {/* Constraints Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredConstraints
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((constraint) => (
                <React.Fragment key={constraint.constraint_id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRowExpansion(constraint.constraint_id!)}
                      >
                        {expandedRows.has(constraint.constraint_id!) ? 
                          <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatConstraintType(constraint.type)}
                      </Typography>
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
                        label={`${constraint.priority} - ${getPriorityLabel(constraint.priority)}`}
                        size="small"
                        icon={constraint.priority >= 8 ? <WarningIcon /> : undefined}
                        sx={{
                          bgcolor: getPriorityColor(constraint.priority),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {Object.entries(constraint.parameters)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(constraint)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(constraint.constraint_id!)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0 }}>
                      <Collapse in={expandedRows.has(constraint.constraint_id!)} timeout="auto">
                        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" gutterBottom>
                                <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
                                Constraint Details
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="caption" color="text.secondary">
                                Parameters:
                              </Typography>
                              {Object.entries(constraint.parameters).map(([key, value]) => (
                                <Box key={key} sx={{ mt: 1 }}>
                                  <Typography variant="body2" component="span" fontWeight="medium">
                                    {key}:
                                  </Typography>
                                  <Box sx={{ ml: 2, mt: 0.5 }}>
                                    {renderParameterValue(key, value)}
                                  </Box>
                                </Box>
                              ))}
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="caption" color="text.secondary">
                                Applied to:
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {constraint.teams && constraint.teams.length > 0 ? (
                                  constraint.teams.map((team) => (
                                    <Chip
                                      key={team.team_id}
                                      label={team.name}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    All teams
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredConstraints.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default ConstraintList;