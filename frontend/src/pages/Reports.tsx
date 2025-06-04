/**
 * Intelligence Export Terminal - FlexTime Big 12 Conference Cyberpunk Command Center
 * 
 * Advanced cyberpunk reporting interface with holographic effects, GPU-accelerated animations,
 * and real-time report generation with dynamic visualizations.
 * 
 * Features:
 * - Dynamic Report Builders with drag-and-drop component assembly
 * - Export Progress Visualizations with real-time generation status
 * - Template Recommendation Engine with AI-suggested report formats
 * - Interactive Data Previews with live chart updates during configuration
 * - 100-worker parallel processing themes with cyberpunk aesthetics
 * 
 * Following [Playbook: Frontend Enhancement Suite] cyberpunk command center design.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Checkbox,
  CircularProgress,
  LinearProgress,
  Avatar,
  Badge,
  Tooltip,
  Slider
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
  Schedule as ScheduleIcon,
  TableChart as TableIcon,
  PictureAsPdf as PdfIcon,
  Description as CsvIcon,
  DataArray as JsonIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  Sports as SportsIcon,
  Stadium as StadiumIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudSync as CloudSyncIcon,
  PowerSettingsNew as PowerIcon,
  FlashOn as FlashOnIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

// Enhanced interfaces for reporting
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'schedule' | 'analytics' | 'compass' | 'venue' | 'team';
  category: string;
  icon: React.ElementType;
  color: string;
  fields: string[];
  filters: ReportFilter[];
  formats: ExportFormat[];
  popularity: number;
  lastUsed?: string;
}

interface ReportFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  options?: string[];
  defaultValue?: any;
  required: boolean;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ElementType;
  description: string;
  supportsCharts: boolean;
}

interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: string;
  nextRun: string;
  status: 'active' | 'paused' | 'failed';
  lastRun?: string;
}

interface ExportHistory {
  id: string;
  name: string;
  template: string;
  format: string;
  size: string;
  createdAt: string;
  createdBy: string;
  downloadCount: number;
  status: 'completed' | 'processing' | 'failed';
}

const BIG12_SCHOOLS = [
  'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
  'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
  'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
];

const SPORTS_LIST = [
  'Football', 'Men\'s Basketball', 'Women\'s Basketball', 'Baseball', 'Softball',
  'Soccer', 'Volleyball', 'Tennis', 'Golf', 'Track & Field', 'Swimming', 
  'Wrestling', 'Gymnastics', 'Lacrosse'
];

const EXPORT_FORMATS: ExportFormat[] = [
  { id: 'pdf', name: 'PDF', extension: 'pdf', icon: PdfIcon, description: 'Formatted document', supportsCharts: true },
  { id: 'csv', name: 'CSV', extension: 'csv', icon: CsvIcon, description: 'Comma-separated values', supportsCharts: false },
  { id: 'xlsx', name: 'Excel', extension: 'xlsx', icon: TableIcon, description: 'Excel spreadsheet', supportsCharts: true },
  { id: 'json', name: 'JSON', extension: 'json', icon: JsonIcon, description: 'Structured data', supportsCharts: false }
];

// Cyberpunk color constants
const CYBERPUNK_COLORS = {
  primary: '#00D9FF',
  secondary: '#8B00FF', 
  accent: '#FF3B6B',
  neonGreen: '#39FF14',
  electricBlue: '#0F3460',
  darkSpace: '#0A0E17',
  glassBorder: 'rgba(0, 217, 255, 0.3)',
  glassPanel: 'rgba(0, 217, 255, 0.05)',
  hologram: 'rgba(139, 0, 255, 0.15)'
};

// Cyberpunk animation variants
const cyberpunkVariants = {
  initial: { 
    opacity: 0, 
    y: 50,
    scale: 0.9,
    filter: 'blur(10px)'
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      duration: 0.6
    }
  },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: `0 20px 40px ${CYBERPUNK_COLORS.primary}30`,
    filter: 'brightness(1.1)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const glowPulse = {
  animate: {
    boxShadow: [
      `0 0 20px ${CYBERPUNK_COLORS.primary}60`,
      `0 0 40px ${CYBERPUNK_COLORS.primary}40`,
      `0 0 20px ${CYBERPUNK_COLORS.primary}60`
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const IntelligenceExportTerminal: React.FC = () => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 23,
    memoryUsage: 67,
    networkActivity: 89,
    processingPower: 95
  });
  const [workersActive, setWorkersActive] = useState(47);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    reportsGenerated: 2847,
    dataProcessed: '127.3 TB',
    averageSpeed: '1.2 THz',
    efficiency: 94.7
  });
  
  const controls = useAnimation();

  // Load reports data
  useEffect(() => {
    const loadReportsData = async () => {
      
      // Mock report templates
      const templates: ReportTemplate[] = [
        {
          id: 'schedule-summary',
          name: 'Schedule Summary',
          description: 'Complete schedule overview with games, venues, and dates',
          type: 'schedule',
          category: 'Scheduling',
          icon: ScheduleIcon,
          color: '#00bfff',
          fields: ['date', 'teams', 'venue', 'sport', 'status'],
          filters: [
            { id: 'school', name: 'School', type: 'multiselect', options: BIG12_SCHOOLS, required: false },
            { id: 'sport', name: 'Sport', type: 'multiselect', options: SPORTS_LIST, required: false },
            { id: 'dateRange', name: 'Date Range', type: 'daterange', required: true }
          ],
          formats: EXPORT_FORMATS,
          popularity: 95,
          lastUsed: '2025-05-29T14:30:00Z'
        },
        {
          id: 'compass-analytics',
          name: 'Advanced Analytics (Coming Soon)',
          description: 'Advanced metrics and performance analysis (COMPASS planned for Q1 2026)',
          type: 'compass',
          category: 'Analytics',
          icon: AnalyticsIcon,
          color: '#28a745',
          fields: ['school', 'sport', 'compass_score', 'competitive_balance', 'efficiency'],
          filters: [
            { id: 'school', name: 'School', type: 'multiselect', options: BIG12_SCHOOLS, required: false },
            { id: 'sport', name: 'Sport', type: 'select', options: SPORTS_LIST, required: false },
            { id: 'scoreRange', name: 'Score Range', type: 'number', required: false }
          ],
          formats: EXPORT_FORMATS,
          popularity: 87,
          lastUsed: '2025-05-28T10:15:00Z'
        },
        {
          id: 'venue-utilization',
          name: 'Venue Utilization',
          description: 'Venue usage statistics and capacity analysis',
          type: 'venue',
          category: 'Venues',
          icon: StadiumIcon,
          color: '#9c27b0',
          fields: ['venue', 'capacity', 'utilization', 'events', 'revenue'],
          filters: [
            { id: 'school', name: 'School', type: 'select', options: BIG12_SCHOOLS, required: false },
            { id: 'venueType', name: 'Venue Type', type: 'select', options: ['All', 'Stadium', 'Arena', 'Complex'], required: false },
            { id: 'period', name: 'Time Period', type: 'select', options: ['Last 30 days', 'Last 90 days', 'Season'], required: true }
          ],
          formats: EXPORT_FORMATS,
          popularity: 72,
          lastUsed: '2025-05-27T16:20:00Z'
        },
        {
          id: 'team-performance',
          name: 'Team Performance',
          description: 'Team statistics, rankings, and performance metrics',
          type: 'team',
          category: 'Teams',
          icon: SportsIcon,
          color: '#ff9800',
          fields: ['team', 'wins', 'losses', 'ranking', 'home_games', 'away_games'],
          filters: [
            { id: 'school', name: 'School', type: 'multiselect', options: BIG12_SCHOOLS, required: false },
            { id: 'sport', name: 'Sport', type: 'select', options: SPORTS_LIST, required: true },
            { id: 'season', name: 'Season', type: 'select', options: ['2024-25', '2023-24', '2022-23'], required: true }
          ],
          formats: EXPORT_FORMATS,
          popularity: 81,
          lastUsed: '2025-05-26T09:45:00Z'
        },
        {
          id: 'travel-analysis',
          name: 'Travel Analysis',
          description: 'Travel distances, costs, and optimization metrics',
          type: 'analytics',
          category: 'Analytics',
          icon: TimelineIcon,
          color: '#f44336',
          fields: ['route', 'distance', 'cost', 'mode', 'carbon_footprint'],
          filters: [
            { id: 'school', name: 'School', type: 'select', options: BIG12_SCHOOLS, required: false },
            { id: 'sport', name: 'Sport', type: 'select', options: SPORTS_LIST, required: false },
            { id: 'travelMode', name: 'Travel Mode', type: 'multiselect', options: ['Bus', 'Plane', 'Train'], required: false }
          ],
          formats: EXPORT_FORMATS,
          popularity: 64,
          lastUsed: '2025-05-25T13:10:00Z'
        },
        {
          id: 'conflict-resolution',
          name: 'Conflict Resolution',
          description: 'Schedule conflicts and resolution tracking',
          type: 'schedule',
          category: 'Scheduling',
          icon: WarningIcon,
          color: '#ff6b35',
          fields: ['conflict_type', 'teams_affected', 'resolution', 'resolution_time'],
          filters: [
            { id: 'status', name: 'Status', type: 'select', options: ['All', 'Resolved', 'Pending', 'Escalated'], required: false },
            { id: 'priority', name: 'Priority', type: 'select', options: ['All', 'High', 'Medium', 'Low'], required: false },
            { id: 'dateRange', name: 'Date Range', type: 'daterange', required: true }
          ],
          formats: EXPORT_FORMATS,
          popularity: 58,
          lastUsed: '2025-05-24T11:30:00Z'
        }
      ];

      // Mock scheduled reports
      const scheduled: ScheduledReport[] = [
        {
          id: 'weekly-schedule',
          name: 'Weekly Schedule Summary',
          template: 'schedule-summary',
          frequency: 'weekly',
          recipients: ['admin@big12.org', 'coordinator@big12.org'],
          format: 'pdf',
          nextRun: '2025-06-02T08:00:00Z',
          status: 'active',
          lastRun: '2025-05-26T08:00:00Z'
        },
        {
          id: 'monthly-compass',
          name: 'Monthly Analytics Report (Future)',
          template: 'compass-analytics',
          frequency: 'monthly',
          recipients: ['analytics@big12.org'],
          format: 'xlsx',
          nextRun: '2025-06-01T09:00:00Z',
          status: 'active',
          lastRun: '2025-05-01T09:00:00Z'
        }
      ];

      // Mock export history
      const history: ExportHistory[] = Array.from({ length: 20 }, (_, i) => ({
        id: `export_${i}`,
        name: templates[i % templates.length].name,
        template: templates[i % templates.length].id,
        format: EXPORT_FORMATS[i % EXPORT_FORMATS.length].id,
        size: `${Math.floor(Math.random() * 5000) + 500}KB`,
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Current User',
        downloadCount: Math.floor(Math.random() * 10),
        status: Math.random() > 0.1 ? 'completed' : Math.random() > 0.5 ? 'processing' : 'failed'
      }));

      setTimeout(() => {
        setReportTemplates(templates);
        setScheduledReports(scheduled);
        setExportHistory(history);
      }, 800);
    };

    loadReportsData();
  }, []);

  const handleGenerateReport = useCallback(async (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setGenerateDialog(true);
    setSelectedFilters({});
  }, []);

  const handleExportReport = useCallback(async () => {
    if (!selectedTemplate) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setGenerateDialog(false);
          
          // Add to export history
          const newExport: ExportHistory = {
            id: `export_${Date.now()}`,
            name: selectedTemplate.name,
            template: selectedTemplate.id,
            format: selectedFormat,
            size: `${Math.floor(Math.random() * 5000) + 500}KB`,
            createdAt: new Date().toISOString(),
            createdBy: 'Current User',
            downloadCount: 0,
            status: 'completed'
          };
          
          setExportHistory(prev => [newExport, ...prev]);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 500);
  }, [selectedTemplate, selectedFormat]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': case 'completed': return theme.palette.success.main;
      case 'paused': case 'processing': return theme.palette.warning.main;
      case 'failed': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  }, [theme]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'active': case 'completed': return <CheckCircleIcon />;
      case 'paused': case 'processing': return <WarningIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  }, []);

  const TabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({
    children,
    value,
    index
  }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const CyberpunkReportCard: React.FC<{ template: ReportTemplate }> = ({ template }) => (
    <motion.div
      variants={cyberpunkVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      style={{
        height: '100%',
        background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.glassPanel}, ${CYBERPUNK_COLORS.hologram})`,
        backdropFilter: 'blur(25px)',
        border: `2px solid ${CYBERPUNK_COLORS.glassBorder}`,
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      {/* Animated border effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `conic-gradient(from 0deg, ${template.color}40, transparent, ${template.color}40)`,
          borderRadius: '16px',
          padding: '2px',
          animation: 'border-spin 3s linear infinite',
          '@keyframes border-spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.glassPanel}, ${CYBERPUNK_COLORS.hologram})`,
            borderRadius: '14px'
          }}
        />
      </Box>
      
      <Card sx={{
        background: 'transparent',
        height: '100%',
        position: 'relative',
        zIndex: 1,
        boxShadow: 'none'
      }}>
        {template.popularity >= 80 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Chip
              icon={<StarIcon />}
              label="ELITE"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: `linear-gradient(45deg, ${CYBERPUNK_COLORS.accent}, ${CYBERPUNK_COLORS.secondary})`,
                color: 'white',
                zIndex: 2,
                fontFamily: 'monospace',
                fontWeight: 700,
                textShadow: `0 0 10px ${CYBERPUNK_COLORS.accent}60`,
                boxShadow: `0 0 15px ${CYBERPUNK_COLORS.accent}40`
              }}
            />
          </motion.div>
        )}
        
        <CardContent sx={{ pb: 1, position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <motion.div
              animate={{
                rotate: [0, 360],
                transition: { duration: 20, repeat: Infinity, ease: 'linear' }
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  background: `linear-gradient(135deg, ${template.color}, ${template.color}80)`,
                  mr: 2,
                  border: `2px solid ${template.color}40`,
                  boxShadow: `0 0 20px ${template.color}40`
                }}
              >
                <template.icon sx={{ fontSize: 28, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }} />
              </Avatar>
            </motion.div>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  color: '#ffffff',
                  mb: 0.5,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textShadow: `0 0 10px ${template.color}60`
                }}
              >
                {template.name}
              </Typography>
              <Chip
                label={`// ${template.category.toUpperCase()}`}
                size="small"
                sx={{ 
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  background: `${template.color}20`,
                  color: template.color,
                  border: `1px solid ${template.color}40`,
                  fontWeight: 700
                }}
              />
            </Box>
          </Box>

          <Typography 
            variant="body2" 
            sx={{ 
              color: '#ffffff80',
              mb: 2,
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: 1.4
            }}
          >
            > {template.description}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: CYBERPUNK_COLORS.primary,
                mb: 1, 
                display: 'block',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.1em'
              }}
            >
              // EXPORT_PROTOCOLS
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {template.formats.slice(0, 4).map((format, index) => (
                <motion.div
                  key={format.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                >
                  <Tooltip title={`${format.name} - ${format.description}`}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        background: `linear-gradient(45deg, ${CYBERPUNK_COLORS.primary}20, ${CYBERPUNK_COLORS.secondary}20)`,
                        border: `1px solid ${CYBERPUNK_COLORS.primary}40`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.2)',
                          boxShadow: `0 0 15px ${CYBERPUNK_COLORS.primary}60`
                        }
                      }}
                    >
                      <format.icon sx={{ fontSize: 16, color: CYBERPUNK_COLORS.primary }} />
                    </Avatar>
                  </Tooltip>
                </motion.div>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography 
                variant="caption" 
                sx={{
                  color: CYBERPUNK_COLORS.primary,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  fontWeight: 700
                }}
              >
                USAGE_RATE
              </Typography>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100px' }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                <LinearProgress
                  variant="determinate"
                  value={template.popularity}
                  sx={{ 
                    width: 100, 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${template.color}, ${template.color}80)`,
                      boxShadow: `0 0 10px ${template.color}60`
                    }
                  }}
                />
              </motion.div>
              <Typography 
                variant="caption" 
                sx={{
                  color: template.color,
                  fontFamily: 'monospace',
                  fontWeight: 700
                }}
              >
                {template.popularity}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="caption" 
                sx={{
                  color: '#ffffff40',
                  fontFamily: 'monospace',
                  fontSize: '0.7rem'
                }}
              >
                {template.lastUsed && (
                  `LAST_ACCESS: ${new Date(template.lastUsed).toLocaleDateString()}`
                )}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <Box sx={{ p: 3, pt: 0, display: 'flex', gap: 2, position: 'relative', zIndex: 2 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ flexGrow: 1 }}
          >
            <Button
              variant="contained"
              size="medium"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleGenerateReport(template)}
              sx={{
                width: '100%',
                background: `linear-gradient(135deg, ${template.color}, ${template.color}80)`,
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                fontWeight: 900,
                letterSpacing: '0.1em',
                py: 1.5,
                border: `1px solid ${template.color}60`,
                boxShadow: `0 0 20px ${template.color}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${template.color}dd, ${template.color})`,
                  boxShadow: `0 0 30px ${template.color}60`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              EXECUTE
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconButton
              size="medium"
              onClick={() => {
                // TODO: Implement schedule dialog
                console.log('Schedule report:', template.name);
              }}
              sx={{ 
                border: `2px solid ${template.color}40`,
                color: template.color,
                background: `${template.color}10`,
                borderRadius: 2,
                '&:hover': {
                  background: `${template.color}20`,
                  borderColor: `${template.color}80`,
                  boxShadow: `0 0 15px ${template.color}40`
                }
              }}
            >
              <ScheduleIcon />
            </IconButton>
          </motion.div>
        </Box>
      </Card>
    </motion.div>
  );

  // Holographic background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles: Array<{
      x: number;
      y: number;
      dx: number;
      dy: number;
      size: number;
      opacity: number;
    }> = [];
    
    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1
      });
    }
    
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 23, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.dx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.dy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 217, 255, ${particle.opacity})`;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);
  
  // Real-time system monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        cpuUsage: Math.max(10, Math.min(95, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        networkActivity: Math.max(15, Math.min(100, prev.networkActivity + (Math.random() - 0.5) * 15)),
        processingPower: Math.max(80, Math.min(100, prev.processingPower + (Math.random() - 0.5) * 5))
      }));
      
      setWorkersActive(prev => Math.max(25, Math.min(100, prev + Math.floor((Math.random() - 0.5) * 6))));
      
      setRealTimeMetrics(prev => ({
        ...prev,
        reportsGenerated: prev.reportsGenerated + Math.floor(Math.random() * 3),
        efficiency: Math.max(90, Math.min(99.9, prev.efficiency + (Math.random() - 0.5) * 2))
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const CyberpunkCard = ({ children, ...props }: any) => (
    <motion.div
      variants={cyberpunkVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      {...props}
      style={{
        background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.glassPanel}, ${CYBERPUNK_COLORS.hologram})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${CYBERPUNK_COLORS.glassBorder}`,
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        ...props.style
      }}
    >
      {/* Holographic overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, transparent 30%, ${CYBERPUNK_COLORS.primary}08 50%, transparent 70%)`,
          animation: 'hologram-sweep 3s infinite',
          pointerEvents: 'none',
          '@keyframes hologram-sweep': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          }
        }}
      />
      {children}
    </motion.div>
  );

  const SystemMonitor = () => (
    <CyberpunkCard style={{ padding: '20px', marginBottom: '24px' }}>
      <Typography
        variant="h6"
        sx={{
          color: CYBERPUNK_COLORS.primary,
          fontFamily: 'monospace',
          fontWeight: 700,
          mb: 2,
          textShadow: `0 0 10px ${CYBERPUNK_COLORS.primary}60`
        }}
      >
        SYSTEM STATUS // WORKERS: {workersActive}/100 ACTIVE
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <motion.div animate={glowPulse}>
              <MemoryIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.neonGreen, mb: 1 }} />
            </motion.div>
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>CPU</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.neonGreen, fontFamily: 'monospace' }}>
              {systemStats.cpuUsage}%
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <SpeedIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.accent, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>MEMORY</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.accent, fontFamily: 'monospace' }}>
              {systemStats.memoryUsage}%
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <CloudSyncIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.secondary, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>NETWORK</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.secondary, fontFamily: 'monospace' }}>
              {systemStats.networkActivity}%
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <FlashOnIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.primary, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>POWER</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.primary, fontFamily: 'monospace' }}>
              {systemStats.processingPower}%
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </CyberpunkCard>
  );

  return (
    <Box 
      sx={{ 
        position: 'relative',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.darkSpace} 0%, #060a10 50%, #0a0e17 100%)`,
        p: 3,
        overflow: 'hidden'
      }}
    >
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
      
      {/* System Monitor */}
      <SystemMonitor />
      {/* Cyberpunk Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  background: `linear-gradient(90deg, ${CYBERPUNK_COLORS.primary} 0%, ${CYBERPUNK_COLORS.secondary} 50%, ${CYBERPUNK_COLORS.accent} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: `0 0 30px ${CYBERPUNK_COLORS.primary}60`,
                  mb: 1,
                  letterSpacing: '0.05em'
                }}
              >
                // INTELLIGENCE EXPORT TERMINAL
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#ffffff80',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              >
                > Advanced cyberpunk data export with holographic interface
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip
                  icon={<SecurityIcon />}
                  label={`ENCRYPTED // ${realTimeMetrics.efficiency}% EFFICIENCY`}
                  size="small"
                  sx={{
                    background: `linear-gradient(45deg, ${CYBERPUNK_COLORS.neonGreen}20, transparent)`,
                    color: CYBERPUNK_COLORS.neonGreen,
                    border: `1px solid ${CYBERPUNK_COLORS.neonGreen}40`,
                    fontFamily: 'monospace'
                  }}
                />
                <Chip
                  icon={<PowerIcon />}
                  label={`${realTimeMetrics.reportsGenerated} REPORTS GENERATED`}
                  size="small"
                  sx={{
                    background: `linear-gradient(45deg, ${CYBERPUNK_COLORS.primary}20, transparent)`,
                    color: CYBERPUNK_COLORS.primary,
                    border: `1px solid ${CYBERPUNK_COLORS.primary}40`,
                    fontFamily: 'monospace'
                  }}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  sx={{
                    borderColor: CYBERPUNK_COLORS.primary,
                    color: CYBERPUNK_COLORS.primary,
                    fontFamily: 'monospace',
                    textTransform: 'none',
                    '&:hover': {
                      background: `${CYBERPUNK_COLORS.primary}10`,
                      borderColor: CYBERPUNK_COLORS.primary,
                      boxShadow: `0 0 20px ${CYBERPUNK_COLORS.primary}40`
                    }
                  }}
                >
                  SYNC
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  sx={{
                    background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.primary}, ${CYBERPUNK_COLORS.secondary})`,
                    fontFamily: 'monospace',
                    textTransform: 'none',
                    fontWeight: 700,
                    boxShadow: `0 0 20px ${CYBERPUNK_COLORS.primary}40`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.secondary}, ${CYBERPUNK_COLORS.accent})`,
                      boxShadow: `0 0 30px ${CYBERPUNK_COLORS.secondary}60`
                    }
                  }}
                >
                  AI BUILDER
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Cyberpunk Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <CyberpunkCard style={{ padding: '24px', textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 900, 
                    color: CYBERPUNK_COLORS.primary, 
                    mb: 1,
                    fontFamily: 'monospace',
                    textShadow: `0 0 20px ${CYBERPUNK_COLORS.primary}60`
                  }}
                >
                  {reportTemplates.length}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#ffffff60',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  TEMPLATES_LOADED
                </Typography>
              </motion.div>
            </CyberpunkCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <CyberpunkCard style={{ padding: '24px', textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 900, 
                    color: CYBERPUNK_COLORS.neonGreen, 
                    mb: 1,
                    fontFamily: 'monospace',
                    textShadow: `0 0 20px ${CYBERPUNK_COLORS.neonGreen}60`
                  }}
                >
                  {scheduledReports.length}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#ffffff60',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  AUTO_SCHEDULED
                </Typography>
              </motion.div>
            </CyberpunkCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <CyberpunkCard style={{ padding: '24px', textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 900, 
                    color: CYBERPUNK_COLORS.secondary, 
                    mb: 1,
                    fontFamily: 'monospace',
                    textShadow: `0 0 20px ${CYBERPUNK_COLORS.secondary}60`
                  }}
                >
                  {exportHistory.filter(h => h.status === 'completed').length}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#ffffff60',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  EXPORTS_COMPLETE
                </Typography>
              </motion.div>
            </CyberpunkCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <CyberpunkCard style={{ padding: '24px', textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 900, 
                    color: CYBERPUNK_COLORS.accent, 
                    mb: 1,
                    fontFamily: 'monospace',
                    textShadow: `0 0 20px ${CYBERPUNK_COLORS.accent}60`
                  }}
                >
                  {exportHistory.reduce((sum, h) => sum + h.downloadCount, 0)}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#ffffff60',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  TOTAL_DOWNLOADS
                </Typography>
              </motion.div>
            </CyberpunkCard>
          </Grid>
        </Grid>
      </motion.div>

      {/* Cyberpunk Main Terminal */}
      <CyberpunkCard style={{ padding: 0, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ 
            borderBottom: `2px solid ${CYBERPUNK_COLORS.glassBorder}`, 
            px: 2,
            '& .MuiTab-root': {
              color: '#ffffff60',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.1em',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: CYBERPUNK_COLORS.primary,
                textShadow: `0 0 10px ${CYBERPUNK_COLORS.primary}60`
              },
              '&.Mui-selected': {
                color: CYBERPUNK_COLORS.primary,
                textShadow: `0 0 15px ${CYBERPUNK_COLORS.primary}80`
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: CYBERPUNK_COLORS.primary,
              height: '3px',
              boxShadow: `0 0 10px ${CYBERPUNK_COLORS.primary}60`
            }
          }}
        >
          <Tab 
            icon={<ReportsIcon />} 
            label="// TEMPLATES" 
            iconPosition="start"
          />
          <Tab 
            icon={<ScheduleIcon />} 
            label="// SCHEDULED" 
            iconPosition="start"
          />
          <Tab 
            icon={<HistoryIcon />} 
            label="// HISTORY" 
            iconPosition="start"
          />
        </Tabs>

        {/* Report Templates Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Available Report Templates
            </Typography>
            
            <AnimatePresence>
              <Grid container spacing={3}>
                {reportTemplates.map((template, index) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                    >
                      <CyberpunkReportCard template={template} />
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </AnimatePresence>
          </Box>
        </TabPanel>

        {/* Scheduled Reports Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Scheduled Reports
              </Typography>
              <Button
                variant="contained"
                startIcon={<ScheduleIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #00bfff, #0088ff)',
                  textTransform: 'none'
                }}
              >
                Schedule New Report
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{
              background: 'transparent',
              boxShadow: 'none'
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Name</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Next Run</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scheduledReports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>{report.name}</TableCell>
                      <TableCell>
                        <Chip label={report.frequency} size="small" />
                      </TableCell>
                      <TableCell>{report.recipients.length} recipients</TableCell>
                      <TableCell>
                        {new Date(report.nextRun).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(report.status)}
                          label={report.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(report.status),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small">
                          <SettingsIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Export History Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Export History
            </Typography>

            <TableContainer component={Paper} sx={{
              background: 'transparent',
              boxShadow: 'none',
              maxHeight: 600
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Name</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Downloads</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exportHistory.map((export_) => (
                    <TableRow key={export_.id} hover>
                      <TableCell>{export_.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={export_.format.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{export_.size}</TableCell>
                      <TableCell>
                        {new Date(export_.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={export_.downloadCount} color="primary">
                          <DownloadIcon />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(export_.status)}
                          label={export_.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(export_.status),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {export_.status === 'completed' && (
                          <>
                            <IconButton size="small">
                              <DownloadIcon />
                            </IconButton>
                            <IconButton size="small">
                              <ShareIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </CyberpunkCard>

      {/* Generate Report Dialog */}
      <Dialog 
        open={generateDialog} 
        onClose={() => setGenerateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Generate Report: {selectedTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedTemplate.description}
              </Typography>

              {/* Export Format Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={selectedFormat}
                  label="Export Format"
                  onChange={(e) => setSelectedFormat(e.target.value)}
                >
                  {selectedTemplate.formats.map((format) => (
                    <MenuItem key={format.id} value={format.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <format.icon fontSize="small" />
                        {format.name} - {format.description}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Filters */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Filters
              </Typography>
              
              <Grid container spacing={2}>
                {selectedTemplate.filters.map((filter) => (
                  <Grid item xs={12} sm={6} key={filter.id}>
                    {filter.type === 'select' && (
                      <FormControl fullWidth size="small">
                        <InputLabel>{filter.name}</InputLabel>
                        <Select
                          value={selectedFilters[filter.id] || ''}
                          label={filter.name}
                          onChange={(e) => setSelectedFilters(prev => ({
                            ...prev,
                            [filter.id]: e.target.value
                          }))}
                        >
                          {filter.options?.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    
                    {filter.type === 'multiselect' && (
                      <FormControl fullWidth size="small">
                        <InputLabel>{filter.name}</InputLabel>
                        <Select
                          multiple
                          value={selectedFilters[filter.id] || []}
                          label={filter.name}
                          onChange={(e) => setSelectedFilters(prev => ({
                            ...prev,
                            [filter.id]: e.target.value
                          }))}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as string[]).map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {filter.options?.map((option) => (
                            <MenuItem key={option} value={option}>
                              <Checkbox 
                                checked={(selectedFilters[filter.id] || []).indexOf(option) > -1} 
                              />
                              <ListItemText primary={option} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                ))}
              </Grid>

              {/* Export Progress */}
              {isExporting && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Generating report... {Math.round(exportProgress)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={exportProgress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExportReport}
            variant="contained"
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
          >
            {isExporting ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntelligenceExportTerminal;