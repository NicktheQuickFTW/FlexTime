'use client';

import React, { useState, useMemo } from 'react';
import { Search, MapPin, Users, Calendar, Trophy, ArrowRight, Filter, SortDesc } from 'lucide-react';
import Image from 'next/image';
import GlassCard from '../components/GlassCard';
import { getBig12SchoolData, School as Big12School } from '../../data/big12-schools';

const SchoolsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'enrollment' | 'founded'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'large' | 'medium' | 'small'>('all');

  // Enhanced school data with additional info
  const enhancedSchools = useMemo(() => {
    return getBig12SchoolData().map(school => ({
      ...school,
      sizeCategory: parseInt(school.enrollment.replace(/,/g, '')) > 50000 ? 'large' : 
                   parseInt(school.enrollment.replace(/,/g, '')) > 30000 ? 'medium' : 'small',
      logoPath: `/LOGOS/teams/${school.slug.replace('kansas-state', 'kansas_state')
                                   .replace('arizona-state', 'arizona_state')
                                   .replace('iowa-state', 'iowa_state')
                                   .replace('west-virginia', 'west_virginia')
                                   .replace('texas-tech', 'texas_tech')
                                   .replace('oklahoma-state', 'oklahoma_state')}.svg`,
      spotlightSports: getSpotlightSports(school.slug),
      establishedYears: new Date().getFullYear() - school.founded
    }));
  }, []);

  function getSpotlightSports(schoolSlug: string): string[] {
    const sportsBySchool: Record<string, string[]> = {
      'arizona': ['Football', 'Basketball', 'Baseball', 'Gymnastics'],
      'arizona-state': ['Football', 'Basketball', 'Baseball', 'Wrestling'],
      'baylor': ['Football', 'Basketball', 'Baseball', 'Equestrian'],
      'byu': ['Football', 'Basketball', 'Soccer', 'Swimming'],
      'cincinnati': ['Football', 'Basketball', 'Soccer', 'Swimming'],
      'colorado': ['Football', 'Basketball', 'Soccer', 'Lacrosse'],
      'houston': ['Football', 'Basketball', 'Baseball', 'Track & Field'],
      'iowa-state': ['Football', 'Basketball', 'Wrestling', 'Gymnastics'],
      'kansas': ['Football', 'Basketball', 'Baseball', 'Track & Field'],
      'kansas-state': ['Football', 'Basketball', 'Baseball', 'Track & Field'],
      'oklahoma-state': ['Football', 'Basketball', 'Wrestling', 'Golf'],
      'tcu': ['Football', 'Basketball', 'Baseball', 'Equestrian'],
      'texas-tech': ['Football', 'Basketball', 'Baseball', 'Track & Field'],
      'ucf': ['Football', 'Basketball', 'Soccer', 'Tennis'],
      'utah': ['Football', 'Basketball', 'Gymnastics', 'Swimming'],
      'west-virginia': ['Football', 'Basketball', 'Wrestling', 'Swimming']
    };
    return sportsBySchool[universityId] || ['Football', 'Basketball'];
  }

  const filteredAndSortedSchools = useMemo(() => {
    let filtered = enhancedSchools.filter(school =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterBy !== 'all') {
      filtered = filtered.filter(school => school.sizeCategory === filterBy);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'enrollment':
          return parseInt(b.enrollment.replace(/,/g, '')) - parseInt(a.enrollment.replace(/,/g, ''));
        case 'founded':
          return a.founded - b.founded;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [enhancedSchools, searchTerm, sortBy, filterBy]);

  const stats = useMemo(() => {
    const totalEnrollment = enhancedSchools.reduce((sum, school) => sum + parseInt(school.enrollment.replace(/,/g, '')), 0);
    const avgEnrollment = Math.round(totalEnrollment / enhancedSchools.length);
    const oldestYear = Math.min(...enhancedSchools.map(school => school.founded));
    const newestYear = Math.max(...enhancedSchools.map(school => school.founded));
    
    return {
      totalSchools: enhancedSchools.length,
      totalEnrollment: totalEnrollment.toLocaleString(),
      avgEnrollment: avgEnrollment.toLocaleString(),
      establishedRange: `${oldestYear} - ${newestYear}`,
      avgAge: Math.round(enhancedSchools.reduce((sum, school) => sum + school.establishedYears, 0) / enhancedSchools.length)
    };
  }, [enhancedSchools]);

  return (
    <div className="universities-page-container">
      {/* Hero Section */}
      <div className="relative z-10 text-center py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="universities-page-title universities-title-gradient mb-6">
            Big 12 Universities
          </h1>
          <p className="universities-page-subtitle">
            Discover the 16 prestigious institutions that make up the Big 12 Conference, 
            each bringing unique strengths, traditions, and athletic excellence to collegiate sports.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            <GlassCard className="p-4 text-center" hoverable>
              <div className="text-2xl font-bold text-foreground">{stats.totalSchools}</div>
              <div className="text-sm text-muted-foreground ft-font-ui">Universities</div>
            </GlassCard>
            <GlassCard className="p-4 text-center" hoverable>
              <div className="text-2xl font-bold text-foreground">{stats.totalEnrollment}</div>
              <div className="text-sm text-muted-foreground ft-font-ui">Total Students</div>
            </GlassCard>
            <GlassCard className="p-4 text-center" hoverable>
              <div className="text-2xl font-bold text-foreground">{stats.avgEnrollment}</div>
              <div className="text-sm text-muted-foreground ft-font-ui">Avg Enrollment</div>
            </GlassCard>
            <GlassCard className="p-4 text-center" hoverable>
              <div className="text-2xl font-bold text-foreground">{stats.avgAge}</div>
              <div className="text-sm text-muted-foreground ft-font-ui">Avg Age (Years)</div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search universities, locations, or mascots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border/30 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 
                          transition-all duration-200 text-foreground placeholder-muted-foreground"
              />
            </div>
            
            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortDesc className="text-muted-foreground w-5 h-5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-background/50 border border-border/30 rounded-lg px-4 py-3 
                          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 
                          transition-all duration-200 text-foreground"
              >
                <option value="name">Name</option>
                <option value="enrollment">Enrollment</option>
                <option value="founded">Founded</option>
              </select>
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground w-5 h-5" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="bg-background/50 border border-border/30 rounded-lg px-4 py-3 
                          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 
                          transition-all duration-200 text-foreground"
              >
                <option value="all">All Sizes</option>
                <option value="large">Large (50K+)</option>
                <option value="medium">Medium (30-50K)</option>
                <option value="small">Small (&lt;30K)</option>
              </select>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Universities Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="universities-grid">
          {filteredAndSortedSchools.map((school, index) => (
            <SchoolCard 
              key={school.id} 
              school={school} 
              index={index}
            />
          ))}
        </div>
        
        {filteredAndSortedSchools.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-foreground mb-2">No schools found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SchoolCardProps {
  school: Big12School & {
    sizeCategory: string;
    logoPath: string;
    spotlightSports: string[];
    establishedYears: number;
  };
  index: number;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ school, index }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <GlassCard 
      className="university-card group"
      hoverable
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards'
      }}
    >
      {/* Card Header */}
      <div className="university-card-header">
        <div className="university-logo" style={{ backgroundColor: school.primaryColor }}>
          {!imageError ? (
            <Image
              src={school.logoPath}
              alt={`${school.name} logo`}
              width={32}
              height={32}
              className="object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              className="university-logo-fallback text-sm"
              style={{ 
                backgroundColor: school.primaryColor,
                color: school.secondaryColor || '#ffffff'
              }}
            >
              {school.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="university-name">{school.name}</h3>
          <p className="university-id ft-font-ui">{school.nickname}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="space-y-4">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{school.location}</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-lg font-bold text-foreground ft-font-mono">
              {(parseInt(school.enrollment.replace(/,/g, '')) / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-muted-foreground ft-font-ui">Students</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-lg font-bold text-foreground ft-font-mono">
              {school.founded}
            </div>
            <div className="text-xs text-muted-foreground ft-font-ui">Founded</div>
          </div>
        </div>

        {/* Spotlight Sports */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Spotlight Sports</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {school.spotlightSports.map((sport) => (
              <span
                key={sport}
                className="px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-colors duration-200
                          bg-muted/50 text-muted-foreground border border-border/30 hover:bg-muted hover:text-foreground"
              >
                {sport}
              </span>
            ))}
          </div>
        </div>

        {/* View Details Button */}
        <button className="university-view-button group-hover:shadow-lg">
          <span className="flex items-center justify-center gap-2">
            View Details
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>
      </div>
    </GlassCard>
  );
};

// Animation styles are now handled in globals.css

export default SchoolsPage;