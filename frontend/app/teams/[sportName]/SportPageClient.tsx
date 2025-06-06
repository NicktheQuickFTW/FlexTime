'use client'

import React from 'react'
import ComprehensiveSportPage from '../../../src/pages/sports/ComprehensiveSportPage'

interface SportPageClientProps {
  sportId: number
}

// Sport ID to name mapping
const SPORT_ID_TO_NAME: { [key: number]: string } = {
  1: 'baseball',
  2: 'mens-basketball',
  3: 'womens-basketball',
  8: 'football',
  11: 'gymnastics',
  12: 'lacrosse',
  14: 'soccer',
  15: 'softball',
  18: 'mens-tennis',
  19: 'womens-tennis',
  24: 'volleyball',
  25: 'wrestling'
}

export default function SportPageClient({ sportId }: SportPageClientProps) {
  const sportName = SPORT_ID_TO_NAME[sportId] || 'football'
  
  return (
    <ComprehensiveSportPage 
      sportId={sportId} 
      sportName={sportName}
    />
  )
}