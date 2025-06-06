'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getBig12UniversityData } from '../../src/data/big12-schools'
import { FlexTimeShinyButton } from '../../src/components/ui/FlexTimeShinyButton'

// Types for API data
interface School {
  school_id: number;
  school: string;
  short_display: string;
  primary_color: string;
  secondary_color: string;
  mascot: string;
  location: string;
  website: string;
  founded_year: number;
  enrollment: number;
  conference: string;
  division: string;
  city: string;
  state: string;
}

interface SchoolsResponse {
  success: boolean;
  schools: School[];
  count: number;
}

// API client function
const fetchSchoolsFromAPI = async (): Promise<School[]> => {
  try {
    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('/api/scheduling-service/schools', {
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) throw new Error('Failed to fetch schools');
    
    const data: SchoolsResponse = await response.json();
    return data.schools || [];
  } catch (error) {
    console.error('Error fetching schools from API:', error);
    return [];
  }
};


// Convert school API data to school display format
const convertSchoolToSchool = (school: School) => {
  const sportsMapping: { [key: string]: string[] } = {
    'Arizona': ['Football', 'Basketball', 'Baseball'],
    'Arizona State': ['Football', 'Basketball', 'Baseball'],
    'Baylor': ['Football', 'Basketball', 'Baseball'],
    'BYU': ['Football', 'Basketball', 'Baseball'],
    'UCF': ['Football', 'Basketball', 'Baseball'],
    'Cincinnati': ['Football', 'Basketball', 'Soccer'],
    'Colorado': ['Football', 'Basketball', 'Soccer'],
    'Houston': ['Football', 'Basketball', 'Baseball'],
    'Iowa State': ['Football', 'Basketball', 'Wrestling'],
    'Kansas': ['Football', 'Basketball', 'Baseball'],
    'Kansas State': ['Football', 'Basketball', 'Baseball'],
    'Oklahoma State': ['Football', 'Basketball', 'Wrestling'],
    'TCU': ['Football', 'Basketball', 'Baseball'],
    'Texas Tech': ['Football', 'Basketball', 'Baseball'],
    'Utah': ['Football', 'Basketball', 'Gymnastics'],
    'West Virginia': ['Football', 'Basketball', 'Wrestling']
  };

  const getSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const getLogoSlug = (name: string) => {
    // Mapping for logos (which use hyphens for some and underscores for others)
    const mapping: { [key: string]: string } = {
      'Arizona': 'arizona',
      'Arizona State': 'arizona_state',
      'Baylor': 'baylor',
      'BYU': 'byu',
      'UCF': 'ucf',
      'Cincinnati': 'cincinnati',
      'Colorado': 'colorado',
      'Houston': 'houston',
      'Iowa State': 'iowa_state',
      'Kansas': 'kansas',
      'Kansas State': 'kansas_state',
      'Oklahoma State': 'oklahoma_state',
      'TCU': 'tcu',
      'Texas Tech': 'texas_tech',
      'Utah': 'utah',
      'West Virginia': 'west_virginia'
    };
    return mapping[name] || getSlug(name);
  };


  return {
    id: school.school_id.toString(),
    name: school.school,
    shortName: school.short_display,
    nickname: school.mascot,
    location: school.location,
    founded: school.founded_year,
    primaryColor: school.primary_color,
    secondaryColor: school.secondary_color,
    slug: getSlug(school.school),
    logoSlug: getLogoSlug(school.school),
    totalSports: 16,
    recentChampions: 3,
    notableSports: sportsMapping[school.school] || ['Football', 'Basketball', 'Baseball']
  };
};

/**
 * Big 12 Sports Command Center Page
 * 
 * 21st-dev Magic AI inspired design showcasing all 16 Big 12 universities
 * with glassmorphic cards and school-specific branding
 */
export default function SportsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to determine logo source based on school name
  const getLogoSrc = (school: any) => {
    // Use dark logos for Cincinnati and Baylor, light logos for everyone else
    if (school.name === 'Cincinnati' || school.name === 'Baylor') {
      return `/logos/teams/dark/${school.logoSlug}-dark.svg`;
    }
    return `/logos/teams/light/${school.logoSlug}-light.svg`;
  };

  useEffect(() => {
    // Start with static data immediately to ensure page always loads
    setSchools(getBig12UniversityData());
    setLoading(false);
    
    // Then try to fetch from API in the background
    const loadSchools = async () => {
      try {
        const schoolsData = await fetchSchoolsFromAPI();
        
        if (schoolsData.length > 0) {
          // Use API data - convert to school format
          const convertedSchools = schoolsData.map(convertSchoolToSchool);
          setSchools(convertedSchools);
        }
      } catch (err) {
        console.error('Error loading schools:', err);
        // We already have the fallback data loaded
      }
    };

    // Don't wait for the API - try to load in background
    loadSchools();
  }, []);

  if (loading) {
    return (
      <div className="sports-page-container">
        <div className="sports-page-header">
          <h1 className="sports-page-title ft-font-brand bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent">
            BIG 12 CONFERENCE
          </h1>
          <p className="sports-page-subtitle">Loading school data...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sports-page-container">
      {/* Header Section */}
      <div className="sports-page-header">
        <h1 className="sports-page-title ft-font-brand bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent">
          A DIFFERENT LEAGUE
        </h1>
        <p className="sports-page-subtitle text-sm tracking-tight text-slate-400 font-secondary max-w-3xl mx-auto leading-relaxed">
          Discover the powerhouse schools driving collegiate athletics excellence.
          Choose your school to explore teams, stats, and championship legacy.
        </p>
      </div>

      {/* School Cards Grid */}
      <div className="universities-grid">
        {schools.map((school) => (
          <Link href={`/schools/${school.slug}`} className="university-card" key={school.id}>
            <div className="university-card-header">
              <div className="university-logo" style={{ backgroundColor: school.primaryColor + '20' }}>
                <img 
                  src={getLogoSrc(school)} 
                  alt={`${school.name} logo`} 
                  className="w-12 h-12 object-contain mx-auto"
                  data-component-name="SportsPage"
                  onError={(e) => {
                    // Fallback to primary logo if specific logo fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = `/logos/teams/${school.logoSlug}.svg`;
                    target.onerror = () => {
                      // Final fallback to initials if both logos fail
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    };
                  }}
                />
                <span 
                  className="text-2xl font-bold text-white hidden"
                  style={{ display: 'none' }}
                >
                  {school.name.charAt(0)}
                </span>
              </div>
              <h3 className="university-name" data-component-name="SportsPage">
                {school.shortName ? school.shortName.toUpperCase() : school.name.toUpperCase()}
              </h3>
              <p className="university-nickname">{school.nickname}</p>
            </div>

            {/* Card Body */}
            <div className="university-card-body">
              {/* Stats */}
              <div className="university-stats">
                <div className="university-stat">
                  <div className="university-stat-value">{school.totalSports}</div>
                  <div className="university-stat-label">Sports</div>
                </div>
                <div className="university-stat">
                  <div className="university-stat-value">{school.recentChampions}</div>
                  <div className="university-stat-label">Championships</div>
                </div>
              </div>

              {/* Location & Founded */}
              <div className="text-center mb-4 mt-4">
                <p className="text-sm text-slate-400 mb-1">{school.location}</p>
                <p className="text-xs text-slate-500">Founded {school.founded}</p>
              </div>

              {/* Weather Widget */}
              <div className="university-weather">
                <div className="weather-widget">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-blue-400">☀️</span>
                    <span className="text-slate-300">72°F</span>
                    <span className="text-slate-400">Sunny</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="university-card-footer">
              <FlexTimeShinyButton 
                variant="neon" 
                className="university-view-button"
              >
                EXPLORE TEAMS
              </FlexTimeShinyButton>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}