'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  UserPlus,
  Github,
  Chrome,
  Shield,
  ArrowRight
} from 'lucide-react'
import FTLogo from './FTLogo'
import { FlexTimeShinyButton } from './FlexTimeShinyButton'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

// 21st-dev inspired input component
const FuturisticInput = ({ 
  icon: Icon, 
  type = "text", 
  placeholder, 
  value, 
  onChange,
  showPasswordToggle = false
}: {
  icon: React.ElementType
  type?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  showPasswordToggle?: boolean
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
        <Icon size={20} />
      </div>
      
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--ft-neon)]/50 focus:border-[color:var(--ft-neon)]/50 transition-all duration-300"
      />
      
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  )
}

// Social login button component
const SocialButton = ({ 
  icon: Icon, 
  label, 
  onClick 
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center justify-center gap-3 w-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] rounded-xl py-3 text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300"
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </motion.button>
)

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setLoading(false)
    onClose()
  }

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`)
    // Implement social login
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-md bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              
              {/* Header */}
              <div className="relative p-8 text-center">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
                
                {/* Logo and title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div className="mx-auto flex justify-center">
                    <FTLogo variant="white" size="lg" showText />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {mode === 'signin' ? 'Welcome Back' : 'Join FlexTime'}
                    </h2>
                    <p className="text-gray-400 mt-2">
                      {mode === 'signin' 
                        ? 'Sign in to your FlexTime account' 
                        : 'Create your FlexTime account'
                      }
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Form */}
              <div className="px-8 pb-8">
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Email input */}
                  <FuturisticInput
                    icon={Mail}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={setEmail}
                  />
                  
                  {/* Password input */}
                  <FuturisticInput
                    icon={Lock}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    showPasswordToggle
                  />
                  
                  {/* Confirm password for signup */}
                  <AnimatePresence mode="wait">
                    {mode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FuturisticInput
                          icon={Shield}
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          showPasswordToggle
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <FlexTimeShinyButton
                    variant="neon"
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 text-lg font-semibold"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {mode === 'signin' ? <LogIn size={20} /> : <UserPlus size={20} />}
                        {mode === 'signin' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </FlexTimeShinyButton>
                </motion.form>

                {/* Divider */}
                <div className="flex items-center my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="px-4 text-sm text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                {/* Social login */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <SocialButton
                    icon={Chrome}
                    label="Continue with Google"
                    onClick={() => handleSocialLogin('google')}
                  />
                  
                  <SocialButton
                    icon={Github}
                    label="Continue with GitHub"
                    onClick={() => handleSocialLogin('github')}
                  />
                </motion.div>

                {/* Mode toggle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center mt-6"
                >
                  <button
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {mode === 'signin' ? (
                      <>Don't have an account? <span className="text-[color:var(--ft-neon)] font-medium">Sign up</span></>
                    ) : (
                      <>Already have an account? <span className="text-[color:var(--ft-neon)] font-medium">Sign in</span></>
                    )}
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}