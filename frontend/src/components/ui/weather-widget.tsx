'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface WeatherData {
  city: string
  temperature: number
  weatherType: "clear" | "rain" | "snow" | "clouds" | "thunderstorm" | "mist"
  dateTime: string
  isDay: boolean
}

interface WeatherWidgetProps {
  apiKey?: string
  width?: string
  className?: string
  animated?: boolean
  fallbackLocation?: {
    latitude: number
    longitude: number
  }
  onFetchWeather?: () => Promise<WeatherData>
}

const weatherIcons = {
  clear: {
    day: "☀️",
    night: "🌙"
  },
  rain: {
    day: "🌧️",
    night: "🌧️"
  },
  snow: {
    day: "❄️",
    night: "❄️"
  },
  clouds: {
    day: "☁️",
    night: "☁️"
  },
  thunderstorm: {
    day: "⛈️",
    night: "⛈️"
  },
  mist: {
    day: "🌫️",
    night: "🌫️"
  }
}

const getWeatherGradient = (weatherType: string, isDay: boolean) => {
  if (!isDay) {
    return "from-slate-800 via-slate-700 to-slate-600"
  }
  
  switch (weatherType) {
    case "clear":
      return "from-blue-400 via-cyan-300 to-yellow-200"
    case "rain":
      return "from-gray-600 via-gray-500 to-blue-400"
    case "snow":
      return "from-blue-200 via-white to-gray-100"
    case "clouds":
      return "from-gray-400 via-gray-300 to-blue-200"
    case "thunderstorm":
      return "from-gray-800 via-purple-600 to-gray-700"
    case "mist":
      return "from-gray-300 via-blue-100 to-white"
    default:
      return "from-blue-400 via-cyan-300 to-yellow-200"
  }
}

export function WeatherWidget({
  apiKey,
  width = "16rem",
  className,
  animated = true,
  fallbackLocation,
  onFetchWeather
}: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = React.useState<WeatherData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (onFetchWeather) {
          const data = await onFetchWeather()
          setWeatherData(data)
        } else {
          // Mock data for demo
          const mockData: WeatherData = {
            city: "FlexTime Arena",
            temperature: 22,
            weatherType: "clear",
            dateTime: new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }),
            isDay: new Date().getHours() >= 6 && new Date().getHours() < 18
          }
          setWeatherData(mockData)
        }
      } catch (err) {
        setError("Failed to fetch weather data")
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [onFetchWeather])

  if (loading) {
    return (
      <div 
        className={cn(
          "rounded-2xl p-6 bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-lg",
          className
        )}
        style={{ width }}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-white/30 rounded mb-2"></div>
          <div className="h-8 bg-white/30 rounded mb-4"></div>
          <div className="h-12 bg-white/30 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !weatherData) {
    return (
      <div 
        className={cn(
          "rounded-2xl p-6 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg",
          className
        )}
        style={{ width }}
      >
        <div className="text-center">
          <p className="text-sm">Weather unavailable</p>
          <p className="text-xs opacity-75">{error}</p>
        </div>
      </div>
    )
  }

  const gradient = getWeatherGradient(weatherData.weatherType, weatherData.isDay)
  const icon = weatherIcons[weatherData.weatherType]?.[weatherData.isDay ? 'day' : 'night'] || "🌤️"

  return (
    <motion.div
      className={cn(
        `rounded-2xl p-6 bg-gradient-to-br ${gradient} text-white shadow-lg backdrop-blur-sm border border-white/20`,
        className
      )}
      style={{ width }}
      initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{weatherData.city}</h3>
            <p className="text-xs opacity-75">{weatherData.dateTime}</p>
          </div>
          <motion.div
            className="text-3xl"
            animate={animated ? { rotate: [0, 10, -10, 0] } : undefined}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            {icon}
          </motion.div>
        </div>

        {/* Temperature */}
        <div className="flex items-baseline gap-1">
          <motion.span
            className="text-4xl font-bold"
            initial={animated ? { scale: 0 } : undefined}
            animate={animated ? { scale: 1 } : undefined}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {weatherData.temperature}
          </motion.span>
          <span className="text-lg opacity-75">°C</span>
        </div>

        {/* Weather Description */}
        <motion.div
          className="capitalize text-sm font-medium"
          initial={animated ? { opacity: 0, y: 10 } : undefined}
          animate={animated ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.4 }}
        >
          {weatherData.weatherType === "clear" && weatherData.isDay && "Sunny"}
          {weatherData.weatherType === "clear" && !weatherData.isDay && "Clear Night"}
          {weatherData.weatherType === "rain" && "Rainy"}
          {weatherData.weatherType === "snow" && "Snowy"}
          {weatherData.weatherType === "clouds" && "Cloudy"}
          {weatherData.weatherType === "thunderstorm" && "Thunderstorm"}
          {weatherData.weatherType === "mist" && "Misty"}
        </motion.div>

        {/* Animated Weather Effects */}
        <AnimatePresence>
          {animated && weatherData.weatherType === "rain" && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-4 bg-blue-200/60"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: -20,
                  }}
                  animate={{
                    y: [0, 150],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          )}
          
          {animated && weatherData.weatherType === "snow" && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: -10,
                  }}
                  animate={{
                    y: [0, 200],
                    x: [0, Math.random() * 20 - 10],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}