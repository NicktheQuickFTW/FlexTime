'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot,
  Send,
  Sparkles,
  Calendar,
  Users,
  MapPin,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: ScheduleSuggestion[]
}

interface ScheduleSuggestion {
  id: string
  title: string
  description: string
  confidence: number
  action: string
  impact: 'low' | 'medium' | 'high'
}

const sampleSuggestions: ScheduleSuggestion[] = [
  {
    id: '1',
    title: 'Optimize KU vs KSU Rivalry Game',
    description: 'Schedule during winter break for maximum attendance',
    confidence: 92,
    action: 'Move to December 28th',
    impact: 'high'
  },
  {
    id: '2',
    title: 'Reduce Travel for Texas Teams',
    description: 'Group Texas Tech, TCU, and Baylor games in consecutive weeks',
    confidence: 87,
    action: 'Create travel pod',
    impact: 'medium'
  },
  {
    id: '3',
    title: 'Avoid Finals Week Conflicts',
    description: 'Several games scheduled during academic finals periods',
    confidence: 95,
    action: 'Reschedule 4 games',
    impact: 'high'
  }
]

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m FlexTime AI, your intelligent scheduling assistant. I can help you optimize your Big 12 basketball schedule, resolve conflicts, and suggest improvements. What would you like to work on today?',
    timestamp: new Date(),
    suggestions: sampleSuggestions
  }
]

export default function AISchedulingAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response (in real implementation, this would call AI SDK)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
        suggestions: inputValue.toLowerCase().includes('schedule') ? sampleSuggestions.slice(0, 2) : undefined
      }

      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('schedule') && lowerInput.includes('kansas')) {
      return 'I found several opportunities to optimize Kansas\' schedule. Based on COMPASS analytics, I recommend scheduling the KU vs KSU rivalry game on December 28th for maximum impact. This avoids finals conflicts and capitalizes on winter break attendance. Would you like me to make this change?'
    }
    
    if (lowerInput.includes('travel') || lowerInput.includes('distance')) {
      return 'I\'ve analyzed travel patterns for all Big 12 teams. The current schedule has an average travel distance of 385 miles per game. I can reduce this by 23% by creating geographic pods and scheduling consecutive games. This would save approximately $47,000 in travel costs across the season.'
    }
    
    if (lowerInput.includes('conflict') || lowerInput.includes('finals')) {
      return 'I detected 7 potential conflicts with academic calendars. The most critical are 3 games scheduled during finals week at Kansas, Baylor, and Iowa State. I can automatically reschedule these to avoid academic conflicts while maintaining competitive balance.'
    }
    
    return 'I understand you\'re looking to optimize your schedule. I can help with travel efficiency, conflict resolution, competitive balance, and revenue optimization. What specific aspect would you like me to focus on?'
  }

  const handleApplySuggestion = (suggestion: ScheduleSuggestion) => {
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Perfect! I've applied the suggestion: "${suggestion.title}". ${suggestion.action} has been implemented. This change improves your schedule quality score by ${Math.floor(Math.random() * 5) + 3} points.`,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, confirmMessage])
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const quickActions = [
    { icon: Calendar, label: 'Auto-Schedule', action: 'Generate a complete schedule for remaining games' },
    { icon: MapPin, label: 'Optimize Travel', action: 'Minimize travel distance and costs' },
    { icon: Users, label: 'Balance Games', action: 'Ensure fair home/away distribution' },
    { icon: Clock, label: 'Resolve Conflicts', action: 'Fix all scheduling conflicts automatically' }
  ]

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardTitle className="flex items-center text-lg">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 mr-3">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          FlexTime AI Assistant
          <Sparkles className="h-4 w-4 ml-2 text-amber-500" />
        </CardTitle>
        <CardDescription>
          Intelligent scheduling optimization powered by machine learning
        </CardDescription>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-8 w-8 mx-2">
                    {message.role === 'assistant' ? (
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900/20">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-green-100 dark:bg-green-900/20">
                        U
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className={`space-y-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {message.content}
                    </div>
                    
                    {/* AI Suggestions */}
                    {message.suggestions && (
                      <div className="space-y-2 mt-3">
                        <div className="text-xs text-gray-500 mb-2">AI Suggestions:</div>
                        {message.suggestions.map((suggestion) => (
                          <motion.div
                            key={suggestion.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-gray-900 border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="text-sm font-medium">{suggestion.title}</h4>
                                  <Badge className={getImpactColor(suggestion.impact)}>
                                    {suggestion.impact}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                  {suggestion.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <Zap className="h-3 w-3 mr-1" />
                                    {suggestion.confidence}% confidence
                                  </div>
                                  <div className="flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {suggestion.action}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleApplySuggestion(suggestion)}
                            >
                              Apply Suggestion
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900/20">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="border-t p-3 bg-gray-50 dark:bg-gray-900/20">
          <div className="text-xs text-gray-500 mb-2">Quick Actions:</div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-auto p-2 text-left justify-start"
                onClick={() => setInputValue(action.action)}
              >
                <action.icon className="h-3 w-3 mr-2 shrink-0" />
                <span className="text-xs truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about your schedule..."
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}