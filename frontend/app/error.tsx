'use client'

import { useEffect } from 'react'
import { FlexTimeShinyButton } from '../src/components/ui/FlexTimeShinyButton'
import FTIcon from '../src/components/ui/FTIcon'

// Error component with consistent FlexTime styling
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Client-side error caught:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center bg-gray-950/50 p-6 rounded-xl backdrop-blur-lg">
      <div className="flex w-full max-w-md flex-col items-center p-8">
        <FTIcon name="logo" size={48} className="mb-4" />
        <h2 className="mb-4 bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-xl font-bold text-transparent">
          Something went wrong
        </h2>
        <p className="mb-6 text-center text-gray-300">
          We've encountered an unexpected error. Please try again.
        </p>
        <FlexTimeShinyButton variant="primary" onClick={() => reset()}>
          Try again
        </FlexTimeShinyButton>
      </div>
    </div>
  )
}
