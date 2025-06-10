'use client'

import React from 'react'
import { FinancialDashboard } from '@/components/dashboard/FinancialDashboard'

/**
 * FlexTime Financial Management Page
 * 
 * Comprehensive financial dashboard for Big 12 Conference operations
 * Features account management, budget tracking, and staff responsibilities
 * Built with 21st-dev Magic AI design principles
 */
export default function FinancesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <FinancialDashboard />
      </div>
    </div>
  )
}