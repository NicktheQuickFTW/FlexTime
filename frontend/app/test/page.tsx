'use client'

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p>If you see this, the Next.js server is working.</p>
      <a href="/schedule-builder" className="text-blue-500 underline">
        Go to Schedule Builder
      </a>
    </div>
  )
}