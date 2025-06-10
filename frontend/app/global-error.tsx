'use client'

import { useEffect } from 'react'
import { FlexTimeShinyButton } from '../components/ui/FlexTimeShinyButton'
import FTIcon from '../components/ui/FTIcon'

// Global error component with consistent FlexTime styling
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center bg-gray-950 p-6 text-white">
          <div className="flex w-full max-w-md flex-col items-center rounded-xl bg-black/30 p-8 backdrop-blur-lg">
            <FTIcon name="logo" size={64} className="mb-4" />
            <h1 className="mb-4 bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-2xl font-bold text-transparent">
              Something went wrong
            </h1>
            <p className="mb-6 text-center text-gray-300">
              We&apos;ve encountered an unexpected error. Our team has been notified.
            </p>
            <FlexTimeShinyButton variant="primary" onClick={() => reset()}>
              Try again
            </FlexTimeShinyButton>
          </div>
        </div>
      </body>
    </html>
  )
}
