/**
 * Campus Contacts Dashboard Component
 * 
 * Integrated campus contacts management with glassmorphic design
 * Features role-based filtering, search, and institutional organization
 * Following 21st-dev Magic AI design principles
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Phone, Mail, MapPin, Search, Filter, Shield, 
  Building, AlertCircle, Download, ChevronRight, Star,
  UserCheck, Clock, Globe, Award, Target, Zap,
  BookOpen, Calendar, MessageSquare, Settings
} from 'lucide-react';

import campusContactsService, { 
  CampusContact, 
  ContactGroup, 
  SportContactSummary 
} from '@/services/campusContactsService';

interface CampusContactsDashboardProps {
  sportFilter?: string;
  institutionFilter?: string;
  className?: string;
}

// Contact Card Component with Glassmorphic Design
const ContactCard: React.FC<{ contact: CampusContact; isCompact?: boolean }> = ({ 
  contact, 
  isCompact = false 
}) => (
  <motion.div
    className="ft-glass-card p-4 hover:bg-white/12 hover:border-cyan-400/30 transition-all duration-300 cursor-pointer group"
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    layout
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center flex-1">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 shrink-0">
          {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-semibold text-sm group-hover:text-cyan-300 transition-colors truncate">
            {contact.name}
          </h3>
          <p className="text-gray-300 text-xs truncate">{contact.sportRole}</p>
          {!isCompact && (
            <p className="text-gray-400 text-xs truncate">{contact.affiliation}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2 shrink-0">
        <div className={`w-2 h-2 rounded-full ${
          contact.availability === 'available' ? 'bg-green-400 animate-pulse' :
          contact.availability === 'busy' ? 'bg-yellow-400' :
          'bg-red-400'
        }`} />
        {contact.isEmergencyContact && (
          <AlertCircle className="w-3 h-3 text-red-400" />
        )}
      </div>
    </div>
    
    {!isCompact && (
      <div className="space-y-2">
        {contact.email && (
          <div className="flex items-center text-gray-300 text-xs">
            <Mail className="w-3 h-3 mr-2 text-cyan-400 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        
        {contact.phone && (
          <div className="flex items-center text-gray-300 text-xs">
            <Phone className="w-3 h-3 mr-2 text-green-400 shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>
    )}
    
    {contact.sport.length > 0 && (
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex flex-wrap gap-1">
          {contact.sport.slice(0, isCompact ? 1 : 2).map((sport, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
            >
              {sport}
            </span>
          ))}
          {contact.sport.length > (isCompact ? 1 : 2) && (
            <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
              +{contact.sport.length - (isCompact ? 1 : 2)}
            </span>
          )}
        </div>
      </div>
    )}
  </motion.div>
);

// Metric Card Component
const ContactMetricCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}> = ({ title, value, subtitle, icon, color, trend, trendValue }) => (
  <motion.div
    className="ft-glass-card p-4"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="text-gray-400 text-xs font-medium mb-1">{title}</div>
        <div className="flex items-baseline">
          <div className="text-2xl font-bold text-white">{value}</div>
          {subtitle && (
            <div className="text-gray-400 text-xs ml-1">{subtitle}</div>
          )}
        </div>
        {trend && trendValue && (
          <div className={`text-xs mt-1 ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {trendValue}
          </div>
        )}
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

// Institution Summary Component
const InstitutionSummary: React.FC<{ group: ContactGroup }> = ({ group }) => (
  <motion.div
    className="ft-glass-card p-4"
    whileHover={{ scale: 1.01 }}
    layout
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          group.memberStatus === 'Legacy' ? 'bg-cyan-400' : 'bg-orange-400'
        }`} />
        <h3 className="text-white font-semibold text-sm truncate">{group.institution}</h3>
      </div>
      <div className="text-cyan-400 text-sm font-medium">{group.totalContacts}</div>
    </div>
    
    <div className="space-y-1">
      {Object.entries(group.roleBreakdown).slice(0, 3).map(([role, count]) => (
        <div key={role} className="flex justify-between text-xs">
          <span className="text-gray-300 truncate">{role}</span>
          <span className="text-gray-400 ml-2">{count}</span>
        </div>
      ))}
      {Object.keys(group.roleBreakdown).length > 3 && (
        <div className="text-xs text-gray-400">
          +{Object.keys(group.roleBreakdown).length - 3} more roles
        </div>
      )}
    </div>
  </motion.div>
);

export const CampusContactsDashboard: React.FC<CampusContactsDashboardProps> = ({
  sportFilter,
  institutionFilter,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'institutions'>('cards');

  // Get data from service
  const allContacts = useMemo(() => campusContactsService.getAllContacts(), []);
  const contactGroups = useMemo(() => campusContactsService.getContactGroups(), []);
  const stats = useMemo(() => campusContactsService.getContactStatistics(), []);

  // Filter contacts based on criteria
  const filteredContacts = useMemo(() => {
    let contacts = allContacts;

    // Apply sport filter
    if (sportFilter) {
      contacts = campusContactsService.getContactsBySport(sportFilter);
    }

    // Apply institution filter
    if (institutionFilter) {
      contacts = contacts.filter(contact => 
        contact.affiliation.toLowerCase().includes(institutionFilter.toLowerCase())
      );
    }

    // Apply search term
    if (searchTerm) {
      contacts = campusContactsService.searchContacts(searchTerm);
    }

    // Apply role filter
    if (selectedRole) {
      contacts = contacts.filter(contact => 
        contact.sportRole.toLowerCase().includes(selectedRole.toLowerCase())
      );
    }

    // Apply emergency filter
    if (showEmergencyOnly) {
      contacts = contacts.filter(contact => contact.isEmergencyContact);
    }

    return contacts;
  }, [allContacts, sportFilter, institutionFilter, searchTerm, selectedRole, showEmergencyOnly]);

  // Get unique roles for filter dropdown
  const availableRoles = useMemo(() => {
    const roles = new Set(allContacts.map(contact => contact.sportRole));
    return Array.from(roles).sort();
  }, [allContacts]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Campus Contacts</h2>
          <p className="text-gray-400 text-sm">
            {filteredContacts.length} contacts across {contactGroups.length} institutions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 w-64"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Roles</option>
            {availableRoles.map(role => (
              <option key={role} value={role} className="bg-slate-800">{role}</option>
            ))}
          </select>

          <button
            onClick={() => setShowEmergencyOnly(!showEmergencyOnly)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              showEmergencyOnly 
                ? 'bg-red-500/20 text-red-300 border border-red-400/30' 
                : 'bg-white/10 text-gray-300 border border-white/20'
            }`}
          >
            Emergency
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <ContactMetricCard
          title="Total Contacts"
          value={filteredContacts.length}
          icon={<Users className="w-4 h-4 text-white" />}
          color="bg-cyan-500/20"
          trend="stable"
          trendValue="All contacts"
        />
        
        <ContactMetricCard
          title="Available Now"
          value={filteredContacts.filter(c => c.availability === 'available').length}
          icon={<UserCheck className="w-4 h-4 text-white" />}
          color="bg-green-500/20"
          trend="up"
          trendValue="+5 today"
        />
        
        <ContactMetricCard
          title="Emergency Contacts"
          value={filteredContacts.filter(c => c.isEmergencyContact).length}
          icon={<AlertCircle className="w-4 h-4 text-white" />}
          color="bg-red-500/20"
          trend="stable"
          trendValue="Priority"
        />
        
        <ContactMetricCard
          title="Legacy Members"
          value={filteredContacts.filter(c => c.memberStatus === 'Legacy').length}
          icon={<Star className="w-4 h-4 text-white" />}
          color="bg-yellow-500/20"
          trend="stable"
          trendValue="Core conference"
        />
        
        <ContactMetricCard
          title="Conference Staff"
          value={filteredContacts.filter(c => c.affiliation === 'Big 12 Conference').length}
          icon={<Building className="w-4 h-4 text-white" />}
          color="bg-purple-500/20"
          trend="stable"
          trendValue="HQ staff"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              viewMode === 'cards' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-gray-400'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-gray-400'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('institutions')}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              viewMode === 'institutions' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-gray-400'
            }`}
          >
            Institutions
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-300 text-xs transition-colors flex items-center">
            <Download className="w-3 h-3 mr-1" />
            Export
          </button>
          <button className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-300 text-xs transition-colors flex items-center">
            <Settings className="w-3 h-3 mr-1" />
            Configure
          </button>
        </div>
      </div>

      {/* Content Display */}
      <AnimatePresence mode="wait">
        {viewMode === 'institutions' && (
          <motion.div
            key="institutions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {contactGroups
              .filter(group => {
                if (institutionFilter) {
                  return group.institution.toLowerCase().includes(institutionFilter.toLowerCase());
                }
                return true;
              })
              .map((group, index) => (
                <motion.div
                  key={group.institution}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <InstitutionSummary group={group} />
                </motion.div>
              ))}
          </motion.div>
        )}

        {viewMode === 'cards' && (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <ContactCard contact={contact} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.01 }}
              >
                <ContactCard contact={contact} isCompact={true} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No contacts found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or filters
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CampusContactsDashboard;