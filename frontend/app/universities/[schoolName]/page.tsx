import React from 'react'
import { notFound } from 'next/navigation'

// Import client components
import { UniversityHero, TeamsSection } from './components'

// Import the comprehensive university data
import { getBig12UniversityBySlug } from '../../../src/data/big12-universities-complete'

interface PageProps {
  params: { schoolName: string }
}

export default function UniversityPage({ params }: PageProps) {
  const { schoolName } = params
  const university = getBig12UniversityBySlug(schoolName)
  
  // If university not found, show 404
  if (!university) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      {/* University Hero Section with header, stats, location */}
      <UniversityHero university={university} />
      
      {/* Teams Section with filtering and team cards */}
      <TeamsSection university={university} />
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