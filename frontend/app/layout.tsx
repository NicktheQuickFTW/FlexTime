import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import { FlexTimeAnimatedBackground } from '../components/ui/FlexTimeAnimatedBackground'
import { ThemeInitializer } from './components/ThemeInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlexTime - Intelligent Scheduling for Big 12 Conference',
  description: 'Revolutionary AI-powered scheduling platform transforming Big 12 Conference sports',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} min-h-screen relative overflow-x-hidden transition-colors duration-300`} suppressHydrationWarning>
        <ThemeInitializer />
        <div className="bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900 text-black dark:text-white min-h-screen transition-colors duration-300">
          {/* Animated Background */}
          <FlexTimeAnimatedBackground 
            intensity="low" 
            showGrid={true} 
            showFloatingElements={true}
            className="fixed inset-0 z-0"
          />
          
          {/* Content Layer */}
          <div className="relative z-10">
            <Navbar />
            <main className="pt-20">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}