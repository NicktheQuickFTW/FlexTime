'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiService } from '@/lib/api'

interface ConnectionState {
  status: 'checking' | 'connected' | 'error' | 'disconnected'
  message: string
  data?: any
  lastChecked?: Date
}

interface SystemHealth {
  api: ConnectionState
  database: ConnectionState
  intelligence: ConnectionState
  overall: 'healthy' | 'degraded' | 'critical'
}

export function ConnectionStatus() {
  const [health, setHealth] = useState<SystemHealth>({
    api: { status: 'checking', message: 'Connecting...' },
    database: { status: 'checking', message: 'Connecting...' },
    intelligence: { status: 'checking', message: 'Connecting...' },
    overall: 'degraded'
  })
  
  const [isManualRefresh, setIsManualRefresh] = useState(false)

  const checkHealth = async () => {
    const newHealth: SystemHealth = {
      api: { status: 'checking', message: 'Checking API...' },
      database: { status: 'checking', message: 'Checking database...' },
      intelligence: { status: 'checking', message: 'Checking intelligence engine...' },
      overall: 'degraded'
    }

    try {
      // Check API Health
      const healthResponse = await apiService.getHealth()
      if (healthResponse.success) {
        newHealth.api = {
          status: 'connected',
          message: 'API is operational',
          data: healthResponse.data,
          lastChecked: new Date()
        }
      } else {
        newHealth.api = {
          status: 'error',
          message: healthResponse.error || 'API connection failed',
          lastChecked: new Date()
        }
      }

      // Check Status (includes database info)
      const statusResponse = await apiService.getStatus()
      if (statusResponse.success && statusResponse.data) {
        newHealth.database = {
          status: 'connected',
          message: 'Database connected',
          data: statusResponse.data,
          lastChecked: new Date()
        }
      } else {
        newHealth.database = {
          status: 'error',
          message: 'Database connection failed',
          lastChecked: new Date()
        }
      }

      // Check Intelligence Engine
      const intelligenceResponse = await apiService.getIntelligenceStatus()
      if (intelligenceResponse.success) {
        newHealth.intelligence = {
          status: 'connected',
          message: 'HELiiX Intelligence Engine online',
          data: intelligenceResponse.data,
          lastChecked: new Date()
        }
      } else {
        newHealth.intelligence = {
          status: 'error',
          message: 'Intelligence engine unavailable',
          lastChecked: new Date()
        }
      }

      // Determine overall health
      const connectedCount = [newHealth.api, newHealth.database, newHealth.intelligence]
        .filter(service => service.status === 'connected').length

      if (connectedCount === 3) {
        newHealth.overall = 'healthy'
      } else if (connectedCount >= 1) {
        newHealth.overall = 'degraded'
      } else {
        newHealth.overall = 'critical'
      }

    } catch (error) {
      console.error('Health check failed:', error)
      newHealth.api.status = 'error'
      newHealth.api.message = 'Failed to connect to backend'
      newHealth.database.status = 'error'
      newHealth.database.message = 'Unable to verify database'
      newHealth.intelligence.status = 'error'
      newHealth.intelligence.message = 'Unable to verify intelligence engine'
      newHealth.overall = 'critical'
    }

    setHealth(newHealth)
    setIsManualRefresh(false)
  }

  useEffect(() => {
    checkHealth()
    
    // Set up periodic health checks
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const handleManualRefresh = () => {
    setIsManualRefresh(true)
    checkHealth()
  }

  const getStatusIcon = (status: ConnectionState['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: ConnectionState['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'disconnected':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'checking':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getOverallStatusColor = (overall: SystemHealth['overall']) => {
    switch (overall) {
      case 'healthy':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <Card className="ft-glass border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            System Health
            <Badge className={getOverallStatusColor(health.overall)}>
              {health.overall.toUpperCase()}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isManualRefresh}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
          >
            {isManualRefresh ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="wait">
          {[
            { key: 'api', label: 'API Server', state: health.api },
            { key: 'database', label: 'Database', state: health.database },
            { key: 'intelligence', label: 'Intelligence Engine', state: health.intelligence },
          ].map(({ key, label, state }) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(state.status)}
                <div>
                  <span className="text-slate-300 font-medium">{label}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{state.message}</p>
                </div>
              </div>
              <Badge className={getStatusColor(state.status)}>
                {state.status === 'checking' ? 'Checking' : 
                 state.status === 'connected' ? 'Online' :
                 state.status === 'error' ? 'Error' : 'Offline'}
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {health.api.lastChecked && (
          <p className="text-xs text-slate-500 mt-4">
            Last checked: {health.api.lastChecked.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}