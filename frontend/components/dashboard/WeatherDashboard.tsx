'use client'

import * as React from "react"
import { NeonButton } from "@/src/components/ui/NeonButton"
import { Toggle } from "@/src/components/ui/toggle"
import { WeatherData, WeatherWidget } from "@/src/components/ui/weather-widget"
import { Lightbulb, Thermometer } from "lucide-react"
import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'

// Complete Big 12 Conference venues - All 16 schools
const mockWeatherData = {
  // Current Big 12 Members
  lawrence: {
    city: "Lawrence, KS",
    temperature: 28,
    weatherType: "clear",
    dateTime: "Wed, Feb 26, 10:30 AM",
    isDay: true
  } as WeatherData,
  lubbock: {
    city: "Lubbock, TX", 
    temperature: 14,
    weatherType: "rain",
    dateTime: "Wed, Feb 26, 10:30 AM",
    isDay: true
  } as WeatherData,
  boulder: {
    city: "Boulder, CO",
    temperature: -2,
    weatherType: "snow",
    dateTime: "Wed, Feb 26, 10:30 AM", 
    isDay: true
  } as WeatherData,
  morgantown: {
    city: "Morgantown, WV",
    temperature: 18,
    weatherType: "clouds",
    dateTime: "Wed, Feb 26, 6:30 PM",
    isDay: false
  } as WeatherData,
  tempe: {
    city: "Tempe, AZ",
    temperature: 32,
    weatherType: "clear",
    dateTime: "Thu, Feb 27, 1:30 AM",
    isDay: false
  } as WeatherData,
  houston: {
    city: "Houston, TX",
    temperature: 30,
    weatherType: "thunderstorm", 
    dateTime: "Wed, Feb 26, 10:30 AM",
    isDay: true
  } as WeatherData,
  ames: {
    city: "Ames, IA",
    temperature: 15,
    weatherType: "mist",
    dateTime: "Wed, Feb 26, 10:30 AM",
    isDay: true
  } as WeatherData,
  // Additional Big 12 Members
  waco: {
    city: "Waco, TX",
    temperature: 26,
    weatherType: "clear",
    dateTime: "Wed, Feb 26, 11:00 AM",
    isDay: true
  } as WeatherData,
  provo: {
    city: "Provo, UT",
    temperature: 8,
    weatherType: "snow",
    dateTime: "Wed, Feb 26, 9:30 AM",
    isDay: true
  } as WeatherData,
  cincinnati: {
    city: "Cincinnati, OH",
    temperature: 12,
    weatherType: "clouds",
    dateTime: "Wed, Feb 26, 12:30 PM",
    isDay: true
  } as WeatherData,
  manhattan: {
    city: "Manhattan, KS",
    temperature: 24,
    weatherType: "clear",
    dateTime: "Wed, Feb 26, 10:30 AM",
    isDay: true
  } as WeatherData,
  stillwater: {
    city: "Stillwater, OK",
    temperature: 22,
    weatherType: "clouds",
    dateTime: "Wed, Feb 26, 10:30 AM",
    isDay: true
  } as WeatherData,
  fortworth: {
    city: "Fort Worth, TX",
    temperature: 28,
    weatherType: "clear",
    dateTime: "Wed, Feb 26, 10:30 AM",
    isDay: true
  } as WeatherData,
  orlando: {
    city: "Orlando, FL",
    temperature: 35,
    weatherType: "thunderstorm",
    dateTime: "Wed, Feb 26, 1:30 PM",
    isDay: true
  } as WeatherData,
  saltlake: {
    city: "Salt Lake City, UT",
    temperature: 6,
    weatherType: "snow",
    dateTime: "Wed, Feb 26, 8:30 AM",
    isDay: true
  } as WeatherData,
  tucson: {
    city: "Tucson, AZ",
    temperature: 29,
    weatherType: "clear",
    dateTime: "Wed, Feb 26, 8:30 AM",
    isDay: true
  } as WeatherData
}

// Basic Demo
export function BasicWeatherDemo() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <WeatherWidget 
        apiKey="602eb8e0d8f46c939889cdc2c5ad67ff" 
        width="16rem"
        className="shadow-md"
        fallbackLocation={{
          latitude: 40.7128,
          longitude: -74.0060 
        }} 
      />
    </Box>
  )
}

