import { notFound } from 'next/navigation'
import SchoolPageClient from './SchoolPageClient'
import { SCHOOL_DATA } from '../../../src/pages/universities/UniversityPage'

interface UniversityPageProps {
  params: {
    schoolName: string
  }
}

// Map school names to school IDs based on our database mappings
const SCHOOL_NAME_TO_ID: { [key: string]: number } = {
  'arizona': 1,         // University of Arizona
  'arizona-state': 2,   // Arizona State University  
  'baylor': 3,          // Baylor University
  'byu': 4,             // Brigham Young University
  'ucf': 5,             // University of Central Florida
  'cincinnati': 6,      // University of Cincinnati
  'colorado': 7,        // University of Colorado Boulder
  'houston': 8,         // University of Houston
  'iowa-state': 9,      // Iowa State University
  'kansas': 10,         // University of Kansas
  'kansas-state': 11,   // Kansas State University
  'oklahoma-state': 12, // Oklahoma State University
  'tcu': 13,            // Texas Christian University
  'texas-tech': 14,     // Texas Tech University
  'utah': 15,           // University of Utah
  'west-virginia': 16   // West Virginia University
}

export default function DynamicUniversityPage({ params }: UniversityPageProps) {
  const { schoolName } = params
  const schoolId = SCHOOL_NAME_TO_ID[schoolName]
  
  if (!schoolId || !SCHOOL_DATA[schoolId]) {
    notFound()
  }
  
  return <SchoolPageClient schoolId={schoolId} />
}

// Generate static paths for all schools
export async function generateStaticParams() {
  return Object.keys(SCHOOL_NAME_TO_ID).map((schoolName) => ({
    schoolName,
  }))
}