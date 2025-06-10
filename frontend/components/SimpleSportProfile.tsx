'use client'

import React from 'react'

interface SimpleSportProfileProps {
  sportId: number;
  [key: string]: any;
}

const SimpleSportProfile: React.FC<SimpleSportProfileProps> = ({ sportId, ...props }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Sport Profile</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Sport ID: {sportId}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is a simplified sport profile component. The full component requires Material-UI dependencies.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SimpleSportProfile