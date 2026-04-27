'use client'

import { useState, useEffect, useRef } from 'react'

export default function TwoFactorPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resending, setResending] = useState(false)
  const hasSent = useRef(false)

  useEffect(() => {
    if (!hasSent.current) {
      hasSent.current = true
      sendOTP()
    }
  }, [])

  const sendOTP = async () => {
    setResending(true)
    try {
      const res = await fetch('/api/two-factor/send', { method: 'POST' })
      if (res.ok) setSent(true)
    } catch {
      setError('Failed to send verification code')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setLoading(false)
        return
      }

      const destination = sessionStorage.getItem('login-destination')
      sessionStorage.removeItem('login-destination')

      // Check if password needs changing — ask the server directly
      const checkRes = await fetch('/api/account/check-password')
      const checkData = await checkRes.json()

      if (!checkData.passwordChanged) {
        window.location.replace('/change-password')
        return
      }

      if (destination === 'mall') {
        const customerId = checkData.customerId
        if (customerId) {
          window.location.replace(`/tenant/${customerId}/portfolio`)
        } else {
          window.location.replace('/dashboard')
        }
      } else {
        window.location.replace('/admin')
      }
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
            stelthion
          </h1>
          <p className="text-xs text-gray-400 -mt-0.5">PropertyOS</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
          <p className="text-sm text-gray-500 mt-1">
            {sent
              ? "We've sent a 6-digit verification code to your email."
              : 'Sending verification code...'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-[0.3em] font-mono border border-gray-200 rounded-lg p-3 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            autoFocus
          />

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <button
          onClick={sendOTP}
          disabled={resending}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors text-center"
        >
          {resending ? 'Sending...' : "Didn't receive a code? Resend"}
        </button>
      </div>
    </div>
  )
}