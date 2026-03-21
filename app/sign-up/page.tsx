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

export default function SignUpPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [success, setSuccess] = useState(false)

  const [usernameError, setUsernameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [termsError, setTermsError] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  function validate() {
    let valid = true
    setUsernameError('')
    setEmailError('')
    setPasswordError('')
    setConfirmPasswordError('')
    setTermsError('')

    if (!username.trim()) {
      setUsernameError('Username is required.')
      valid = false
    }

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
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      valid = false
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.')
      valid = false
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match.')
      valid = false
    }

    if (!termsAccepted) {
      setTermsError('You must agree to the Terms of Use.')
      valid = false
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    if (!validate()) return

    setSubmitting(true)

    const { error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    if (error) {
      setSubmitting(false)
      setAuthError(error.message || 'Something went wrong. Please try again.')
      return
    }

    // Insert into subscribers table (ignore duplicates — 409 is fine)
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, gdpr_consent: true }),
      })
    } catch {
      // Non-critical — continue regardless
    }

    setSubmitting(false)
    setSuccess(true)
  }

  if (loading) return null

  return (
    <AuthLayout>
      <div className="w-full max-w-sm mx-auto">
        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-1.5">Start Your Journey with Flajko</h1>
          <p className="text-sm text-gray-500">Your next adventure starts here.</p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-50 border border-green-200 px-5 py-4">
            <p className="text-sm text-green-800 font-medium">
              Check your inbox to confirm your email before signing in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Auth error */}
            {authError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{authError}</p>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800">
                User Name<span className="text-red-500 ml-0.5">*</span>
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 rounded-lg border-gray-200 shadow-sm placeholder:text-gray-400 focus-visible:ring-[#0284c7]"
              />
              {usernameError && <p className="text-xs text-red-600 mt-1">{usernameError}</p>}
            </div>

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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-800">
                Confirm Password<span className="text-red-500 ml-0.5">*</span>
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 rounded-lg border-gray-200 shadow-sm placeholder:text-gray-400 focus-visible:ring-[#0284c7]"
              />
              {confirmPasswordError && (
                <p className="text-xs text-red-600 mt-1">{confirmPasswordError}</p>
              )}
            </div>

            {/* Terms */}
            <div className="pt-1">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                  className="mt-0.5 rounded border-gray-400 data-[state=checked]:bg-[#0284c7] data-[state=checked]:border-[#0284c7]"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none leading-snug">
                  I agree to{' '}
                  <Link
                    href="/privacy"
                    className="font-medium text-[#0284c7] hover:text-[#0369a1] underline transition-colors"
                  >
                    Terms of Use
                  </Link>
                  .
                </label>
              </div>
              {termsError && <p className="text-xs text-red-600 mt-1">{termsError}</p>}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-md bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-base transition-colors disabled:opacity-60 mt-2"
            >
              {submitting ? 'Creating account…' : 'Sign Up'}
            </Button>

            {/* Sign in link */}
            <p className="text-center text-sm text-gray-500 pt-1">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                className="font-semibold text-gray-800 hover:text-[#0284c7] transition-colors"
              >
                Sign In Now
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
