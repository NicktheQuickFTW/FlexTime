import React from 'react'
import { notFound } from 'next/navigation'

// Import client components
import { UniversityHero, TeamsSection } from './components'

// Import the comprehensive university data
import { getBig12UniversityBySlug } from '../../../src/data/big12-schools'

interface PageProps {
  params: { schoolName: string }
}

export default function SchoolPage({ params }: PageProps) {
  const { schoolName } = params
  const school = getBig12UniversityBySlug(schoolName)
  
  // If school not found, show 404
  if (!school) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      {/* School Hero Section with header, stats, location */}
      <UniversityHero university={school} />
      
      {/* Teams Section with filtering and team cards */}
      <TeamsSection university={school} />
    </div>
  )
}

// Generate static paths for all schools
export async function generateStaticParams() {
  // All 16 Big 12 schools
  const schoolSlugs = [
    'arizona', 'arizona-state', 'baylor', 'byu',
    'ucf', 'cincinnati', 'colorado', 'houston', 
    'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state',
    'tcu', 'texas-tech', 'utah', 'west-virginia'
  ]
  
  return schoolSlugs.map((schoolName) => ({
    schoolName,
  }))
}