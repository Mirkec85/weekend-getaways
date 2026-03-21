'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [authError, setAuthError] = useState('')
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  function validate() {
    setEmailError('')
    if (!email.trim()) {
      setEmailError('Email address is required.')
      return false
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.')
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    if (!validate()) return

    setSubmitting(true)
    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/update-password`,
    })
    setSubmitting(false)

    if (error) {
      setAuthError(error.message || 'Something went wrong. Please try again.')
      return
    }

    setSuccess(true)
  }

  if (loading) return null

  return (
    <AuthLayout>
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-1.5">Reset Your Password</h1>
          <p className="text-sm text-gray-500">Enter your email and we&apos;ll send a reset link.</p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-50 border border-green-200 px-5 py-4">
            <p className="text-sm text-green-800 font-medium">
              Reset link sent. Check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {authError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{authError}</p>
              </div>
            )}

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

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-md bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-base transition-colors disabled:opacity-60 mt-2"
            >
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
