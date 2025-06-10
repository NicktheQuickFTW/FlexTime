'use client'

import React, { useState, useEffect } from 'react'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  BarChart3,
  Zap,
  Target
} from 'lucide-react'

// Big 12 Teams Data
const big12Teams = [
  { id: 1, name: "Kansas", shortName: "KU", logo: "/logos/kansas.png", color: "#0051BA" },
  { id: 2, name: "Kansas State", shortName: "KSU", logo: "/logos/kansas-state.png", color: "#512888" },
  { id: 3, name: "Iowa State", shortName: "ISU", logo: "/logos/iowa-state.png", color: "#C8102E" },
  { id: 4, name: "Baylor", shortName: "BU", logo: "/logos/baylor.png", color: "#003015" },
  { id: 5, name: "Texas Tech", shortName: "TTU", logo: "/logos/texas-tech.png", color: "#CC0000" },
  { id: 6, name: "TCU", shortName: "TCU", logo: "/logos/tcu.png", color: "#4D1979" },
  { id: 7, name: "Oklahoma State", shortName: "OSU", logo: "/logos/oklahoma-state.png", color: "#FF7300" },
  { id: 8, name: "West Virginia", shortName: "WVU", logo: "/logos/west-virginia.png", color: "#002855" },
  { id: 9, name: "Cincinnati", shortName: "UC", logo: "/logos/cincinnati.png", color: "#E00122" },
  { id: 10, name: "Houston", shortName: "UH", logo: "/logos/houston.png", color: "#C8102E" },
  { id: 11, name: "UCF", shortName: "UCF", logo: "/logos/ucf.png", color: "#000000" },
  { id: 12, name: "BYU", shortName: "BYU", logo: "/logos/byu.png", color: "#002E5D" },
  { id: 13, name: "Arizona", shortName: "UA", logo: "/logos/arizona.png", color: "#003366" },
  { id: 14, name: "Arizona State", shortName: "ASU", logo: "/logos/arizona-state.png", color: "#8C1D40" },
  { id: 15, name: "Colorado", shortName: "CU", logo: "/logos/colorado.png", color: "#000000" },
  { id: 16, name: "Utah", shortName: "UU", logo: "/logos/utah.png", color: "#CC0000" }
]

// Sample game data
const sampleGames = [
  { id: 1, home: "Kansas", away: "Kansas State", date: "2025-01-15", venue: "Allen Fieldhouse", status: "scheduled" },
  { id: 2, home: "Baylor", away: "Iowa State", date: "2025-01-18", venue: "Ferrell Center", status: "scheduled" },
  { id: 3, home: "Texas Tech", away: "TCU", date: "2025-01-22", venue: "United Supermarkets Arena", status: "conflict" },
]

// Constraint data
const constraints = [
  { name: "Rest Days", value: 85, status: "good", description: "Teams have adequate rest between games" },
  { name: "Travel Efficiency", value: 72, status: "warning", description: "Some suboptimal travel patterns detected" },
  { name: "Campus Conflicts", value: 95, status: "good", description: "No major conflicts with academic calendar" },
  { name: "Venue Availability", value: 60, status: "error", description: "3 venue conflicts need resolution" },
]

export default function ScheduleBuilder() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false)
  const [games, setGames] = useState(sampleGames)
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')

  const getConstraintColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500'
      case 'warning': return 'text-yellow-500' 
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getConstraintIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'error': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">FlexTime Schedule Builder</h1>
            </div>
            <Badge variant="secondary" className="text-xs">
              Big 12 Basketball • 2024-25 Season
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Teams & Controls */}
        <div className="w-80 border-r bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
          <div className="p-6 space-y-6">
            {/* Teams Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Big 12 Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Command>
                  <CommandInput placeholder="Search teams..." className="h-8" />
                  <CommandList className="max-h-40">
                    <CommandEmpty>No teams found.</CommandEmpty>
                    <CommandGroup>
                      {big12Teams.map((team) => (
                        <CommandItem
                          key={team.id}
                          value={team.name}
                          onSelect={() => setSelectedTeam(team.name)}
                          className="cursor-pointer"
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={team.logo} alt={team.name} />
                            <AvatarFallback className="text-xs">{team.shortName}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{team.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Auto-Schedule Round Robin
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Optimize Travel
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Import Academic Calendar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Schedule View */}
          <div className="flex-1 p-6">
            <div className="space-y-6">
              {/* View Controls */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Schedule Overview</h2>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={viewMode === 'calendar' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                  >
                    Calendar
                  </Button>
                  <Button 
                    variant={viewMode === 'table' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </Button>
                </div>
              </div>

              {/* Calendar View */}
              {viewMode === 'calendar' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border-0"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </Card>
                </motion.div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scheduled Games</CardTitle>
                      <CardDescription>
                        {games.length} games scheduled • {games.filter(g => g.status === 'conflict').length} conflicts to resolve
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Matchup</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {games.map((game) => (
                            <TableRow key={game.id}>
                              <TableCell className="font-medium">
                                {new Date(game.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span>{game.away}</span>
                                  <span className="text-muted-foreground">@</span>
                                  <span className="font-medium">{game.home}</span>
                                </div>
                              </TableCell>
                              <TableCell>{game.venue}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={game.status === 'scheduled' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {game.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Constraints & Analytics */}
          <div className="w-80 border-l bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
            <div className="p-6 space-y-6">
              {/* Constraint Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Constraint Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {constraints.map((constraint, index) => (
                    <motion.div
                      key={constraint.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={getConstraintColor(constraint.status)}>
                            {getConstraintIcon(constraint.status)}
                          </span>
                          <span className="text-sm font-medium">{constraint.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{constraint.value}%</span>
                      </div>
                      <Progress value={constraint.value} className="h-2" />
                      <p className="text-xs text-muted-foreground">{constraint.description}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Schedule Quality Score */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Schedule Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-blue-600">78</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                    <Progress value={78} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Good schedule quality. Resolve venue conflicts to improve.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Games</span>
                    <span className="font-medium">240</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conference Games</span>
                    <span className="font-medium">160</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average Travel</span>
                    <span className="font-medium">385 mi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rest Days</span>
                    <span className="font-medium">2.1 avg</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}