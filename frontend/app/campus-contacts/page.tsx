'use client'

import React from 'react'
import { CampusContactsDashboard } from '@/components/dashboard/CampusContactsDashboard'

/**
 * FlexTime Campus Contacts Page
 * 
 * Comprehensive campus contacts management dashboard
 * Features role-based filtering, search, and institutional organization
 * Built with 21st-dev Magic AI design principles
 */
export default function CampusContactsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <CampusContactsDashboard />
      </div>
    </div>
  )
}