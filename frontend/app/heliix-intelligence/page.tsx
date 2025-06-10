'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  Zap, 
  Eye,
  Cpu,
  BarChart3,
  Network,
  Sparkles,
  Target,
  Clock,
  Database,
  Globe,
  Monitor,
  ChevronRight,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Search,
  Settings,
  Download,
  Share2,
  Maximize2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Neural Network Animation Component
const NeuralNetwork = ({ className = '' }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();

    // Neural network nodes
    const nodes: Array<{ x: number; y: number; vx: number; vy: number; connections: number[] }> = [];
    for (let i = 0; i < 50; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: []
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.hypot(nodes[j].x - node.x, nodes[j].y - node.y);
        if (distance < 120 && Math.random() > 0.7) {
          node.connections.push(j);
        }
      }
    });

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Update node positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.offsetWidth) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.offsetHeight) node.vy *= -1;
      });

      // Draw connections
      ctx.strokeStyle = 'rgba(0, 191, 255, 0.3)';
      ctx.lineWidth = 1;
      nodes.forEach((node, i) => {
        node.connections.forEach(connectionIndex => {
          const connectedNode = nodes[connectionIndex];
          const distance = Math.hypot(connectedNode.x - node.x, connectedNode.y - node.y);
          const opacity = Math.max(0, 1 - distance / 120);
          
          ctx.globalAlpha = opacity * 0.6;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connectedNode.x, connectedNode.y);
          ctx.stroke();
        });
      });

      // Draw nodes
      ctx.globalAlpha = 1;
      nodes.forEach(node => {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 4);
        gradient.addColorStop(0, 'rgba(0, 191, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 191, 255, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Real-time Metric Component
const MetricCard = ({ 
  title, 
  value, 
  unit, 
  change, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  icon: any;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'purple' | 'cyan';
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      const duration = 2000;
      const steps = 60;
      const increment = numValue / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= numValue) {
          current = numValue;
          clearInterval(timer);
        }
        setAnimatedValue(current);
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value]);

  const colorMap = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
  };

  const iconColorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.6, delay: Math.random() * 0.3 }}
      className={`ft-glass-card relative overflow-hidden ${colorMap[color]}`}
    >
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className={`w-8 h-8 ${iconColorMap[color]}`} />
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' ? 'text-green-400' : 
              trend === 'down' ? 'text-red-400' : 
              'text-gray-400'
            }`}>
              <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {change}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white ft-font-mono">
              {typeof value === 'number' ? animatedValue.toFixed(0) : value}
            </span>
            {unit && <span className="text-lg text-white/60">{unit}</span>}
          </div>
          <p className="text-sm text-white/70 ft-font-ui">{title}</p>
        </div>
      </div>
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} animate-pulse`} />
      </div>
    </motion.div>
  );
};

