'use client'

import Link from 'next/link'
// Image import removed as it's not currently used
import { motion } from 'framer-motion'
import { FlexTimeHero } from '@/components/ui/FlexTimeHero'
import { FlexTimeShinyButton } from '@/components/ui/FlexTimeShinyButton'

export default function Home() {
  return (
    <div className="ft-app-container">
      <div className="relative">
        <FlexTimeHero />
      </div>
      

      {/* Platform Features Section */}
      <section className="relative py-16">
        <div className="ft-content-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="ft-section-header bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent uppercase tracking-wide">
              PLATFORM CAPABILITIES
            </h2>
            <p className="ft-section-subtitle">Comprehensive scheduling solution for Big 12 Conference athletics</p>
          </motion.div>

          <div className="ft-grid-4 mb-16">
            {[
              {
                title: 'Big 12 Sports',
                description: 'Complete scheduling for Big 12 Conference athletics',
                href: '/sports',
                features: ['12 Sports', 'Multi-season Scheduling', 'NCAA Tournament Ready']
              },
              {
                title: 'Big 12 Universities',
                description: 'Comprehensive profiles and analytics for all 16 member institutions',
                href: '/schools',
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
                  className="ft-card-unified ft-card-interactive px-6 pt-5 pb-4 h-48 flex flex-col transition-all duration-300 border-accent/50 shadow-accent/20 hover:shadow-accent/40"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2 animate-pulse bg-accent dark:bg-[color:var(--ft-neon)] shadow-[0_0_8px_var(--ft-neon)]" />
                      <h3 className="text-lg font-medium text-foreground ft-font-ui">
                        {feature.title}
                      </h3>
                    </div>
                    
                    {/* Decorative line */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 + 0.1 * index }}
                      className="h-px w-10 bg-accent dark:bg-[color:var(--ft-neon)] opacity-40"
                      style={{ transformOrigin: 'right' }}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-1 flex-grow">
                    {feature.description}
                  </p>
                  
                  {feature.features.length > 0 && (
                    <div className="border-t border-border/20 pt-0 -mt-1" data-component-name="Home">
                      <ul className="space-y-0.5" data-component-name="Home">
                        {feature.features.map((feat, i) => (
                          <li key={i} className="flex items-center text-xs text-muted-foreground">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: 0.6 + 0.1 * index + 0.1 * i,
                                type: 'spring'
                              }}
                              className="w-1 h-1 rounded-full mr-2 bg-accent dark:bg-[color:var(--ft-neon)]"
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
        <div className="ft-content-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="ft-section-header bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent uppercase tracking-wide">
              BIG 12 CONFERENCE TEAMS
            </h2>
            <p className="ft-section-subtitle">
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
                className="ft-card-unified ft-card-interactive p-3 h-24 w-24 flex flex-col items-center justify-center group cursor-pointer"
              >
                <div className="w-8 h-8 mb-2 flex items-center justify-center">
                  {/* Light mode logo */}
                  <img 
                    src={`/assets/logos/teams/light/${team.logo}-light.svg`}
                    alt={`${team.name} logo`}
                    className="w-full h-full object-contain dark:hidden"
                  />
                  {/* Dark mode logo */}
                  <img 
                    src={`/assets/logos/teams/dark/${team.logo}-dark.svg`}
                    alt={`${team.name} logo`}
                    className="w-full h-full object-contain hidden dark:block"
                  />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight group-hover:text-accent dark:group-hover:text-[color:var(--ft-neon)] transition-colors">
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
        <div className="ft-content-container">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="ft-card-unified text-center p-12 max-w-4xl mx-auto"
          >
            <h2 className="ft-section-header bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent uppercase tracking-wide">
              EXPERIENCE THE FUTURE OF ATHLETIC SCHEDULING
            </h2>
            <p className="ft-section-subtitle mx-auto">
              Join the revolution in sports scheduling with FlexTime's AI-powered platform, 
              designed specifically for the demands of Big 12 Conference athletics.
            </p>
            
            <div className="ft-grid-3 mb-10">
              <div className="ft-stat-card">
                <div className="ft-stat-label">Lightning Fast</div>
                <div className="ft-stat-value text-lg">2-Second Generation</div>
              </div>
              <div className="ft-stat-card">
                <div className="ft-stat-label">Precision Optimized</div>
                <div className="ft-stat-value text-lg">95% Efficiency Rate</div>
              </div>
              <div className="ft-stat-card">
                <div className="ft-stat-label">Championship Ready</div>
                <div className="ft-stat-value text-lg">12 Sports</div>
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
          <div className="ft-card-unified flex items-center space-x-3 text-foreground text-sm px-4 py-2">
            <div className="w-2 h-2 bg-accent dark:bg-[color:var(--ft-neon)] rounded-full animate-pulse"></div>
            <span className="font-medium ft-font-ui">FlexTime System: Online</span>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}