// Advanced Demo with Big 12 Controls
export function AdvancedWeatherDemo() {
  const [useMockData, setUseMockData] = React.useState(true)
  const [selectedWeather, setSelectedWeather] = React.useState<string>("lawrence")
  const [animated, setAnimated] = React.useState(true)
  
  // Custom fetch function that returns mock data
  const mockFetch = async (): Promise<WeatherData> => {    
    return mockWeatherData[selectedWeather as keyof typeof mockWeatherData]
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      p: 3,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 191, 255, 0.2)',
      borderRadius: 2,
      minHeight: '500px',
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 3,
      }}>
        <Typography 
          className="ft-font-brand"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#00bfff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mb: 3,
            textAlign: 'center',
          }}
        >
          BIG 12 WEATHER
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
              Use Mock Data
            </Typography>
            <Toggle 
              pressed={useMockData} 
              onPressedChange={setUseMockData}
              aria-label="Toggle mock data"
              className="bg-black/50 border border-cyan-500/30 hover:bg-cyan-500/10 data-[state=on]:bg-cyan-500/20"
            >
              <Thermometer className="w-4 h-4 text-cyan-400" />
            </Toggle>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
              Enable Animations
            </Typography>
            <Toggle 
              pressed={animated} 
              onPressedChange={setAnimated}
              aria-label="Toggle animations"
              className="bg-black/50 border border-cyan-500/30 hover:bg-cyan-500/10 data-[state=on]:bg-cyan-500/20"
            >
              <Lightbulb className="w-4 h-4 text-yellow-400" />
            </Toggle>
          </Box>
          
          {useMockData && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                mb: 2,
              }}>
                Big 12 Venues
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 1,
              }}>
                {Object.keys(mockWeatherData).map(weather => (
                  <NeonButton
                    key={weather}
                    variant={selectedWeather === weather ? "neon" : "ghost"}
                    size="sm"
                    glowColor="cyan"
                    intensity={selectedWeather === weather ? "high" : "low"}
                    onClick={() => setSelectedWeather(weather)}
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--ft-font-ui)',
                      textTransform: 'capitalize',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {weather.replace(/([A-Z])/g, ' $1').trim()}
                  </NeonButton>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <WeatherWidget
          apiKey="602eb8e0d8f46c939889cdc2c5ad67ff"  
          width="16rem"
          className="shadow-lg border border-cyan-500/20"
          onFetchWeather={useMockData ? mockFetch : undefined}
          animated={animated}
          fallbackLocation={{
            latitude: 40.7128,
            longitude: -74.0060
          }}
        />
      </motion.div>
      
      <Box sx={{ 
        textAlign: 'center', 
        maxWidth: '400px',
        mt: 2,
      }}>
        <Typography sx={{
          fontSize: '0.8rem',
          color: '#888888',
          lineHeight: 1.5,
        }}>
          Track weather conditions across all Big 12 venues for optimal game scheduling.
          Toggle options to see different conditions and animation settings.
        </Typography>
      </Box>
    </Box>
  )
}

// Complete Big 12 Weather Grid - All 16 Venues
export function Big12WeatherGrid() {
  const allVenues = Object.keys(mockWeatherData)
  
  return (
    <Box sx={{
      background: 'transparent',
      minHeight: '100vh',
      p: 3,
    }}>
      <Box sx={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 3,
          mb: 4,
        }}>
          {allVenues.map((venue, index) => {
            const mockFetch = async (): Promise<WeatherData> => 
              mockWeatherData[venue as keyof typeof mockWeatherData]
            
            return (
              <motion.div
                key={venue}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <Box sx={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 2,
                  p: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(0, 191, 255, 0.2)',
                    boxShadow: '0 0 20px rgba(0, 191, 255, 0.1)',
                  }
                }}>
                  <WeatherWidget 
                    width="100%"
                    className="shadow-sm"
                    onFetchWeather={mockFetch}
                    fallbackLocation={{
                      latitude: 40.7128,
                      longitude: -74.0060
                    }}
                  />
                </Box>
              </motion.div>
            )
          })}
        </Box>
        
        {/* Stats Footer */}
        <Box sx={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 2,
          p: 3,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 3,
          textAlign: 'center',
        }}>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#00bfff' }}>
              16
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888888', textTransform: 'uppercase' }}>
              Total Venues
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
              {allVenues.length}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888888', textTransform: 'uppercase' }}>
              Active Feeds
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#00ff88' }}>
              100%
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888888', textTransform: 'uppercase' }}>
              Coverage
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#ffaa00' }}>
              LIVE
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888888', textTransform: 'uppercase' }}>
              Status
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

// Multiple Venues Demo (Legacy)
export function MultiVenueWeatherDemo() {
  const venues = ['lawrence', 'tempe', 'boulder', 'houston']
  
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 2,
      p: 2,
    }}>
      {venues.map((venue, index) => {
        const mockFetch = async (): Promise<WeatherData> => 
          mockWeatherData[venue as keyof typeof mockWeatherData]
        
        return (
          <motion.div
            key={venue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <WeatherWidget 
              width="12rem"
              className="shadow-sm border border-white/10"
              onFetchWeather={mockFetch}
              fallbackLocation={{
                latitude: 40.7128,
                longitude: -74.0060
              }}
            />
          </motion.div>
        )
      })}
    </Box>
  )
}