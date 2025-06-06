'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FlexTimeShinyButton } from '../../src/components/ui/FlexTimeShinyButton'
import FTIcon from '../../src/components/ui/FTIcon'

// Big 12 Sports Data
const big12Sports = [
  {
    id: 'baseball',
    name: 'Baseball',
    season: 'Spring',
    teams: 14,
    icon: 'baseball',
    primaryColor: '#50C878',
    description: 'Premier college baseball with College World Series contenders.',
    features: ['14 Teams', 'College World Series', 'Big 12 Tournament'],
    slug: 'baseball'
  },
  {
    id: 'football',
    name: 'Football',
    season: 'Fall',
    teams: 16,
    icon: 'football',
    primaryColor: '#FF6B35',
    description: 'The crown jewel of Big 12 athletics with championship-caliber competition.',
    features: ['16 Teams', 'College Football Playoff', 'Championship Game'],
    slug: 'football'
  },
  {
    id: 'gymnastics',
    name: 'Gymnastics',
    season: 'Winter',
    teams: 7,
    icon: 'gymnastics',
    primaryColor: '#DA70D6',
    description: 'Elite gymnastics featuring NCAA Championship contenders.',
    features: ['7 Teams', 'NCAA Championship', 'Big 12 Championship'],
    slug: 'gymnastics'
  },
  {
    id: 'lacrosse',
    name: 'Lacrosse',
    season: 'Spring',
    teams: 10,
    icon: 'lacrosse',
    primaryColor: '#9370DB', // Medium purple
    description: 'Fast-paced lacrosse competition showcasing elite collegiate talent.',
    features: ['10 Teams', 'NCAA Championship', 'Conference Tournament'],
    slug: 'lacrosse'
  },
  {
    id: 'mens-basketball',
    name: "Men's Basketball",
    season: 'Winter',
    teams: 16,
    icon: 'basketball',
    primaryColor: '#4A90E2',
    description: 'Elite basketball featuring March Madness contenders and NBA prospects.',
    features: ['16 Teams', 'March Madness', 'Big 12 Tournament'],
    slug: 'mens-basketball'
  },
  {
    id: 'mens-tennis',
    name: "Men's Tennis",
    season: 'Spring',
    teams: 9,
    icon: 'tennis',
    primaryColor: '#1E90FF',
    description: 'Competitive tennis programs with NCAA Tournament participants.',
    features: ['9 Teams', 'NCAA Tournament', 'Big 12 Championship'],
    slug: 'mens-tennis'
  },
  {
    id: 'soccer',
    name: 'Soccer',
    season: 'Fall',
    teams: 16,
    icon: 'soccer',
    primaryColor: '#32CD32',
    description: 'Dynamic soccer programs competing at the highest collegiate level.',
    features: ['16 Teams', 'NCAA Tournament', 'Big 12 Championship'],
    slug: 'soccer'
  },
  {
    id: 'softball',
    name: 'Softball',
    season: 'Spring',
    teams: 11,
    icon: 'softball',
    primaryColor: '#FFD700',
    description: 'Top-tier softball competition with Women\'s College World Series participants.',
    features: ['11 Teams', 'WCWS', 'Championship'],
    slug: 'softball'
  },
  {
    id: 'track-field',
    name: 'Track & Field',
    season: 'Spring',
    teams: 16,
    icon: 'running',
    primaryColor: '#FF4500',
    description: 'World-class track and field programs producing Olympic athletes.',
    features: ['16 Teams', 'NCAA Championship', 'Olympic Athletes'],
    slug: 'track-field'
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    season: 'Fall',
    teams: 15,
    icon: 'volleyball',
    primaryColor: '#FF69B4',
    description: 'Elite volleyball with NCAA Championship contenders.',
    features: ['15 Teams', 'NCAA Tournament', 'Big 12 Championship'],
    slug: 'volleyball'
  },
  {
    id: 'womens-basketball',
    name: "Women's Basketball",
    season: 'Winter',
    teams: 16,
    icon: 'basketball',
    primaryColor: '#E24A90',
    description: 'Competitive women\'s basketball with NCAA Tournament representation.',
    features: ['16 Teams', 'NCAA Tournament', 'Big 12 Championship'],
    slug: 'womens-basketball'
  },
  {
    id: 'womens-tennis',
    name: "Women's Tennis",
    season: 'Spring',
    teams: 16,
    icon: 'tennis',
    primaryColor: '#FF1493',
    description: 'Elite women\'s tennis with NCAA Championship representation.',
    features: ['16 Teams', 'NCAA Tournament', 'Big 12 Championship'],
    slug: 'womens-tennis'
  },
  {
    id: 'wrestling',
    name: 'Wrestling',
    season: 'Winter',
    teams: 14,
    icon: 'wrestling',
    primaryColor: '#8B4513',
    description: 'Powerhouse wrestling programs producing Olympic and World champions.',
    features: ['14 Teams', 'NCAA Championship', 'Individual Titles'],
    slug: 'wrestling'
  }
]

