'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function SignInPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  // Session-only: sign out on tab close if rememberMe is false
  useEffect(() => {
    const handleUnload = async () => {
      if (!rememberMe && sessionStorage.getItem('flajko_session_only') === 'true') {
        await supabaseBrowser.auth.signOut()
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [rememberMe])

  function validate() {
    let valid = true
    setEmailError('')
    setPasswordError('')

    if (!email.trim()) {
      setEmailError('Email address is required.')
      valid = false
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.')
      valid = false
    }

    if (!password) {
      setPasswordError('Password is required.')
      valid = false
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    if (!validate()) return

    setSubmitting(true)
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      setAuthError('Invalid email or password. Please try again.')
      return
    }

    if (!rememberMe) {
      sessionStorage.setItem('flajko_session_only', 'true')
    }

    router.push('/')
  }

  if (loading) return null

  return (
    <AuthLayout>
      <div className="w-full max-w-sm mx-auto">
        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-1.5">Sign In to Flajko</h1>
          <p className="text-sm text-gray-500">Check your latest flight deals.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Auth error */}
          {authError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
              Email Address<span className="text-red-500 ml-0.5">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg border-gray-200 shadow-sm placeholder:text-gray-400 focus-visible:ring-[#0284c7]"
            />
            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
              Password<span className="text-red-500 ml-0.5">*</span>
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-lg border-gray-200 shadow-sm placeholder:text-gray-400 focus-visible:ring-[#0284c7]"
            />
            {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(Boolean(v))}
                className="rounded border-gray-400 data-[state=checked]:bg-[#0284c7] data-[state=checked]:border-[#0284c7]"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                Remember Me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#0284c7] hover:text-[#0369a1] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-md bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-base transition-colors disabled:opacity-60 mt-2"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 pt-1">
            New to our platform?{' '}
            <Link
              href="/sign-up"
              className="font-semibold text-gray-800 hover:text-[#0284c7] transition-colors"
            >
              Create account
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
