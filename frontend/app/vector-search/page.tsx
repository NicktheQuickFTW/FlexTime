'use client';

import dynamic from 'next/dynamic';

// Dynamically import the VectorSearchInterface to avoid SSR issues
const VectorSearchInterface = dynamic(
  () => import('../../components/vector/VectorSearchInterface'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-white/70">Loading Vector Search Interface...</p>
        </div>
      </div>
    )
  }
);

export default function VectorSearchPage() {
  return <VectorSearchInterface />;
}