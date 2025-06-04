'use client'

import Link from 'next/link'
// Image import removed as it's not currently used
import { motion } from 'framer-motion'
import { FlexTimeHero } from '../src/components/ui/FlexTimeHero'
import { FlexTimeShinyButton } from '../src/components/ui/FlexTimeShinyButton'

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="relative">
        <FlexTimeHero />
      </div>
      

      {/* Platform Features Section */}
      <section className="relative py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent ft-font-brand uppercase tracking-wide">
              PLATFORM CAPABILITIES
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg ft-font-ui leading-tight">Comprehensive scheduling solution for Big 12 Conference athletics</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                title: 'Big 12 Sports',
                description: 'Complete scheduling for all 12 sports across the Big 12 Conference',
                href: '/sports',
                features: ['12 Sports', 'Multi-season Scheduling', 'NCAA Tournament Ready']
              },
              {
                title: 'Big 12 Universities',
                description: 'Comprehensive profiles and analytics for all 16 member institutions',
                href: '/universities',
                features: ['16 Schools', 'Team Profiles', 'Performance-driven Data']
              },
              {
                title: 'Compass Analytics',
                description: 'Advanced performance metrics and predictive insights platform',
                href: '/analytics',
                features: ['Real-time Data', 'Predictive Models', 'Performance Tracking']
              },
              {
                title: 'HELiiX Intelligence',
                description: 'AI-powered optimization engine with machine learning capabilities',
                href: '/intelligence',
                features: ['AI Analysis', 'Machine Learning Algorithms', 'Predictive Insights']
              },
            ].map((feature, index) => (
              <Link key={feature.title} href={feature.href} className="h-full block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 backdrop-blur-xl border-2 border-[#00bfff] rounded-2xl p-4 h-48 flex flex-col transition-all duration-300 shadow-[0_0_20px_rgba(0,191,255,0.3)] hover:shadow-[0_0_30px_rgba(0,191,255,0.5)]"
                >
                  {/* Animated indicator dot */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2 animate-pulse bg-[color:var(--ft-neon)] shadow-[0_0_8px_var(--ft-neon)]" />
                      <h3 className="text-lg font-medium text-black dark:text-white" style={{ fontFamily: 'var(--ft-font-secondary)' }}>
                        {feature.title}
                      </h3>
                    </div>
                    
                    {/* Decorative line */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 + 0.1 * index }}
                      className="h-px w-10 bg-[color:var(--ft-neon)] opacity-40"
                      style={{ transformOrigin: 'right' }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow">
                    {feature.description}
                  </p>
                  
                  {feature.features.length > 0 && (
                    <div className="border-t border-white/5 pt-2 mt-auto">
                      <ul className="space-y-1">
                        {feature.features.map((feat, i) => (
                          <li key={i} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: 0.6 + 0.1 * index + 0.1 * i,
                                type: 'spring'
                              }}
                              className="w-1 h-1 rounded-full mr-2 bg-[color:var(--ft-neon)]"
                            />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* AI Intelligence Engine Preview section removed as requested */}

      {/* Big 12 Teams Showcase */}
      <section className="relative py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent ft-font-brand uppercase tracking-wide">
              BIG 12 CONFERENCE TEAMS
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg ft-font-ui leading-tight">
              Powerful scheduling for all 16 member institutions powered by FlexTime scheduling
            </p>
          </motion.div>
          
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {[
              { name: 'Arizona', logo: 'arizona' },
              { name: 'Arizona State', logo: 'arizona_state' },
              { name: 'Baylor', logo: 'baylor' },
              { name: 'BYU', logo: 'byu' },
              { name: 'Cincinnati', logo: 'cincinnati' },
              { name: 'Colorado', logo: 'colorado' },
              { name: 'Houston', logo: 'houston' },
              { name: 'Iowa State', logo: 'iowa_state' },
              { name: 'Kansas', logo: 'kansas' },
              { name: 'Kansas State', logo: 'kansas_state' },
              { name: 'Oklahoma State', logo: 'oklahoma_state' },
              { name: 'TCU', logo: 'tcu' },
              { name: 'Texas Tech', logo: 'texas_tech' },
              { name: 'UCF', logo: 'ucf' },
              { name: 'Utah', logo: 'utah' },
              { name: 'West Virginia', logo: 'west_virginia' }
            ].map((team, index) => (
              <motion.div
                key={team.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.03 * index + 0.5 }}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-[color:var(--ft-neon)]/30 transition-all duration-300 group cursor-pointer h-24 w-24"
              >
                <div className="w-8 h-8 mb-2 flex items-center justify-center">
                  {/* Light mode logo */}
                  <img 
                    src={`/logos/teams/light/${team.logo}-light.svg`}
                    alt={`${team.name} logo`}
                    className="w-full h-full object-contain dark:hidden"
                  />
                  {/* Dark mode logo */}
                  <img 
                    src={`/logos/teams/dark/${team.logo}-dark.svg`}
                    alt={`${team.name} logo`}
                    className="w-full h-full object-contain hidden dark:block"
                  />
                </div>
                <span className="text-xs font-medium text-black dark:text-white text-center leading-tight group-hover:text-gray-700 dark:group-hover:text-[color:var(--ft-neon)] transition-colors">
                  {team.name}
                </span>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-center mt-8"
          >
            {/* Button removed as requested */}
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-center backdrop-blur-xl bg-black/5 dark:bg-white/5 border border-gray-300/50 dark:border-white/10 rounded-2xl p-12 max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent uppercase tracking-wide ft-font-brand">
              EXPERIENCE THE FUTURE OF ATHLETIC SCHEDULING
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 max-w-3xl mx-auto leading-tight ft-font-ui">
              Join the revolution in sports scheduling with FlexTime's AI-powered platform, 
              designed specifically for the demands of Big 12 Conference athletics.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-slate-400">Lightning Fast</div>
                <div className="text-lg font-semibold text-[color:var(--ft-neon)]">2-Second Generation</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-slate-400">Precision Optimized</div>
                <div className="text-lg font-semibold text-[color:var(--ft-neon)]">95% Efficiency Rate</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-slate-400">Championship Ready</div>
                <div className="text-lg font-semibold text-[color:var(--ft-neon)]">12 Sports</div>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/dashboard">
                <FlexTimeShinyButton variant="neon" className="px-10 py-4 text-lg">
                  Launch Dashboard
                </FlexTimeShinyButton>
              </Link>
              <Link href="/sports">
                <FlexTimeShinyButton variant="secondary" className="px-10 py-4 text-lg">
                  Explore Sports
                </FlexTimeShinyButton>
              </Link>
            </motion.div>
            
            {/* Bottom divider line */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 1.1 }}
              className="mt-16 mx-auto w-96 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
            />
          </motion.div>
        </div>
        
        {/* System Status Indicator */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute bottom-8 left-8"
        >
          <div className="flex items-center space-x-3 text-black dark:text-[color:var(--ft-neon)] text-sm bg-white/70 dark:bg-black/50 backdrop-blur-sm border border-gray-300 dark:border-[color:var(--ft-neon)]/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-[color:var(--ft-neon)] rounded-full animate-pulse"></div>
            <span className="font-medium">FlexTime System: Online</span>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}