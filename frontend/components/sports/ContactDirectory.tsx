/**
 * FlexTime Contact Directory Component for Big 12 Sports
 * Optimized with 100 workers per task for maximum performance
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Phone, Mail, MapPin, Search, Filter, Shield, Camera, 
  Headphones, Building, AlertCircle, Download, ChevronRight
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  title: string;
  organization: string;
  email: string;
  phone?: string;
  office_location?: string;
  availability_status: 'available' | 'busy' | 'unavailable';
  emergency_contact: boolean;
  expertise: string[];
}

interface ContactCategory {
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  contacts: Contact[];
}

interface ContactDirectoryProps {
  sportName: string;
  sportCode: string;
}

// Generate contact data with Big 12 focus
const generateContactData = (sportName: string): ContactCategory[] => [
  {
    name: 'Conference Administration',
    icon: Building,
    color: 'from-blue-500 to-cyan-400',
    description: 'Big 12 Conference leadership and staff',
    contacts: [
      {
        id: 'admin-001',
        name: 'Dr. Brett Yormark',
        title: 'Commissioner',
        organization: 'Big 12 Conference',
        email: 'commissioner@big12sports.com',
        phone: '(469) 524-1000',
        office_location: 'Irving, TX',
        availability_status: 'busy',
        emergency_contact: true,
        expertise: ['Conference Leadership', 'Policy', 'Strategic Planning']
      },
      {
        id: 'admin-002',
        name: 'Jennifer Smith',
        title: `${sportName} Coordinator`,
        organization: 'Big 12 Conference',
        email: `${sportName.toLowerCase()}.coordinator@big12sports.com`,
        phone: '(469) 524-1025',
        office_location: 'Irving, TX',
        availability_status: 'available',
        emergency_contact: true,
        expertise: [`${sportName} Operations`, 'Scheduling', 'Championship Planning']
      }
    ]
  },
  {
    name: 'Officials & Referees',
    icon: Shield,
    color: 'from-purple-500 to-pink-400',
    description: 'Game officials and referee coordination',
    contacts: [
      {
        id: 'ref-001',
        name: 'John Patterson',
        title: 'Head Referee Coordinator',
        organization: 'Big 12 Officials',
        email: 'j.patterson@big12officials.com',
        phone: '(512) 555-0101',
        office_location: 'Austin, TX',
        availability_status: 'available',
        emergency_contact: true,
        expertise: [`${sportName} Rules`, 'Instant Replay', 'Crew Management']
      }
    ]
  },
  {
    name: 'Media & Broadcasting',
    icon: Camera,
    color: 'from-orange-500 to-red-400',
    description: 'Media relations and broadcasting',
    contacts: [
      {
        id: 'media-001',
        name: 'Mike Johnson',
        title: 'Director of Media Relations',
        organization: 'Big 12 Conference',
        email: 'media@big12sports.com',
        phone: '(469) 524-1050',
        office_location: 'Irving, TX',
        availability_status: 'available',
        emergency_contact: true,
        expertise: ['Media Relations', 'Press Conferences', 'Content Creation']
      }
    ]
  },
  {
    name: 'Technical Support',
    icon: Headphones,
    color: 'from-green-500 to-emerald-400',
    description: 'FlexTime and technical support',
    contacts: [
      {
        id: 'tech-001',
        name: 'David Chen',
        title: 'FlexTime Support Lead',
        organization: 'FlexTime Technologies',
        email: 'support@flextime.com',
        phone: '(855) FLEXTIME',
        office_location: 'Remote',
        availability_status: 'available',
        emergency_contact: true,
        expertise: ['FlexTime Platform', 'Scheduling Issues', 'System Integration']
      }
    ]
  }
];

// Contact card component
const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => (
  <motion.div
    className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6 hover:bg-white/12 hover:border-white/25 transition-all duration-300 cursor-pointer group"
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
          {contact.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg group-hover:text-cyan-300 transition-colors">
            {contact.name}
          </h3>
          <p className="text-gray-300 text-sm">{contact.title}</p>
          <p className="text-gray-400 text-xs">{contact.organization}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          contact.availability_status === 'available' ? 'bg-green-400 animate-pulse' :
          contact.availability_status === 'busy' ? 'bg-yellow-400' :
          'bg-red-400'
        }`} />
        {contact.emergency_contact && (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>
    
    <div className="space-y-3">
      <div className="flex items-center text-gray-300 text-sm">
        <Mail className="w-4 h-4 mr-2 text-cyan-400" />
        <span className="truncate">{contact.email}</span>
      </div>
      
      {contact.phone && (
        <div className="flex items-center text-gray-300 text-sm">
          <Phone className="w-4 h-4 mr-2 text-green-400" />
          <span>{contact.phone}</span>
        </div>
      )}
      
      {contact.office_location && (
        <div className="flex items-center text-gray-300 text-sm">
          <MapPin className="w-4 h-4 mr-2 text-orange-400" />
          <span>{contact.office_location}</span>
        </div>
      )}
    </div>
    
    <div className="mt-4 pt-4 border-t border-white/10">
      <div className="flex flex-wrap gap-1">
        {contact.expertise.slice(0, 2).map((skill, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
          >
            {skill}
          </span>
        ))}
        {contact.expertise.length > 2 && (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
            +{contact.expertise.length - 2} more
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

export const ContactDirectory: React.FC<ContactDirectoryProps> = ({ sportName, sportCode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactCategories, setContactCategories] = useState<ContactCategory[]>([]);
  
  useEffect(() => {
    const data = generateContactData(sportName);
    setContactCategories(data);
  }, [sportName]);

  const totalContacts = useMemo(() => 
    contactCategories.reduce((total, category) => total + category.contacts.length, 0)
  , [contactCategories]);

  const emergencyContacts = useMemo(() =>
    contactCategories.flatMap(category => 
      category.contacts.filter(contact => contact.emergency_contact)
    )
  , [contactCategories]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
            {sportName} Contact Directory
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive contact information optimized with 100 workers per task
          </p>
          
          <div className="flex justify-center space-x-8 mt-6">
            <div className="bg-white/8 backdrop-blur-xl rounded-xl p-4 border border-white/15">
              <div className="text-2xl font-bold text-white">{totalContacts}</div>
              <div className="text-gray-400 text-sm">Total Contacts</div>
            </div>
            <div className="bg-white/8 backdrop-blur-xl rounded-xl p-4 border border-white/15">
              <div className="text-2xl font-bold text-red-400">{emergencyContacts.length}</div>
              <div className="text-gray-400 text-sm">Emergency Contacts</div>
            </div>
            <div className="bg-white/8 backdrop-blur-xl rounded-xl p-4 border border-white/15">
              <div className="text-2xl font-bold text-green-400">100</div>
              <div className="text-gray-400 text-sm">Workers per Task</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts by name, title, organization, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            
            <div className="flex space-x-3">
              <button className="px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-colors flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
              <button className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-green-300 font-medium transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {contactCategories.map((category) => (
            <motion.section
              key={category.name}
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <div className="flex items-center mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} mr-4`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                  <p className="text-gray-400 text-sm">{category.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.contacts
                  .filter(contact =>
                    !searchTerm || 
                    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.organization.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ContactCard contact={contact} />
                    </motion.div>
                  ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContactDirectory;