'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const startEnrollment = async () => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/two-factor/enable', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setQrCode(data.qrCode)
      setSecret(data.secret)
      setEnrolling(true)
    } catch {
      setError('Failed to start enrollment')
    } finally {
      setLoading(false)
    }
  }

  const confirmEnrollment = async () => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/two-factor/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setIsEnabled(true)
      setEnrolling(false)
      setQrCode('')
      setSecret('')
      setCode('')
      router.refresh()
    } catch {
      setError('Confirmation failed')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    const userCode = prompt('Enter your authenticator code to disable 2FA:')
    if (!userCode) return

    try {
      const res = await fetch('/api/two-factor/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: userCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to disable 2FA')
        return
      }

      setIsEnabled(false)
      router.refresh()
    } catch {
      alert('Something went wrong')
    }
  }

  // Already enabled
  if (isEnabled && !enrolling) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Two-Factor Authentication
        </h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-emerald-700 font-medium">Enabled</span>
        </div>
        <button
          onClick={disable2FA}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Disable 2FA
        </button>
      </div>
    )
  }

  // Enrolling — show QR code
  if (enrolling) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Set Up Two-Factor Authentication
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>

        <div className="flex justify-center mb-4">
          <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
        </div>

        <details className="text-sm text-gray-500 mb-4">
          <summary className="cursor-pointer hover:text-gray-700">
            Can't scan? Enter this key manually
          </summary>
          <code className="block mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs break-all font-mono">
            {secret}
          </code>
        </details>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter 6-digit code"
          className="w-full text-center text-lg tracking-[0.3em] font-mono border border-gray-300 rounded-lg p-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />

        <div className="flex gap-3">
          <button
            onClick={confirmEnrollment}
            disabled={code.length !== 6 || loading}
            className="flex-1 bg-emerald-500 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </button>
          <button
            onClick={() => {
              setEnrolling(false)
              setQrCode('')
              setSecret('')
              setCode('')
              setError('')
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Not enabled — show setup button
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        Two-Factor Authentication
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Add an extra layer of security to your account.
      </p>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}
      <button
        onClick={startEnrollment}
        disabled={loading}
        className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Enable 2FA'}
      </button>
    </div>
  )
}