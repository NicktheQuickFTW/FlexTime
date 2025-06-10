'use client'

import React, { useState } from 'react'
import ScheduleBuilder from '@/components/scheduling/ScheduleBuilder'
import AISchedulingAssistant from '@/components/scheduling/AISchedulingAssistant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { motion } from 'framer-motion'
import { 
  Bot, 
  Sparkles, 
  Calendar,
  BarChart3,
  Settings,
  Zap,
  Trophy,
  Target,
  Users
} from 'lucide-react'

export default function FTBuilder() {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Hero Section */}
      <div className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                FT Builder
              </h1>
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              The ultimate sports scheduling engine with advanced AI optimization. 
              Built for the Big 12 Conference and collegiate athletics.
            </p>

            <div className="flex items-center justify-center space-x-4 mt-6">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Trophy className="h-4 w-4 mr-2" />
                Big 12 Conference Ready
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Target className="h-4 w-4 mr-2" />
                AI-Powered Optimization
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Users className="h-4 w-4 mr-2" />
                Real-time Collaboration
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <Sheet open={isAIAssistantOpen} onOpenChange={setIsAIAssistantOpen}>
                <SheetTrigger asChild>
                  <Button size="lg" className="px-8">
                    <Bot className="h-5 w-5 mr-2" />
                    Open AI Assistant
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[500px] sm:w-[600px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center">
                      <Bot className="h-5 w-5 mr-2" />
                      AI Scheduling Assistant
                    </SheetTitle>
                    <SheetDescription>
                      Get intelligent recommendations and automate complex scheduling tasks
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <AISchedulingAssistant />
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" size="lg" className="px-8">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Analytics
              </Button>
              
              <Button variant="outline" size="lg" className="px-8">
                <Settings className="h-5 w-5 mr-2" />
                Configure
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                Lightning Fast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Generate complete schedules in seconds, not hours. Our advanced algorithms 
                handle complex constraints automatically.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Generation Speed</span>
                  <span className="font-medium">2.1 seconds</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Constraint Satisfaction</span>
                  <span className="font-medium">95.7%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Bot className="h-5 w-5 mr-2 text-purple-600" />
                AI-Powered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Machine learning algorithms continuously improve scheduling quality 
                and predict potential conflicts before they occur.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Prediction Accuracy</span>
                  <span className="font-medium">92.3%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Optimization Level</span>
                  <span className="font-medium">Advanced</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Collaborative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Real-time collaboration tools allow multiple stakeholders to work 
                together seamlessly with live updates and conflict resolution.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Active Users</span>
                  <span className="font-medium">12 online</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Sync Latency</span>
                  <span className="font-medium">&lt;50ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Competitive Advantage Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Why FlexTime Beats the Competition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">vs FastBreak.ai</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      10x more affordable for conferences
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Modern glassmorphic interface
                    </li>
                    <li className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Built specifically for academic athletics
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">vs Legacy Systems</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Real-time collaboration vs file sharing
                    </li>
                    <li className="flex items-center">
                      <Bot className="h-4 w-4 mr-2" />
                      AI optimization vs manual processes
                    </li>
                    <li className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Cloud-native vs desktop software
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Schedule Builder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <ScheduleBuilder />
      </motion.div>

      {/* Floating AI Assistant Toggle */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Sheet open={isAIAssistantOpen} onOpenChange={setIsAIAssistantOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg" 
              className="rounded-full w-16 h-16 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Bot className="h-6 w-6" />
            </Button>
          </SheetTrigger>
        </Sheet>
      </motion.div>
    </div>
  )
}