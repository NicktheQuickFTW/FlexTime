'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Users, MapPin, Trophy, ArrowRight } from 'lucide-react';
import GlassCard from './GlassCard';

const SchoolsShowcase = () => {
  const showcaseStats = {
    totalUniversities: 16,
    totalStudents: '635K+',
    avgEnrollment: '40K',
    conferences: 1
  };

  const featuredSchools = [
    {
      name: 'University of Texas',
      mascot: 'Longhorns',
      colors: { primary: '#BF5700', secondary: '#FFFFFF' },
      enrollment: '51K',
      founded: 1883
    },
    {
      name: 'University of Oklahoma', 
      mascot: 'Sooners',
      colors: { primary: '#841617', secondary: '#FDD116' },
      enrollment: '32K',
      founded: 1890
    },
    {
      name: 'Texas Tech University',
      mascot: 'Red Raiders', 
      colors: { primary: '#CC0000', secondary: '#000000' },
      enrollment: '40K',
      founded: 1923
    }
  ];

  return (
    <div className="relative">
      {/* Main Schools Showcase Card */}
      <GlassCard className="p-8" hoverable>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                            flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold ft-font-brand">Big 12 Schools</h3>
              <p className="text-muted-foreground ft-font-ui">
                Explore prestigious universities across the conference
              </p>
            </div>
          </div>
          <Link 
            href="/schools"
            className="flex items-center gap-2 text-accent hover:text-accent/80 
                       transition-colors duration-200 ft-font-ui font-medium"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 rounded-lg bg-muted/20 backdrop-blur-sm border border-border/30">
            <div className="text-2xl font-bold text-foreground ft-font-mono">
              {showcaseStats.totalUniversities}
            </div>
            <div className="text-sm text-muted-foreground ft-font-ui">Universities</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/20 backdrop-blur-sm border border-border/30">
            <div className="text-2xl font-bold text-foreground ft-font-mono">
              {showcaseStats.totalStudents}
            </div>
            <div className="text-sm text-muted-foreground ft-font-ui">Students</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/20 backdrop-blur-sm border border-border/30">
            <div className="text-2xl font-bold text-foreground ft-font-mono">
              {showcaseStats.avgEnrollment}
            </div>
            <div className="text-sm text-muted-foreground ft-font-ui">Avg Size</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/20 backdrop-blur-sm border border-border/30">
            <div className="text-2xl font-bold text-foreground ft-font-mono">
              {showcaseStats.conferences}
            </div>
            <div className="text-sm text-muted-foreground ft-font-ui">Conference</div>
          </div>
        </div>

        {/* Featured Schools Preview */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold ft-font-brand mb-4">Featured Universities</h4>
          <div className="grid gap-3">
            {featuredSchools.map((school, index) => (
              <div 
                key={school.name}
                className="flex items-center justify-between p-4 rounded-lg 
                          bg-muted/10 border border-border/20 backdrop-blur-sm
                          hover:bg-muted/20 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: school.colors.primary }}
                  >
                    {school.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium text-foreground ft-font-ui">{school.name}</div>
                    <div className="text-sm text-muted-foreground">{school.mascot}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{school.enrollment}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Est. {school.founded}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 pt-6 border-t border-border/20">
          <Link href="/schools">
            <button className="w-full py-3 px-6 rounded-xl font-semibold
                              bg-gradient-to-r from-blue-600 to-purple-600
                              text-white border border-white/20
                              backdrop-blur-sm
                              hover:from-blue-500 hover:to-purple-500
                              hover:shadow-lg hover:shadow-blue-500/25
                              transform hover:scale-105
                              transition-all duration-300
                              ft-font-secondary"
                     style={{ letterSpacing: '0.05em' }}
            >
              <span className="flex items-center justify-center gap-2">
                Explore All Big 12 Universities
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default SchoolsShowcase;