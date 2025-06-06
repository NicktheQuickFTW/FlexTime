'use client'

import { getTeamLogo, getTeamName } from '../../src/utils/logoUtils'
import Image from 'next/image'

export default function UniversitiesIndexPage() {
  const schools = [
    { name: 'University of Arizona', id: 1, url: 'arizona', mascot: 'Wildcats', colors: ['#AB0520', '#0C234B'] },
    { name: 'Arizona State University', id: 2, url: 'arizona-state', mascot: 'Sun Devils', colors: ['#8C1D40', '#FFC627'] },
    { name: 'Baylor University', id: 3, url: 'baylor', mascot: 'Bears', colors: ['#154734', '#FFD100'] },
    { name: 'Brigham Young University', id: 4, url: 'byu', mascot: 'Cougars', colors: ['#002E5D', '#FFFFFF'] },
    { name: 'University of Central Florida', id: 5, url: 'ucf', mascot: 'Knights', colors: ['#BA9B37', '#000000'] },
    { name: 'University of Cincinnati', id: 6, url: 'cincinnati', mascot: 'Bearcats', colors: ['#E00122', '#000000'] },
    { name: 'University of Colorado Boulder', id: 7, url: 'colorado', mascot: 'Buffaloes', colors: ['#CFB87C', '#000000'] },
    { name: 'University of Houston', id: 8, url: 'houston', mascot: 'Cougars', colors: ['#C8102E', '#FFFFFF'] },
    { name: 'Iowa State University', id: 9, url: 'iowa-state', mascot: 'Cyclones', colors: ['#C8102E', '#F1BE48'] },
    { name: 'University of Kansas', id: 10, url: 'kansas', mascot: 'Jayhawks', colors: ['#0051BA', '#E8000D'] },
    { name: 'Kansas State University', id: 11, url: 'kansas-state', mascot: 'Wildcats', colors: ['#512888', '#FFFFFF'] },
    { name: 'Oklahoma State University', id: 12, url: 'oklahoma-state', mascot: 'Cowboys', colors: ['#FF7300', '#000000'] },
    { name: 'Texas Christian University', id: 13, url: 'tcu', mascot: 'Horned Frogs', colors: ['#4D1979', '#FFFFFF'] },
    { name: 'Texas Tech University', id: 14, url: 'texas-tech', mascot: 'Red Raiders', colors: ['#CC0000', '#000000'] },
    { name: 'University of Utah', id: 15, url: 'utah', mascot: 'Utes', colors: ['#CC0000', '#FFFFFF'] },
    { name: 'West Virginia University', id: 16, url: 'west-virginia', mascot: 'Mountaineers', colors: ['#EAAA00', '#002855'] }
  ]

  return (
    <div className="universities-page-container">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="universities-page-title">
            <span className="universities-title-gradient">
              Big 12 Universities
            </span>
          </h1>
          <p className="universities-page-subtitle">
            Explore all 16 member universities in the Big 12 Conference
          </p>
        </div>

        <div className="universities-grid">
          {schools.map((school) => {
            const logoSrc = getTeamLogo(school.id, 'dark')
            return (
              <a 
                key={school.id} 
                href={`/universities/${school.url}`}
                className="university-card"
              >
                <div className="university-card-header">
                  <div className="university-logo">
                    {logoSrc ? (
                      <Image
                        src={logoSrc}
                        alt={`${school.name} logo`}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    ) : (
                      <div 
                        className="university-logo-fallback"
                        style={{ backgroundColor: school.colors[0] }}
                      >
                        {school.name.split(' ')[0][0]}{school.name.split(' ')[school.name.split(' ').length - 1][0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="university-name">
                      {school.name.replace('University of ', '').replace(' University', '')}
                    </h3>
                    <p className="university-id">School ID: {school.id}</p>
                  </div>
                </div>
                <p className="university-mascot">
                  {school.mascot}
                </p>
                <div className="university-card-arrow">
                  →
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}