/**
 * Big 12 Sports Command Center Page
 * 
 * 21st-dev Magic AI inspired design showcasing all Big 12 sports
 * with glassmorphic cards and sport-specific branding
 */
export default function SportsPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>('All')
  
  const seasons = ['All', 'Fall', 'Winter', 'Spring']
  
  const filteredSports = selectedSeason === 'All' 
    ? big12Sports 
    : big12Sports.filter(sport => sport.season === selectedSeason)

  return (
    <div className="sports-page-container">
      {/* Header Section */}
      <div className="sports-page-header">
        <h1 className="sports-page-title ft-font-brand bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent">
          BIG 12 SPORTS
        </h1>
        <p className="sports-page-subtitle">
          Explore the diverse athletic excellence across all Big 12 Conference sports.
          From championship football to elite Olympic sports.
        </p>
      </div>

      {/* Season Filter */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-muted/20 backdrop-blur-sm rounded-xl p-1 border border-border/20">
          {seasons.map((season) => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedSeason === season
                  ? 'bg-accent/20 text-accent shadow-lg shadow-accent/25 dark:bg-cyan-500/20 dark:text-cyan-400 dark:shadow-cyan-500/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {season}
            </button>
          ))}
        </div>
      </div>

      {/* Sports Cards Grid */}
      <div className="sports-grid">
        {filteredSports.map((sport) => (
          <Link href={`/sports/${sport.slug}`} className="sport-card" key={sport.id}>
            <div className="sport-card-header">
              <div 
                className="sport-icon" 
                style={{ backgroundColor: sport.primaryColor + '20' }}
              >
                <FTIcon 
                  name={sport.icon} 
                  className="text-3xl text-white" 
                  style={{ color: sport.primaryColor }}
                />
              </div>
              <h3 className="sport-name" style={{ color: sport.primaryColor }}>
                {sport.name}
              </h3>
              <p className="sport-season">{sport.season} Season</p>
            </div>

            {/* Card Body */}
            <div className="sport-card-body">
              <p className="sport-description">
                {sport.description}
              </p>

              {/* Stats */}
              <div className="sport-stats">
                <div className="sport-stat">
                  <div className="sport-stat-value">{sport.teams}</div>
                  <div className="sport-stat-label">Teams</div>
                </div>
                <div className="sport-stat">
                  <div className="sport-stat-value">{sport.season}</div>
                  <div className="sport-stat-label">Season</div>
                </div>
              </div>

              {/* Features */}
              <div className="sport-features">
                {sport.features.map((feature, index) => (
                  <span key={index} className="sport-feature-tag">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Footer */}
            <div className="sport-card-footer">
              <FlexTimeShinyButton 
                variant="neon" 
                className="sport-view-button"
                style={{ '--button-glow-color': sport.primaryColor } as any}
              >
                EXPLORE SPORT
              </FlexTimeShinyButton>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}