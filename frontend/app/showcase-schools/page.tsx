'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Users, Trophy, MapPin } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import SchoolsShowcase from '../components/SchoolsShowcase';

const ShowcaseSchoolsPage = () => {
  return (
    <div className="universities-page-container">
      {/* Hero Section */}
      <div className="relative z-10 text-center py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="universities-page-title universities-title-gradient mb-6">
            Schools Showcase
          </h1>
          <p className="universities-page-subtitle">
            Demo of our beautiful, modern schools page featuring all 16 Big 12 Conference universities
            with glassmorphic design, interactive elements, and 21st-century UI patterns.
          </p>
        </div>
      </div>

      {/* Demo Content */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid gap-8">
          
          {/* Schools Showcase Component */}
          <div>
            <h2 className="text-2xl font-bold mb-6 ft-font-brand">Schools Preview Component</h2>
            <SchoolsShowcase />
          </div>

          {/* Feature Highlights */}
          <div>
            <h2 className="text-2xl font-bold mb-6 ft-font-brand">Design Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <GlassCard className="p-6" hoverable>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                                  flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold ft-font-brand">Glassmorphic Cards</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Modern glass-effect cards with backdrop blur, subtle borders, and smooth animations
                  that adapt beautifully to both light and dark themes.
                </p>
              </GlassCard>

              <GlassCard className="p-6" hoverable>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 
                                  flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold ft-font-brand">Interactive Elements</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Hover effects, micro-animations, floating elements, and responsive interactions
                  that provide engaging user feedback.
                </p>
              </GlassCard>

              <GlassCard className="p-6" hoverable>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 
                                  flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold ft-font-brand">Advanced Search & Filter</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Real-time search, sorting by multiple criteria, and smart filtering options
                  for enhanced user experience.
                </p>
              </GlassCard>

              <GlassCard className="p-6" hoverable>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 
                                  flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold ft-font-brand">Responsive Design</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Fully responsive layout that works seamlessly across desktop, tablet, and mobile
                  devices with adaptive grid systems.
                </p>
              </GlassCard>

              <GlassCard className="p-6" hoverable>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 
                                  flex items-center justify-center">
                    <div className="w-5 h-5 rounded border-2 border-white" />
                  </div>
                  <h3 className="text-lg font-semibold ft-font-brand">Theme-Aware</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Intelligent dark/light mode support with smooth transitions and adaptive
                  color schemes for optimal viewing in any environment.
                </p>
              </GlassCard>

              <GlassCard className="p-6" hoverable>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 
                                  flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold ft-font-brand">Performance Optimized</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Optimized images, efficient animations, and smart loading states for
                  lightning-fast performance on all devices.
                </p>
              </GlassCard>

            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center py-12">
            <Link href="/schools">
              <button className="university-view-button inline-flex items-center justify-center 
                                gap-2 px-8 py-4 text-lg font-semibold">
                Experience the Full Schools Page
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShowcaseSchoolsPage;