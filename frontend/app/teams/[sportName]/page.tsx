import React from 'react'
import { notFound } from 'next/navigation'
import SportPageClient from './SportPageClient'

interface SportPageProps {
  params: {
    sportName: string
  }
}

// Map sport names to sport IDs
const SPORT_URL_TO_ID: { [key: string]: number } = {
  'baseball': 1,
  'mens-basketball': 2,
  'womens-basketball': 3,
  'football': 8,
  'gymnastics': 11,
  'lacrosse': 12,
  'soccer': 14,
  'softball': 15,
  'mens-tennis': 18,
  'womens-tennis': 19,
  'volleyball': 24,
  'wrestling': 25
}

export default function DynamicSportPage({ params }: SportPageProps) {
  const { sportName } = params
  const sportId = SPORT_URL_TO_ID[sportName]
  
  if (!sportId) {
    notFound()
  }
  
  return <SportPageClient sportId={sportId} />
}

// Generate static paths for all sports
export async function generateStaticParams() {
  return Object.keys(SPORT_URL_TO_ID).map((sportName) => ({
    sportName,
  }))
}