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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Big 12 Universities
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            Explore all 16 member universities in the Big 12 Conference
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {schools.map((school) => {
            const logoSrc = getTeamLogo(school.id, 'dark')
            return (
              <a 
                key={school.id} 
                href={`/universities/${school.url}`}
                className="backdrop-blur-xl bg-white/5 border border-slate-800 hover:border-cyan-500/30 rounded-lg p-6 h-full transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 mr-3 flex items-center justify-center relative">
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
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: school.colors[0] }}
                      >
                        {school.name.split(' ')[0][0]}{school.name.split(' ')[school.name.split(' ').length - 1][0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {school.name.replace('University of ', '').replace(' University', '')}
                    </h3>
                    <p className="text-sm text-slate-400">School ID: {school.id}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors mb-2">
                  {school.mascot}
                </p>
                <div className="mt-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300">
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