// Live Processing Animation
const ProcessingAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    'Data Ingestion',
    'Pattern Recognition',
    'ML Processing',
    'Optimization',
    'Output Generation'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ft-glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-white ft-font-brand">Live Processing</h3>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-500 ${
              currentStep === index 
                ? 'bg-cyan-500/20 border border-cyan-500/40' 
                : 'bg-white/5'
            }`}
            animate={{
              scale: currentStep === index ? 1.02 : 1,
              opacity: currentStep === index ? 1 : 0.6
            }}
          >
            <div className={`w-3 h-3 rounded-full ${
              currentStep === index ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'
            }`} />
            <span className="text-white ft-font-ui">{step}</span>
            {currentStep === index && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
                className="ml-auto h-1 bg-cyan-400 rounded-full"
                style={{ maxWidth: '60px' }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Interactive Chart Component
const InteractiveChart = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let dataPoints: number[] = [];
    for (let i = 0; i < 100; i++) {
      dataPoints.push(Math.random() * 80 + 20);
    }

    let animationId: number;
    let frameCount = 0;

    const animate = () => {
      if (!isPlaying) return;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Add new data point
      if (frameCount % 60 === 0) {
        dataPoints.shift();
        dataPoints.push(Math.random() * 80 + 20);
      }

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = (canvas.offsetHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.offsetWidth, y);
        ctx.stroke();
      }

      // Draw area chart
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight);
      gradient.addColorStop(0, 'rgba(0, 191, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 191, 255, 0.1)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, canvas.offsetHeight);

      dataPoints.forEach((point, index) => {
        const x = (canvas.offsetWidth / (dataPoints.length - 1)) * index;
        const y = canvas.offsetHeight - (point / 100) * canvas.offsetHeight;
        
        if (index === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight);
      ctx.closePath();
      ctx.fill();

      // Draw line
      ctx.strokeStyle = 'rgba(0, 191, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      dataPoints.forEach((point, index) => {
        const x = (canvas.offsetWidth / (dataPoints.length - 1)) * index;
        const y = canvas.offsetHeight - (point / 100) * canvas.offsetHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      frameCount++;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying]);

  return (
    <div className="ft-glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white ft-font-brand">Predictive Analytics</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:bg-white/10"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
          >
            <option value="1h">1h</option>
            <option value="6h">6h</option>
            <option value="24h">24h</option>
            <option value="7d">7d</option>
          </select>
        </div>
      </div>
      
      <div className="relative h-48">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

// AI Algorithm Status
const AlgorithmStatus = () => {
  const algorithms = [
    { name: 'Schedule Optimizer', status: 'active', efficiency: 98.5, color: 'green' },
    { name: 'Conflict Resolver', status: 'active', efficiency: 96.2, color: 'blue' },
    { name: 'Resource Manager', status: 'active', efficiency: 94.8, color: 'purple' },
    { name: 'Pattern Learner', status: 'training', efficiency: 87.3, color: 'cyan' },
  ];

  return (
    <div className="ft-glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-bold text-white ft-font-brand">AI Algorithms</h3>
      </div>

      <div className="space-y-4">
        {algorithms.map((algo, index) => (
          <motion.div
            key={algo.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                algo.status === 'active' ? 'bg-green-400 animate-pulse' : 
                algo.status === 'training' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
              }`} />
              <span className="text-white ft-font-ui">{algo.name}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-white/70">Efficiency</div>
                <div className="text-lg font-bold text-white ft-font-mono">{algo.efficiency}%</div>
              </div>
              <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${algo.efficiency}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                  className={`h-full rounded-full ${
                    algo.color === 'green' ? 'bg-green-400' :
                    algo.color === 'blue' ? 'bg-blue-400' :
                    algo.color === 'purple' ? 'bg-purple-400' :
                    'bg-cyan-400'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main HELiiX Intelligence Engine Page
export default function HELiiXIntelligencePage() {
  const [selectedView, setSelectedView] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const views = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'algorithms', label: 'Algorithms', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'network', label: 'Network', icon: Network },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
            <Brain className="absolute inset-0 m-auto w-16 h-16 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 ft-font-brand">Initializing HELiiX</h2>
          <p className="text-cyan-400 ft-font-ui">Intelligence Engine Booting...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <NeuralNetwork />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/90" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 bg-black/40 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white ft-font-brand">
                    HELiiX Intelligence Engine
                  </h1>
                  <p className="text-cyan-400 ft-font-ui">Advanced AI-Powered Schedule Optimization</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Navigation Pills */}
            <div className="flex gap-2 mt-6">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedView === view.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        {/* Main Dashboard */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedView === 'overview' && (
                <div className="space-y-8">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                      title="Active Schedules"
                      value={247}
                      icon={Activity}
                      trend="up"
                      change="+12%"
                      color="blue"
                    />
                    <MetricCard
                      title="Processing Speed"
                      value={1.2}
                      unit="ms"
                      icon={Zap}
                      trend="down"
                      change="-5%"
                      color="green"
                    />
                    <MetricCard
                      title="Success Rate"
                      value={98.7}
                      unit="%"
                      icon={Target}
                      trend="up"
                      change="+2.1%"
                      color="purple"
                    />
                    <MetricCard
                      title="Data Points"
                      value="1.4M"
                      icon={Database}
                      trend="up"
                      change="+18%"
                      color="cyan"
                    />
                  </div>

                  {/* Main Dashboard Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <InteractiveChart />
                    </div>
                    <div>
                      <ProcessingAnimation />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AlgorithmStatus />
                    
                    {/* System Health */}
                    <div className="ft-glass-card p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Monitor className="w-6 h-6 text-green-400" />
                        <h3 className="text-xl font-bold text-white ft-font-brand">System Health</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { label: 'CPU Usage', value: 23, color: 'green' },
                          { label: 'Memory', value: 67, color: 'yellow' },
                          { label: 'Network', value: 12, color: 'green' },
                          { label: 'Storage', value: 89, color: 'red' },
                        ].map((metric, index) => (
                          <div key={metric.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-white/70">{metric.label}</span>
                              <span className="text-white font-mono">{metric.value}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.value}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={`h-full rounded-full ${
                                  metric.color === 'green' ? 'bg-green-400' :
                                  metric.color === 'yellow' ? 'bg-yellow-400' :
                                  'bg-red-400'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedView === 'algorithms' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4 ft-font-brand">
                      AI Algorithm Performance
                    </h2>
                    <p className="text-xl text-cyan-400 ft-font-ui">
                      Real-time monitoring of machine learning models
                    </p>
                  </div>
                  
                  <AlgorithmStatus />
                  
                  {/* Additional algorithm visualizations would go here */}
                </div>
              )}

              {selectedView === 'analytics' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4 ft-font-brand">
                      Predictive Analytics
                    </h2>
                    <p className="text-xl text-cyan-400 ft-font-ui">
                      Advanced data insights and forecasting
                    </p>
                  </div>
                  
                  <InteractiveChart />
                  
                  {/* Additional analytics visualizations would go here */}
                </div>
              )}

              {selectedView === 'network' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4 ft-font-brand">
                      Neural Network Visualization
                    </h2>
                    <p className="text-xl text-cyan-400 ft-font-ui">
                      Live view of AI network topology
                    </p>
                  </div>
                  
                  <div className="ft-glass-card p-8 h-96 relative">
                    <NeuralNetwork className="opacity-80" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}