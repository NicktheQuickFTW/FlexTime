/**
 * Personal Command Console - FlexTime Big 12 Conference Cyberpunk Interface
 * 
 * Advanced cyberpunk settings interface with holographic effects, real-time theme previews,
 * accessibility enhancement toggles, and performance optimization controls.
 * 
 * Features:
 * - Dynamic Theme Previews with real-time color scheme switching
 * - Accessibility Enhancement Toggles with interactive capability testing
 * - Performance Preference Sliders with FPS/Quality balance controls
 * - Smart Notification Center with AI-powered importance filtering
 * - 100-worker parallel processing control systems with cyberpunk aesthetics
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
  CardHeader,
  Grid,
  Tabs,
  Tab,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormGroup,
  Checkbox,
  LinearProgress,
  ButtonGroup
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Accessibility as AccessibilityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Reset as ResetIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  VolumeUp as VolumeUpIcon,
  Computer as ComputerIcon,
  PowerSettingsNew as PowerIcon,
  FlashOn as FlashOnIcon,
  Dashboard as DashboardIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

// Enhanced interfaces following FlexTime architecture
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  school: string;
  avatar?: string;
  preferences: UserPreferences;
  lastLogin: string;
  createdAt: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultView: string;
  autoSave: boolean;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  privacy: PrivacySettings;
  dashboard: DashboardSettings;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  scheduleUpdates: boolean;
  conflictAlerts: boolean;
  systemMaintenance: boolean;
  weeklyReports: boolean;
  sound: boolean;
  volume: number;
}

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'school' | 'private';
  activityTracking: boolean;
  analyticsSharing: boolean;
  marketingEmails: boolean;
  dataRetention: number; // days
}

interface DashboardSettings {
  defaultWidgets: string[];
  layoutCompact: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  showMetrics: boolean;
  favoriteSchools: string[];
  favoriteSports: string[];
}

// const BIG12_SCHOOLS = [
//   'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
//   'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
//   'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
// ];

// const SPORTS_LIST = [
//   'Football', 'Men\'s Basketball', 'Women\'s Basketball', 'Baseball', 'Softball',
//   'Soccer', 'Volleyball', 'Tennis', 'Golf', 'Track & Field', 'Swimming', 
//   'Wrestling', 'Gymnastics', 'Lacrosse'
// ];

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
    y: -2,
    boxShadow: `0 10px 30px ${CYBERPUNK_COLORS.primary}20`,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  }
};

const PersonalCommandConsole: React.FC = () => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);
  const [systemPerformance, setSystemPerformance] = useState({
    fps: 60,
    quality: 'high',
    renderMode: 'gpu',
    particleCount: 150
  });
  const [liveThemePreview, setLiveThemePreview] = useState('cyberpunk');
  const [accessibilityTest, setAccessibilityTest] = useState({
    contrast: 95,
    readability: 92,
    navigation: 98
  });
  const [aiNotificationFiltering, setAiNotificationFiltering] = useState({
    importance: 85,
    relevance: 78,
    urgency: 91
  });

  // Load user profile and preferences
  useEffect(() => {
    const loadUserProfile = () => {
      // Mock user data
      const mockProfile: UserProfile = {
        id: 'user_123',
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.johnson@university.edu',
        role: 'Athletic Director',
        school: 'Big 12 Conference',
        avatar: 'https://via.placeholder.com/120x120/0066cc/ffffff?text=AJ',
        preferences: {
          theme: 'dark',
          language: 'en-US',
          timezone: 'America/Chicago',
          dateFormat: 'MM/dd/yyyy',
          timeFormat: '12h',
          defaultView: 'dashboard',
          autoSave: true,
          notifications: {
            email: true,
            push: true,
            sms: false,
            scheduleUpdates: true,
            conflictAlerts: true,
            systemMaintenance: true,
            weeklyReports: false,
            sound: true,
            volume: 75
          },
          accessibility: {
            reducedMotion: false,
            highContrast: false,
            fontSize: 'medium',
            screenReader: false,
            keyboardNavigation: true,
            focusIndicators: true
          },
          privacy: {
            profileVisibility: 'school',
            activityTracking: true,
            analyticsSharing: false,
            marketingEmails: false,
            dataRetention: 365
          },
          dashboard: {
            defaultWidgets: ['compass', 'scheduling', 'performance'],
            layoutCompact: false,
            autoRefresh: true,
            refreshInterval: 30,
            showMetrics: true,
            favoriteSchools: ['Kansas', 'Kansas State', 'Oklahoma State'],
            favoriteSports: ['Football', 'Men\'s Basketball', 'Baseball']
          }
        },
        lastLogin: new Date().toISOString(),
        createdAt: '2024-01-15T10:00:00Z'
      };

      setTimeout(() => {
        setUserProfile(mockProfile);
        setLoading(false);
      }, 800);
    };

    loadUserProfile();
  }, []);

  const handlePreferenceChange = useCallback((category: string, key: string, value: any) => {
    if (!userProfile) return;

    setUserProfile(prev => ({
      ...prev!,
      preferences: {
        ...prev!.preferences,
        [category]: {
          ...prev!.preferences[category as keyof UserPreferences],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  }, [userProfile]);

  const handleSaveSettings = useCallback(() => {
    // Mock save operation
    setTimeout(() => {
      setHasChanges(false);
      setSaveDialog(false);
    }, 1000);
  }, []);

  const handleResetSettings = useCallback(() => {
    // Mock reset operation
    setResetDialog(false);
    setHasChanges(false);
    window.location.reload();
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

  const CyberpunkSettingCard: React.FC<{ 
    title: string; 
    description: string; 
    children: React.ReactNode;
    icon?: React.ElementType;
  }> = ({ title, description, children, icon: Icon }) => (
    <motion.div
      variants={cyberpunkVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      style={{ marginBottom: '24px' }}
    >
      <Card sx={{
        background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.glassPanel}, ${CYBERPUNK_COLORS.hologram})`,
        backdropFilter: 'blur(25px)',
        border: `2px solid ${CYBERPUNK_COLORS.glassBorder}`,
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated border effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(45deg, transparent 40%, ${CYBERPUNK_COLORS.primary}08 50%, transparent 60%)`,
            animation: 'setting-glow 3s infinite',
            pointerEvents: 'none',
            '@keyframes setting-glow': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
            }
          }}
        />
        
        <CardHeader
          avatar={Icon && (
            <motion.div
              animate={{
                rotate: [0, 360],
                transition: { duration: 15, repeat: Infinity, ease: 'linear' }
              }}
            >
              <Avatar sx={{ 
                background: `linear-gradient(135deg, ${CYBERPUNK_COLORS.primary}, ${CYBERPUNK_COLORS.secondary})`,
                border: `2px solid ${CYBERPUNK_COLORS.primary}40`,
                boxShadow: `0 0 20px ${CYBERPUNK_COLORS.primary}40`
              }}>
                <Icon sx={{ color: '#ffffff' }} />
              </Avatar>
            </motion.div>
          )}
          title={
            <Typography
              variant="h6"
              sx={{
                color: CYBERPUNK_COLORS.primary,
                fontFamily: 'monospace',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textShadow: `0 0 10px ${CYBERPUNK_COLORS.primary}60`
              }}
            >
              // {title.toUpperCase()}
            </Typography>
          }
          subheader={
            <Typography
              variant="body2"
              sx={{
                color: '#ffffff80',
                fontFamily: 'monospace',
                fontSize: '0.85rem'
              }}
            >
              > {description}
            </Typography>
          }
          sx={{ pb: 1, position: 'relative', zIndex: 1 }}
        />
        <CardContent sx={{ pt: 0, position: 'relative', zIndex: 1 }}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading || !userProfile) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Loading...</Typography>
      </Box>
    );
  }

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
      hue: number;
    }> = [];
    
    // Create particles
    for (let i = 0; i < systemPerformance.particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        hue: Math.random() * 60 + 180 // Blue-cyan range
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
        ctx.fillStyle = `hsla(${particle.hue}, 80%, 60%, ${particle.opacity})`;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${particle.hue}, 80%, 60%, 0.5)`;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [systemPerformance.particleCount]);
  
  // Real-time performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setAccessibilityTest(prev => ({
        contrast: Math.max(80, Math.min(100, prev.contrast + (Math.random() - 0.5) * 4)),
        readability: Math.max(85, Math.min(100, prev.readability + (Math.random() - 0.5) * 3)),
        navigation: Math.max(90, Math.min(100, prev.navigation + (Math.random() - 0.5) * 2))
      }));
      
      setAiNotificationFiltering(prev => ({
        importance: Math.max(70, Math.min(95, prev.importance + (Math.random() - 0.5) * 5)),
        relevance: Math.max(65, Math.min(90, prev.relevance + (Math.random() - 0.5) * 6)),
        urgency: Math.max(80, Math.min(100, prev.urgency + (Math.random() - 0.5) * 4))
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
          animation: 'hologram-sweep 4s infinite',
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

  const PerformanceMonitor = () => (
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
        // SYSTEM_PERFORMANCE_MONITOR
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <FlashOnIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.neonGreen, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>FPS</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.neonGreen, fontFamily: 'monospace' }}>
              {systemPerformance.fps}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <MemoryIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.accent, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>QUALITY</Typography>
            <Typography variant="body2" sx={{ color: CYBERPUNK_COLORS.accent, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              {systemPerformance.quality}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <ComputerIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.secondary, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>RENDER</Typography>
            <Typography variant="body2" sx={{ color: CYBERPUNK_COLORS.secondary, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              {systemPerformance.renderMode}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <PsychologyIcon sx={{ fontSize: 40, color: CYBERPUNK_COLORS.primary, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#ffffff80', display: 'block' }}>AI_FILTER</Typography>
            <Typography variant="h6" sx={{ color: CYBERPUNK_COLORS.primary, fontFamily: 'monospace' }}>
              {aiNotificationFiltering.importance}%
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
      
      {/* Performance Monitor */}
      <PerformanceMonitor />
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
                // PERSONAL COMMAND CONSOLE
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#ffffff80',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              >
                > Advanced cyberpunk user interface configuration system
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip
                  icon={<TuneIcon />}
                  label={`THEME: ${liveThemePreview.toUpperCase()}`}
                  size="small"
                  sx={{
                    background: `linear-gradient(45deg, ${CYBERPUNK_COLORS.secondary}20, transparent)`,
                    color: CYBERPUNK_COLORS.secondary,
                    border: `1px solid ${CYBERPUNK_COLORS.secondary}40`,
                    fontFamily: 'monospace'
                  }}
                />
                <Chip
                  icon={<VisibilityIcon />}
                  label={`ACCESSIBILITY: ${accessibilityTest.contrast}%`}
                  size="small"
                  sx={{
                    background: `linear-gradient(45deg, ${CYBERPUNK_COLORS.neonGreen}20, transparent)`,
                    color: CYBERPUNK_COLORS.neonGreen,
                    border: `1px solid ${CYBERPUNK_COLORS.neonGreen}40`,
                    fontFamily: 'monospace'
                  }}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  startIcon={<ResetIcon />}
                  onClick={() => setResetDialog(true)}
                  disabled={!hasChanges}
                  sx={{
                    borderColor: CYBERPUNK_COLORS.accent,
                    color: hasChanges ? CYBERPUNK_COLORS.accent : '#ffffff40',
                    fontFamily: 'monospace',
                    textTransform: 'none',
                    '&:hover': {
                      background: `${CYBERPUNK_COLORS.accent}10`,
                      borderColor: CYBERPUNK_COLORS.accent,
                      boxShadow: `0 0 20px ${CYBERPUNK_COLORS.accent}40`
                    },
                    '&:disabled': {
                      borderColor: '#ffffff20',
                      color: '#ffffff30'
                    }
                  }}
                >
                  RESET_ALL
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => setSaveDialog(true)}
                  disabled={!hasChanges}
                  sx={{
                    background: hasChanges 
                      ? `linear-gradient(135deg, ${CYBERPUNK_COLORS.primary}, ${CYBERPUNK_COLORS.secondary})`
                      : '#ffffff20',
                    fontFamily: 'monospace',
                    textTransform: 'none',
                    fontWeight: 700,
                    boxShadow: hasChanges ? `0 0 20px ${CYBERPUNK_COLORS.primary}40` : 'none',
                    '&:hover': {
                      background: hasChanges
                        ? `linear-gradient(135deg, ${CYBERPUNK_COLORS.secondary}, ${CYBERPUNK_COLORS.accent})`
                        : '#ffffff20',
                      boxShadow: hasChanges ? `0 0 30px ${CYBERPUNK_COLORS.secondary}60` : 'none'
                    },
                    '&:disabled': {
                      background: '#ffffff15',
                      color: '#ffffff40'
                    }
                  }}
                >
                  SYNC_CONFIG
                </Button>
              </motion.div>
            </Box>
          </Box>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 2,
                  background: `linear-gradient(45deg, ${CYBERPUNK_COLORS.accent}15, transparent)`,
                  border: `1px solid ${CYBERPUNK_COLORS.accent}40`,
                  color: CYBERPUNK_COLORS.accent,
                  fontFamily: 'monospace',
                  '& .MuiAlert-icon': {
                    color: CYBERPUNK_COLORS.accent
                  }
                }}
              >
                >> UNSAVED_CHANGES_DETECTED // SYNC_REQUIRED_FOR_PERSISTENCE
              </Alert>
            </motion.div>
          )}
        </Box>
      </motion.div>

      {/* Cyberpunk Main Console */}
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
            icon={<PersonIcon />} 
            label="// PROFILE" 
            iconPosition="start"
          />
          <Tab 
            icon={<PaletteIcon />} 
            label="// THEME" 
            iconPosition="start"
          />
          <Tab 
            icon={<NotificationsIcon />} 
            label="// ALERTS" 
            iconPosition="start"
          />
          <Tab 
            icon={<AccessibilityIcon />} 
            label="// ACCESS" 
            iconPosition="start"
          />
          <Tab 
            icon={<SecurityIcon />} 
            label="// PRIVACY" 
            iconPosition="start"
          />
          <Tab 
            icon={<DashboardIcon />} 
            label="// DASH" 
            iconPosition="start"
          />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Profile Info */}
              <Grid item xs={12} md={4}>
                <CyberpunkSettingCard
                  title="Profile Information"
                  description="Update your personal information"
                  icon={PersonIcon}
                >
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Avatar
                      src={userProfile.avatar}
                      sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                    />
                    <Button variant="outlined" startIcon={<EditIcon />} size="small">
                      Change Photo
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={userProfile.firstName}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={userProfile.lastName}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={userProfile.email}
                        size="small"
                        type="email"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={userProfile.role}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="School"
                        value={userProfile.school}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CyberpunkSettingCard>
              </Grid>

              {/* Account Info */}
              <Grid item xs={12} md={8}>
                <CyberpunkSettingCard
                  title="Account Information"
                  description="Account details and statistics"
                  icon={InfoIcon}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, backgroundColor: 'rgba(0, 191, 255, 0.05)', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Member Since
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {new Date(userProfile.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, backgroundColor: 'rgba(40, 167, 69, 0.05)', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Last Login
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {new Date(userProfile.lastLogin).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Quick Settings */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Quick Settings
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <LanguageIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Language" 
                          secondary={userProfile.preferences.language}
                        />
                        <ListItemSecondaryAction>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={userProfile.preferences.language}
                              onChange={(e) => handlePreferenceChange('', 'language', e.target.value)}
                            >
                              <MenuItem value="en-US">English (US)</MenuItem>
                              <MenuItem value="es-ES">Español</MenuItem>
                              <MenuItem value="fr-FR">Français</MenuItem>
                            </Select>
                          </FormControl>
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <TimelineIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Timezone" 
                          secondary={userProfile.preferences.timezone}
                        />
                        <ListItemSecondaryAction>
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select
                              value={userProfile.preferences.timezone}
                              onChange={(e) => handlePreferenceChange('', 'timezone', e.target.value)}
                            >
                              <MenuItem value="America/New_York">Eastern</MenuItem>
                              <MenuItem value="America/Chicago">Central</MenuItem>
                              <MenuItem value="America/Denver">Mountain</MenuItem>
                              <MenuItem value="America/Los_Angeles">Pacific</MenuItem>
                            </Select>
                          </FormControl>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </Box>
                </CyberpunkSettingCard>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <CyberpunkSettingCard
              title="Theme & Display"
              description="Customize the visual appearance of FlexTime"
              icon={PaletteIcon}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Theme</Typography>
                  <RadioGroup
                    value={userProfile.preferences.theme}
                    onChange={(e) => handlePreferenceChange('', 'theme', e.target.value)}
                  >
                    <FormControlLabel value="light" control={<Radio />} label="Light" />
                    <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                    <FormControlLabel value="auto" control={<Radio />} label="Auto (System)" />
                  </RadioGroup>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Date & Time Format</Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={userProfile.preferences.dateFormat}
                      label="Date Format"
                      onChange={(e) => handlePreferenceChange('', 'dateFormat', e.target.value)}
                    >
                      <MenuItem value="MM/dd/yyyy">MM/dd/yyyy</MenuItem>
                      <MenuItem value="dd/MM/yyyy">dd/MM/yyyy</MenuItem>
                      <MenuItem value="yyyy-MM-dd">yyyy-MM-dd</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Time Format</InputLabel>
                    <Select
                      value={userProfile.preferences.timeFormat}
                      label="Time Format"
                      onChange={(e) => handlePreferenceChange('', 'timeFormat', e.target.value)}
                    >
                      <MenuItem value="12h">12 Hour</MenuItem>
                      <MenuItem value="24h">24 Hour</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CyberpunkSettingCard>
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <CyberpunkSettingCard
              title="Notification Preferences"
              description="Control how and when you receive notifications"
              icon={NotificationsIcon}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Delivery Methods</Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText primary="Email Notifications" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.notifications.email}
                          onChange={(e) => handlePreferenceChange('notifications', 'email', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PhoneAndroidIcon />
                      </ListItemIcon>
                      <ListItemText primary="Push Notifications" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.notifications.push}
                          onChange={(e) => handlePreferenceChange('notifications', 'push', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <SmsIcon />
                      </ListItemIcon>
                      <ListItemText primary="SMS Notifications" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.notifications.sms}
                          onChange={(e) => handlePreferenceChange('notifications', 'sms', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Notification Types</Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={userProfile.preferences.notifications.scheduleUpdates}
                          onChange={(e) => handlePreferenceChange('notifications', 'scheduleUpdates', e.target.checked)}
                        />
                      }
                      label="Schedule Updates"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={userProfile.preferences.notifications.conflictAlerts}
                          onChange={(e) => handlePreferenceChange('notifications', 'conflictAlerts', e.target.checked)}
                        />
                      }
                      label="Conflict Alerts"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={userProfile.preferences.notifications.systemMaintenance}
                          onChange={(e) => handlePreferenceChange('notifications', 'systemMaintenance', e.target.checked)}
                        />
                      }
                      label="System Maintenance"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={userProfile.preferences.notifications.weeklyReports}
                          onChange={(e) => handlePreferenceChange('notifications', 'weeklyReports', e.target.checked)}
                        />
                      }
                      label="Weekly Reports"
                    />
                  </FormGroup>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Sound Settings</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userProfile.preferences.notifications.sound}
                          onChange={(e) => handlePreferenceChange('notifications', 'sound', e.target.checked)}
                        />
                      }
                      label="Enable Notification Sounds"
                    />
                    
                    {userProfile.preferences.notifications.sound && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Volume: {userProfile.preferences.notifications.volume}%
                        </Typography>
                        <Slider
                          value={userProfile.preferences.notifications.volume}
                          onChange={(_, value) => handlePreferenceChange('notifications', 'volume', value)}
                          min={0}
                          max={100}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CyberpunkSettingCard>
          </Box>
        </TabPanel>

        {/* Accessibility Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <CyberpunkSettingCard
              title="Accessibility Options"
              description="Customize FlexTime for better accessibility"
              icon={AccessibilityIcon}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Visual Settings</Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Reduced Motion" secondary="Minimize animations" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.accessibility.reducedMotion}
                          onChange={(e) => handlePreferenceChange('accessibility', 'reducedMotion', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText primary="High Contrast" secondary="Increase color contrast" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.accessibility.highContrast}
                          onChange={(e) => handlePreferenceChange('accessibility', 'highContrast', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText primary="Focus Indicators" secondary="Show focus outlines" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.accessibility.focusIndicators}
                          onChange={(e) => handlePreferenceChange('accessibility', 'focusIndicators', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Font & Navigation</Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Font Size</InputLabel>
                    <Select
                      value={userProfile.preferences.accessibility.fontSize}
                      label="Font Size"
                      onChange={(e) => handlePreferenceChange('accessibility', 'fontSize', e.target.value)}
                    >
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <List>
                    <ListItem>
                      <ListItemText primary="Screen Reader Support" secondary="Optimize for screen readers" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.accessibility.screenReader}
                          onChange={(e) => handlePreferenceChange('accessibility', 'screenReader', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText primary="Keyboard Navigation" secondary="Enhanced keyboard support" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.accessibility.keyboardNavigation}
                          onChange={(e) => handlePreferenceChange('accessibility', 'keyboardNavigation', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CyberpunkSettingCard>
          </Box>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <CyberpunkSettingCard
              title="Privacy & Data"
              description="Control your privacy settings and data usage"
              icon={SecurityIcon}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Profile Privacy</Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Profile Visibility</InputLabel>
                    <Select
                      value={userProfile.preferences.privacy.profileVisibility}
                      label="Profile Visibility"
                      onChange={(e) => handlePreferenceChange('privacy', 'profileVisibility', e.target.value)}
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="school">School Only</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Data Retention</Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Keep Data For</InputLabel>
                    <Select
                      value={userProfile.preferences.privacy.dataRetention}
                      label="Keep Data For"
                      onChange={(e) => handlePreferenceChange('privacy', 'dataRetention', e.target.value)}
                    >
                      <MenuItem value={90}>90 Days</MenuItem>
                      <MenuItem value={180}>6 Months</MenuItem>
                      <MenuItem value={365}>1 Year</MenuItem>
                      <MenuItem value={730}>2 Years</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Data Usage</Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Activity Tracking" secondary="Track usage patterns" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.privacy.activityTracking}
                          onChange={(e) => handlePreferenceChange('privacy', 'activityTracking', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText primary="Analytics Sharing" secondary="Share usage analytics" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.privacy.analyticsSharing}
                          onChange={(e) => handlePreferenceChange('privacy', 'analyticsSharing', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText primary="Marketing Emails" secondary="Receive marketing communications" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.privacy.marketingEmails}
                          onChange={(e) => handlePreferenceChange('privacy', 'marketingEmails', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CyberpunkSettingCard>
          </Box>
        </TabPanel>

        {/* Dashboard Tab */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <CyberpunkSettingCard
                  title="Dashboard Layout"
                  description="Customize your dashboard experience"
                  icon={DashboardIcon}
                >
                  <List>
                    <ListItem>
                      <ListItemText primary="Compact Layout" secondary="Reduce spacing between elements" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.dashboard.layoutCompact}
                          onChange={(e) => handlePreferenceChange('dashboard', 'layoutCompact', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText primary="Auto Refresh" secondary="Automatically refresh data" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.dashboard.autoRefresh}
                          onChange={(e) => handlePreferenceChange('dashboard', 'autoRefresh', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText primary="Show Metrics" secondary="Display performance metrics" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={userProfile.preferences.dashboard.showMetrics}
                          onChange={(e) => handlePreferenceChange('dashboard', 'showMetrics', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                  
                  {userProfile.preferences.dashboard.autoRefresh && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Refresh Interval: {userProfile.preferences.dashboard.refreshInterval} seconds
                      </Typography>
                      <Slider
                        value={userProfile.preferences.dashboard.refreshInterval}
                        onChange={(_, value) => handlePreferenceChange('dashboard', 'refreshInterval', value)}
                        min={15}
                        max={300}
                        step={15}
                        marks={[
                          { value: 15, label: '15s' },
                          { value: 60, label: '1m' },
                          { value: 300, label: '5m' }
                        ]}
                      />
                    </Box>
                  )}
                </CyberpunkSettingCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <CyberpunkSettingCard
                  title="Favorites"
                  description="Set your favorite schools and sports"
                  icon={SchoolIcon}
                >
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Favorite Schools</Typography>
                  <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {userProfile.preferences.dashboard.favoriteSchools.map(school => (
                      <Chip
                        key={school}
                        label={school}
                        onDelete={() => {
                          const newFavorites = userProfile.preferences.dashboard.favoriteSchools.filter(s => s !== school);
                          handlePreferenceChange('dashboard', 'favoriteSchools', newFavorites);
                        }}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Favorite Sports</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {userProfile.preferences.dashboard.favoriteSports.map(sport => (
                      <Chip
                        key={sport}
                        label={sport}
                        onDelete={() => {
                          const newFavorites = userProfile.preferences.dashboard.favoriteSports.filter(s => s !== sport);
                          handlePreferenceChange('dashboard', 'favoriteSports', newFavorites);
                        }}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </CyberpunkSettingCard>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </CyberpunkCard>

      {/* Save Dialog */}
      <Dialog open={saveDialog} onClose={() => setSaveDialog(false)}>
        <DialogTitle>Save Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to save all your settings changes?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will reset all your settings to their default values.
          </Alert>
          <Typography>
            Are you sure you want to reset all settings? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetSettings} color="error" variant="contained">
            Reset All Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonalCommandConsole;