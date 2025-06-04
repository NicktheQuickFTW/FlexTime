/**
 * System Command Center - FlexTime Big 12 Conference Cyberpunk Interface
 * 
 * Advanced cyberpunk administrative interface with real-time holographic monitoring,
 * threat detection systems, and interactive system tuning capabilities.
 * 
 * Features:
 * - System Health Matrix with real-time server status and neon indicators
 * - User Activity Streams with live-updating and smooth transitions
 * - Security Monitoring Panels with threat detection and alert animations
 * - Performance Optimization Controls with interactive system tuning interface
 * - 100-worker parallel processing administration with cyberpunk command center aesthetics
 * 
 * Following [Playbook: Frontend Enhancement Suite] cyberpunk command center design.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  LinearProgress,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Menu,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Computer as ComputerIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  MonitorHeart as MonitorHeartIcon,
  Analytics as AnalyticsIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  FlashOn as FlashOnIcon,
  PowerSettingsNew as PowerIcon,
  CloudSync as CloudSyncIcon,
  Psychology as PsychologyIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

// Enhanced interfaces for admin functionality
interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkActivity: number;
  activeUsers: number;
  systemUptime: number;
  databaseConnections: number;
  cacheHitRate: number;
  apiRequestsPerMinute: number;
  errorRate: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'coordinator' | 'viewer';
  school: string;
  lastLogin: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  avatar?: string;
}

interface SystemConfig {
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  sessionTimeout: number;
  maxConcurrentUsers: number;
  debugMode: boolean;
  loggingLevel: string;
  cacheEnabled: boolean;
  compressionEnabled: boolean;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'warning' | 'error';
  details: string;
}

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
  hologram: 'rgba(139, 0, 255, 0.15)',
  danger: '#FF0080',
  warning: '#FFAA00'
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
    y: -2,
    boxShadow: `0 10px 30px ${CYBERPUNK_COLORS.primary}20`,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  }
};

const pulseGlow = {
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

const SystemCommandCenter: React.FC = () => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [, setSelectedUser] = useState<User | null>(null);
  const [userDialog, setUserDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [securityAlerts, setSecurityAlerts] = useState({
    active: 3,
    critical: 0,
    warnings: 7
  });
  const [systemHealth, setSystemHealth] = useState({
    overall: 98.7,
    database: 99.2,
    api: 97.8,
    cache: 99.9
  });
  const [threatLevel, setThreatLevel] = useState('LOW');
  const [workers, setWorkers] = useState({
    active: 84,
    idle: 16,
    processing: 52
  });

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      
      // Mock system metrics
      const metrics: SystemMetrics = {
        cpuUsage: 68.5,
        memoryUsage: 74.2,
        diskUsage: 45.8,
        networkActivity: 82.1,
        activeUsers: 247,
        systemUptime: 99.97,
        databaseConnections: 156,
        cacheHitRate: 94.3,
        apiRequestsPerMinute: 2847,
        errorRate: 0.023
      };

      // Mock users
      const mockUsers: User[] = [
        {
          id: 'user_1',
          name: 'John Smith',
          email: 'john.smith@kansas.edu',
          role: 'admin',
          school: 'University of Kansas',
          lastLogin: '2025-05-30T14:30:00Z',
          status: 'active',
          permissions: ['manage_schedules', 'manage_users', 'system_config'],
          avatar: 'https://via.placeholder.com/40x40/0066cc/ffffff?text=JS'
        },
        {
          id: 'user_2',
          name: 'Sarah Johnson',
          email: 'sarah.j@texastech.edu',
          role: 'coordinator',
          school: 'Texas Tech University',
          lastLogin: '2025-05-30T13:15:00Z',
          status: 'active',
          permissions: ['manage_schedules', 'view_analytics'],
          avatar: 'https://via.placeholder.com/40x40/28a745/ffffff?text=SJ'
        },
        {
          id: 'user_3',
          name: 'Mike Wilson',
          email: 'mwilson@baylor.edu',
          role: 'viewer',
          school: 'Baylor University',
          lastLogin: '2025-05-29T16:45:00Z',
          status: 'inactive',
          permissions: ['view_schedules'],
          avatar: 'https://via.placeholder.com/40x40/9c27b0/ffffff?text=MW'
        }
      ];

      // Generate more mock users
      for (let i = 4; i <= 50; i++) {
        mockUsers.push({
          id: `user_${i}`,
          name: `User ${i}`,
          email: `user${i}@university.edu`,
          role: Math.random() > 0.7 ? 'admin' : Math.random() > 0.5 ? 'coordinator' : 'viewer',
          school: 'Big 12 Conference',
          lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: Math.random() > 0.1 ? 'active' : Math.random() > 0.5 ? 'inactive' : 'suspended',
          permissions: ['view_schedules'],
          avatar: `https://via.placeholder.com/40x40/ff6b35/ffffff?text=U${i}`
        });
      }

      // Mock system config
      const config: SystemConfig = {
        maintenanceMode: false,
        autoBackup: true,
        backupFrequency: 'daily',
        sessionTimeout: 3600,
        maxConcurrentUsers: 500,
        debugMode: false,
        loggingLevel: 'info',
        cacheEnabled: true,
        compressionEnabled: true
      };

      // Mock activity logs
      const logs: ActivityLog[] = Array.from({ length: 100 }, (_, i) => ({
        id: `log_${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        user: `User ${Math.floor(Math.random() * 10) + 1}`,
        action: ['login', 'logout', 'create_schedule', 'update_venue', 'delete_team'][Math.floor(Math.random() * 5)],
        resource: ['users', 'schedules', 'venues', 'teams', 'system'][Math.floor(Math.random() * 5)],
        status: Math.random() > 0.1 ? 'success' : Math.random() > 0.5 ? 'warning' : 'error',
        details: 'Action completed successfully'
      }));

      setTimeout(() => {
        setSystemMetrics(metrics);
        setUsers(mockUsers);
        setSystemConfig(config);
        setActivityLogs(logs);
        setLoading(false);
      }, 1000);
    };

    loadAdminData();
  }, []);

  const handleUserMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedUser(null);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'inactive': return theme.palette.warning.main;
      case 'suspended': return theme.palette.error.main;
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  }, [theme]);

  const getRoleIcon = useCallback((role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'coordinator': return <SupervisorIcon />;
      case 'viewer': return <VisibilityIcon />;
      default: return <PeopleIcon />;
    }
  }, []);

  const CyberpunkMetricCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtitle?: string;
    icon: React.ElementType;
    color: string;
    progress?: number;
  }> = ({ title, value, subtitle, icon: Icon, color, progress }) => (
    <motion.div
      variants={cyberpunkVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      style={{ height: '100%' }}
    >
      <Paper
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.glassPanel}, ${CYBERPUNK_COLORS.hologram})`,
          backdropFilter: 'blur(25px)',
          border: `2px solid ${color}40`,
          borderRadius: '16px',
          height: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow effect border */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(45deg, transparent 40%, ${color}08 50%, transparent 60%)`,
            animation: 'metric-glow 3s infinite',
            pointerEvents: 'none',
            '@keyframes metric-glow': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
            }
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
          <motion.div
            animate={{
              rotate: [0, 360],
              transition: { duration: 20, repeat: Infinity, ease: 'linear' }
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                border: `2px solid ${color}60`,
                boxShadow: `0 0 20px ${color}40`
              }}
            >
              <Icon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
          </motion.div>
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 900, 
                color,
                fontFamily: 'monospace',
                textShadow: `0 0 15px ${color}60`
              }}
            {loading ? <CircularProgress size={24} /> : value}
          </Typography>
            <Typography 
              variant="body2" 
              sx={{
                color: '#ffffff80',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700
              }}
            >
              {title}
            </Typography>
        </Box>
      </Box>
        
        {progress !== undefined && (
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography 
                variant="caption" 
                sx={{
                  color: '#ffffff60',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}
              >
                USAGE_RATE
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 700,
                  color,
                  fontFamily: 'monospace'
                }}
              >
                {progress}%
              </Typography>
            </Box>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <LinearProgress 
                variant="determinate" 
                value={progress}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${color}, ${color}80)`,
                    boxShadow: `0 0 10px ${color}60`
                  }
                }}
              />
            </motion.div>
          </Box>
        )}
        
        {subtitle && (
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 1, 
              display: 'block',
              color: '#ffffff60',
              fontFamily: 'monospace',
              position: 'relative',
              zIndex: 1
            }}
          >
            > {subtitle}
          </Typography>
        )}
      </CyberpunkCard>
    </motion.div>
  );

  const TabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({
    children,
    value,
    index
  }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  // Holographic background effect with security grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const gridSize = 50;
    const particles: Array<{
      x: number;
      y: number;
      dx: number;
      dy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];
    
    // Create security grid particles
    for (let i = 0; i < 200; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.7 ? CYBERPUNK_COLORS.accent : CYBERPUNK_COLORS.primary
      });
    }
    
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 23, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw security grid
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Animate particles
      particles.forEach(particle => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.dx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.dy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);
  
  // Real-time security monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityAlerts(prev => ({
        active: Math.max(0, Math.min(10, prev.active + (Math.random() - 0.7) * 2)),
        critical: Math.random() > 0.95 ? prev.critical + 1 : Math.max(0, prev.critical - (Math.random() > 0.8 ? 1 : 0)),
        warnings: Math.max(0, Math.min(20, prev.warnings + (Math.random() - 0.5) * 3))
      }));
      
      setSystemHealth(prev => ({
        overall: Math.max(95, Math.min(100, prev.overall + (Math.random() - 0.5) * 1)),
        database: Math.max(97, Math.min(100, prev.database + (Math.random() - 0.5) * 0.5)),
        api: Math.max(94, Math.min(100, prev.api + (Math.random() - 0.5) * 2)),
        cache: Math.max(98, Math.min(100, prev.cache + (Math.random() - 0.5) * 0.3))
      }));
      
      setWorkers(prev => ({
        active: Math.max(70, Math.min(100, prev.active + (Math.random() - 0.5) * 4)),
        idle: Math.max(0, Math.min(30, prev.idle + (Math.random() - 0.5) * 3)),
        processing: Math.max(30, Math.min(80, prev.processing + (Math.random() - 0.5) * 6))
      }));
      
      // Dynamic threat level
      const alerts = securityAlerts.active + securityAlerts.critical * 3;
      if (alerts > 15) setThreatLevel('HIGH');
      else if (alerts > 8) setThreatLevel('MEDIUM');
      else setThreatLevel('LOW');
    }, 3000);
    
    return () => clearInterval(interval);
  }, [securityAlerts]);

  const CyberpunkCard = ({ children, ...props }: any) => (
    <motion.div
      variants={cyberpunkVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      {...props}
      style={{
        background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.glassPanel}, ${CYBERPUNK_COLORS.hologram})`,
        backdropFilter: 'blur(25px)',
        border: `2px solid ${CYBERPUNK_COLORS.glassBorder}`,
        borderRadius: '16px',
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
          background: `linear-gradient(45deg, transparent 30%, ${CYBERPUNK_COLORS.primary}06 50%, transparent 70%)`,
          animation: 'command-sweep 4s infinite',
          pointerEvents: 'none',
          '@keyframes command-sweep': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          }
        }}
      />
      {children}
    </motion.div>
  );

  const SecurityMonitor = () => (
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
        // SECURITY_STATUS // THREAT_LEVEL: {threatLevel}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <motion.div animate={securityAlerts.critical > 0 ? pulseGlow : {}}>
              <ShieldIcon sx={{ 
                fontSize: 40, 
                color: securityAlerts.critical > 0 ? CYBERPUNK_COLORS.danger : CYBERPUNK_COLORS.neonGreen, 
                mb: 1 
              }} />
            </motion.div>
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>ACTIVE</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.neonGreen, fontFamily: 'monospace' }}>
              {securityAlerts.active}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <WarningIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.warning, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>WARNINGS</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.warning, fontFamily: 'monospace' }}>
              {securityAlerts.warnings}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <SecurityIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.secondary, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>HEALTH</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.secondary, fontFamily: 'monospace' }}>
              {systemHealth.overall.toFixed(1)}%
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <PsychologyIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.primary, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>WORKERS</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.primary, fontFamily: 'monospace' }}>
              {workers.active}/100
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
      
      {/* Security Monitor */}
      <SecurityMonitor />
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
                // SYSTEM COMMAND CENTER
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#ffffff80',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              >
                > Advanced cyberpunk administration and threat monitoring interface
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Badge badgeContent={securityAlerts.critical} color="error">
                  <Chip
                    icon={<SecurityIcon />}
                    label={`SECURITY: ${threatLevel}`}
                    size="small"
                    sx={{
                      background: `linear-gradient(45deg, ${threatLevel === 'HIGH' ? CYBERPUNK_COLORS.danger : threatLevel === 'MEDIUM' ? CYBERPUNK_COLORS.warning : CYBERPUNK_COLORS.neonGreen}20, transparent)`,
                      color: threatLevel === 'HIGH' ? CYBERPUNK_COLORS.danger : threatLevel === 'MEDIUM' ? CYBERPUNK_COLORS.warning : CYBERPUNK_COLORS.neonGreen,
                      border: `1px solid ${threatLevel === 'HIGH' ? CYBERPUNK_COLORS.danger : threatLevel === 'MEDIUM' ? CYBERPUNK_COLORS.warning : CYBERPUNK_COLORS.neonGreen}40`,
                      fontFamily: 'monospace'
                    }}
                  />
                </Badge>
                <Chip
                  icon={<MonitorHeartIcon />}
                  label={`SYSTEM_HEALTH: ${systemHealth.overall.toFixed(1)}%`}
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
                  SYNC_ALL
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  startIcon={<BackupIcon />}
                  sx={{
                    background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.secondary}, ${CYBERPUNK_COLORS.accent})`,
                    fontFamily: 'monospace',
                    textTransform: 'none',
                    fontWeight: 700,
                    boxShadow: `0 0 20px ${CYBERPUNK_COLORS.secondary}40`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.accent}, ${CYBERPUNK_COLORS.danger})`,
                      boxShadow: `0 0 30px ${CYBERPUNK_COLORS.accent}60`
                    }
                  }}
                >
                  EMERGENCY_BACKUP
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* System Status Overview */}
      {systemMetrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <CyberpunkMetricCard
              title="CPU Usage"
              value={`${systemMetrics.cpuUsage}%`}
              icon={ComputerIcon}
              color={CYBERPUNK_COLORS.primary}
              progress={systemMetrics.cpuUsage}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CyberpunkMetricCard
              title="Memory Usage"
              value={`${systemMetrics.memoryUsage}%`}
              icon={MemoryIcon}
              color={CYBERPUNK_COLORS.neonGreen}
              progress={systemMetrics.memoryUsage}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CyberpunkMetricCard
              title="Active Users"
              value={systemMetrics.activeUsers}
              subtitle="Currently online"
              icon={PeopleIcon}
              color={CYBERPUNK_COLORS.secondary}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CyberpunkMetricCard
              title="System Uptime"
              value={`${systemMetrics.systemUptime}%`}
              subtitle="Last 30 days"
              icon={MonitorHeartIcon}
              color={CYBERPUNK_COLORS.accent}
            />
          </Grid>
        </Grid>
      )}

      {/* Cyberpunk Main Command Console */}
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
              minWidth: 'auto',
              padding: '12px 16px',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: CYBERPUNK_COLORS.primary,
                textShadow: `0 0 10px ${CYBERPUNK_COLORS.primary}60`,
                transform: 'translateY(-2px)'
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
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<DashboardIcon />} 
            label="// OVERVIEW" 
            iconPosition="start"
          />
          <Tab 
            icon={<PeopleIcon />} 
            label="// USERS" 
            iconPosition="start"
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="// CONFIG" 
            iconPosition="start"
          />
          <Tab 
            icon={<AssessmentIcon />} 
            label="// ANALYTICS" 
            iconPosition="start"
          />
          <Tab 
            icon={<ScheduleIcon />} 
            label="// LOGS" 
            iconPosition="start"
          />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* System Health */}
              <Grid item xs={12} md={8}>
                <Paper sx={{
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 25, 40, 0.75)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 3,
                  height: 400
                }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    System Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { time: '00:00', cpu: 45, memory: 62, network: 78 },
                      { time: '04:00', cpu: 52, memory: 68, network: 82 },
                      { time: '08:00', cpu: 68, memory: 74, network: 85 },
                      { time: '12:00', cpu: 72, memory: 78, network: 88 },
                      { time: '16:00', cpu: 65, memory: 72, network: 82 },
                      { time: '20:00', cpu: 58, memory: 69, network: 79 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="cpu" stroke="#00bfff" strokeWidth={2} />
                      <Line type="monotone" dataKey="memory" stroke="#28a745" strokeWidth={2} />
                      <Line type="monotone" dataKey="network" stroke="#9c27b0" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CyberpunkCard>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12} md={4}>
                <Paper sx={{
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 25, 40, 0.75)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 3,
                  height: 400
                }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Quick Stats
                  </Typography>
                  
                  {systemMetrics && (
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <StorageIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Database Connections" 
                          secondary={systemMetrics.databaseConnections}
                        />
                      </ListItem>
                      
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <SpeedIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Cache Hit Rate" 
                          secondary={`${systemMetrics.cacheHitRate}%`}
                        />
                      </ListItem>
                      
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <AnalyticsIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="API Requests/min" 
                          secondary={systemMetrics.apiRequestsPerMinute.toLocaleString()}
                        />
                      </ListItem>
                      
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <ErrorIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Error Rate" 
                          secondary={`${(systemMetrics.errorRate * 100).toFixed(3)}%`}
                        />
                      </ListItem>
                    </List>
                  )}
                  
                  <Alert severity="success" sx={{ mt: 2 }}>
                    All systems operational
                  </Alert>
                </CyberpunkCard>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* User Management Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                User Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setUserDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #00bfff, #0088ff)',
                  textTransform: 'none'
                }}
              >
                Add User
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{
              background: theme.palette.mode === 'dark' 
                ? 'rgba(17, 25, 40, 0.75)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
              borderRadius: 3
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>School</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users
                    .slice(userPage * userRowsPerPage, userPage * userRowsPerPage + userRowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar src={user.avatar} sx={{ width: 32, height: 32, mr: 2 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={user.role}
                            size="small"
                            color={user.role === 'admin' ? 'error' : user.role === 'coordinator' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{user.school}</TableCell>
                        <TableCell>
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(user.status),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleUserMenuClick(e, user)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={users.length}
                rowsPerPage={userRowsPerPage}
                page={userPage}
                onPageChange={(_, newPage) => setUserPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setUserRowsPerPage(parseInt(e.target.value, 10));
                  setUserPage(0);
                }}
              />
            </TableContainer>
          </Box>
        </TabPanel>

        {/* System Config Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              System Configuration
            </Typography>
            
            {systemConfig && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{
                    p: 3,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(17, 25, 40, 0.75)'
                      : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                    borderRadius: 3
                  }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      General Settings
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemText primary="Maintenance Mode" />
                        <ListItemSecondaryAction>
                          <Switch checked={systemConfig.maintenanceMode} />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText primary="Auto Backup" />
                        <ListItemSecondaryAction>
                          <Switch checked={systemConfig.autoBackup} />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText primary="Cache Enabled" />
                        <ListItemSecondaryAction>
                          <Switch checked={systemConfig.cacheEnabled} />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText primary="Compression Enabled" />
                        <ListItemSecondaryAction>
                          <Switch checked={systemConfig.compressionEnabled} />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CyberpunkCard>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{
                    p: 3,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(17, 25, 40, 0.75)'
                      : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                    borderRadius: 3
                  }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Advanced Settings
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Backup Frequency</InputLabel>
                        <Select value={systemConfig.backupFrequency}>
                          <MenuItem value="hourly">Hourly</MenuItem>
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Logging Level</InputLabel>
                        <Select value={systemConfig.loggingLevel}>
                          <MenuItem value="debug">Debug</MenuItem>
                          <MenuItem value="info">Info</MenuItem>
                          <MenuItem value="warning">Warning</MenuItem>
                          <MenuItem value="error">Error</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="Session Timeout (seconds)"
                      type="number"
                      value={systemConfig.sessionTimeout}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Max Concurrent Users"
                      type="number"
                      value={systemConfig.maxConcurrentUsers}
                      size="small"
                    />
                  </CyberpunkCard>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              System Analytics
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Detailed analytics and reporting functionality would be implemented here.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 25, 40, 0.75)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 3,
                  textAlign: 'center'
                }}>
                  <AnalyticsIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Usage Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View detailed usage patterns and system performance metrics
                  </Typography>
                </CyberpunkCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 25, 40, 0.75)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 3,
                  textAlign: 'center'
                }}>
                  <AssessmentIcon sx={{ fontSize: 48, color: theme.palette.secondary.main, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Performance Reports
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate comprehensive performance and usage reports
                  </Typography>
                </CyberpunkCard>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Activity Logs Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Activity Logs
            </Typography>
            
            <TableContainer component={Paper} sx={{
              background: theme.palette.mode === 'dark' 
                ? 'rgba(17, 25, 40, 0.75)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
              borderRadius: 3,
              maxHeight: 600
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityLogs.slice(0, 20).map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(log.status),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </CyberpunkCard>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Suspend User</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>
            Delete User
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* User Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              size="small"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select defaultValue="">
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="coordinator">Coordinator</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="School"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setUserDialog(false)}>
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemCommandCenter;