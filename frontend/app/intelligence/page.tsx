'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Cpu, 
  Activity, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Network, 
  Eye,
  Play,
  Pause,
  RotateCcw,
  Settings
} from 'lucide-react'

// Neural Network Canvas Component
const NeuralNetworkCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Neural network nodes
    const nodes: { x: number; y: number; vx: number; vy: number; connections: number[] }[] = []
    const nodeCount = 50
    
    // Initialize nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: []
      })
    }
    
    // Create connections
    nodes.forEach((node, i) => {
      const nearbyNodes = nodes.filter((otherNode, j) => {
        if (i === j) return false
        const distance = Math.sqrt(
          Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
        )
        return distance < 120
      })
      
      node.connections = nearbyNodes.slice(0, 3).map(nearbyNode => nodes.indexOf(nearbyNode))
    })
    
    let animationId: number
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      
      // Update node positions
      nodes.forEach(node => {
        node.x += node.vx
        node.y += node.vy
        
        // Bounce off edges
        if (node.x < 0 || node.x > canvas.offsetWidth) node.vx *= -1
        if (node.y < 0 || node.y > canvas.offsetHeight) node.vy *= -1
        
        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.offsetWidth, node.x))
        node.y = Math.max(0, Math.min(canvas.offsetHeight, node.y))
      })
      
      // Draw connections
      ctx.strokeStyle = 'rgba(0, 191, 255, 0.2)'
      ctx.lineWidth = 1
      
      nodes.forEach(node => {
        node.connections.forEach(connectionIndex => {
          const connectedNode = nodes[connectionIndex]
          if (connectedNode) {
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(connectedNode.x, connectedNode.y)
            ctx.stroke()
          }
        })
      })
      
      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 191, 255, 0.8)'
        ctx.fill()
        
        // Glow effect
        ctx.beginPath()
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 191, 255, 0.1)'
        ctx.fill()
      })
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  )
}

// Real-time Chart Component
const RealtimeChart = () => {
  const [data, setData] = useState<number[]>(Array(20).fill(0).map(() => Math.random() * 100))
  const [isPlaying, setIsPlaying] = useState(true)
  
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData]
        newData.shift()
        newData.push(Math.random() * 100)
        return newData
      })
    }, 200)
    
    return () => clearInterval(interval)
  }, [isPlaying])
  
  const maxValue = Math.max(...data)
  
  return (
    <div className="ft-glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[var(--ft-neon)]" />
          Predictive Analytics
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setData(Array(20).fill(0).map(() => Math.random() * 100))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="h-32 flex items-end justify-between gap-1">
        {data.map((value, index) => (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${(value / maxValue) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-t from-[var(--ft-neon)] to-cyan-300 rounded-t-sm min-h-1"
            style={{ width: 'calc(100% / 20 - 2px)' }}
          />
        ))}
      </div>
    </div>
  )
}

// AI Algorithm Status Cards
const algorithmData = [
  {
    name: 'Constraint Solver',
    status: 'Active',
    efficiency: 94.7,
    process: 'Optimizing schedules...',
    color: 'from-green-400 to-emerald-500'
  },
  {
    name: 'Pattern Recognition',
    status: 'Learning',
    efficiency: 87.3,
    process: 'Analyzing historical data...',
    color: 'from-blue-400 to-cyan-500'
  },
  {
    name: 'Conflict Resolution',
    status: 'Processing',
    efficiency: 91.2,
    process: 'Resolving conflicts...',
    color: 'from-purple-400 to-violet-500'
  },
  {
    name: 'Predictive Engine',
    status: 'Standby',
    efficiency: 96.8,
    process: 'Monitoring trends...',
    color: 'from-amber-400 to-orange-500'
  }
]

export default function IntelligencePage() {
  const [activeView, setActiveView] = useState<'overview' | 'algorithms' | 'analytics' | 'network'>('overview')
  const [metrics, setMetrics] = useState({
    cpu: 73.2,
    memory: 45.8,
    network: 84.1,
    storage: 62.3
  })
  
  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(20, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(95, prev.memory + (Math.random() - 0.5) * 8)),
        network: Math.max(20, Math.min(95, prev.network + (Math.random() - 0.5) * 12)),
        storage: Math.max(20, Math.min(95, prev.storage + (Math.random() - 0.5) * 5))
      }))
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Neural Network Background */}
      <div className="absolute inset-0 opacity-30">
        <NeuralNetworkCanvas />
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-[var(--ft-neon)] to-purple-400 bg-clip-text text-transparent">
            HELiiX Intelligence Engine
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced AI-powered optimization and predictive analytics for Big 12 Conference scheduling
          </p>
          
          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[var(--ft-neon)] rounded-full animate-pulse shadow-[0_0_10px_var(--ft-neon)]" />
              <span className="text-sm font-medium">System Online</span>
            </div>
            <div className="w-px h-4 bg-gray-600" />
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[var(--ft-neon)]" />
              <span className="text-sm">4 Algorithms Active</span>
            </div>
          </div>
        </motion.div>
        
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="ft-glass-card p-2 flex gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'algorithms', label: 'Algorithms', icon: Cpu },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'network', label: 'Network', icon: Network }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
                  activeView === id
                    ? 'bg-[var(--ft-neon)] text-black font-semibold'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>
        
        {/* Content Views */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {activeView === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Metrics */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'CPU Usage', value: metrics.cpu, icon: Cpu, unit: '%' },
                      { label: 'Memory', value: metrics.memory, icon: Activity, unit: '%' },
                      { label: 'Network', value: metrics.network, icon: Network, unit: '%' },
                      { label: 'Storage', value: metrics.storage, icon: Zap, unit: '%' }
                    ].map((metric) => (
                      <div key={metric.label} className="ft-glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <metric.icon className="w-5 h-5 text-[var(--ft-neon)]" />
                          <span className="text-2xl font-bold">
                            {metric.value.toFixed(1)}{metric.unit}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{metric.label}</p>
                        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.value}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-[var(--ft-neon)] to-cyan-300 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <RealtimeChart />
                </div>
                
                {/* Processing Pipeline */}
                <div className="space-y-6">
                  <div className="ft-glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[var(--ft-neon)]" />
                      Processing Pipeline
                    </h3>
                    <div className="space-y-4">
                      {[
                        { step: 'Data Ingestion', status: 'Complete', progress: 100 },
                        { step: 'Pattern Recognition', status: 'Processing', progress: 75 },
                        { step: 'ML Processing', status: 'Active', progress: 60 },
                        { step: 'Optimization', status: 'Queued', progress: 25 },
                        { step: 'Output Generation', status: 'Pending', progress: 0 }
                      ].map((item, index) => (
                        <motion.div
                          key={item.step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{item.step}</p>
                            <p className="text-sm text-gray-400">{item.status}</p>
                          </div>
                          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                              className="h-full bg-gradient-to-r from-[var(--ft-neon)] to-cyan-300 rounded-full"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'algorithms' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {algorithmData.map((algorithm, index) => (
                  <motion.div
                    key={algorithm.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="ft-glass-card p-6 hover:scale-105 transition-transform"
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${algorithm.color} flex items-center justify-center`}>
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{algorithm.name}</h3>
                      <p className="text-sm text-gray-300 mb-4">{algorithm.process}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Efficiency</span>
                          <span className="font-bold">{algorithm.efficiency}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${algorithm.efficiency}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className={`h-full bg-gradient-to-r ${algorithm.color} rounded-full`}
                          />
                        </div>
                        
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                          algorithm.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                          algorithm.status === 'Learning' ? 'bg-blue-500/20 text-blue-400' :
                          algorithm.status === 'Processing' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {algorithm.status}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {activeView === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RealtimeChart />
                <div className="ft-glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--ft-neon)]" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Schedules Generated', value: '2,847', change: '+12%' },
                      { label: 'Conflicts Resolved', value: '156', change: '-8%' },
                      { label: 'Optimization Rate', value: '94.7%', change: '+3%' },
                      { label: 'Processing Speed', value: '2.3s avg', change: '-15%' }
                    ].map((metric, index) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{metric.label}</p>
                          <p className="text-2xl font-bold text-[var(--ft-neon)]">{metric.value}</p>
                        </div>
                        <div className={`text-sm font-medium ${
                          metric.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {metric.change}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'network' && (
              <div className="ft-glass-card p-8 text-center">
                <h3 className="text-2xl font-semibold mb-6 flex items-center justify-center gap-2">
                  <Network className="w-6 h-6 text-[var(--ft-neon)]" />
                  Neural Network Topology
                </h3>
                <div className="relative h-96 rounded-lg bg-black/20 overflow-hidden">
                  <NeuralNetworkCanvas />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="ft-glass-card p-6 text-center">
                      <p className="text-lg mb-2">Active Nodes: <span className="text-[var(--ft-neon)] font-bold">50</span></p>
                      <p className="text-lg mb-2">Connections: <span className="text-[var(--ft-neon)] font-bold">127</span></p>
                      <p className="text-lg">Network Health: <span className="text-green-400 font-bold">98.3%</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}