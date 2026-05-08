'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const inputClass = [
  'w-full rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-center',
  'font-mono text-2xl tracking-[0.3em] text-gray-900 placeholder:text-gray-400',
  'focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10',
].join(' ')

export default function TwoFactorPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const hasSent = useRef(false)

  const sendOTP = async () => {
    setResending(true)
    try {
      const res = await fetch('/api/two-factor/send', { method: 'POST' })
      if (!res.ok) setError('Failed to send verification code')
    } catch {
      setError('Failed to send verification code')
    } finally {
      setResending(false)
    }
  }

  useEffect(() => {
    if (hasSent.current) return
    hasSent.current = true
    void sendOTP()
  }, [])

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
      await continueAfterVerification()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden pt-[20vh]">
      <Image src="/Stelthion_landing-bg.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover object-center" />
      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="rounded-2xl border border-gray-100 bg-white px-10 pb-8 pt-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <div className="mb-7 flex flex-col items-center">
            <Image src="/logo.png" alt="Stelthion" width={360} height={98} priority className="h-auto w-[260px] md:w-[320px] lg:w-[360px]" />
            <p className="-mt-1 w-[260px] translate-x-[6px] text-center text-base font-medium uppercase tracking-[0.34em] text-bo-neutral-800 md:w-[320px] md:translate-x-[7px] md:text-lg md:tracking-[0.38em] lg:w-[360px] lg:translate-x-[8px] lg:text-xl lg:tracking-[0.42em]">
              PropertyOS<sup className="ml-0.5 align-super text-[0.45em] tracking-normal">TM</sup>
            </p>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Check your inbox</h2>
            <p className="mt-1 text-sm text-gray-500">Enter the verification code we just sent.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className={inputClass}
              autoFocus
            />
            <button type="submit" disabled={code.length !== 6 || loading} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <button onClick={sendOTP} disabled={resending} className="mt-4 w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-50">
            {resending ? 'Sending...' : "Didn't receive a code? Resend"}
          </button>
        </div>
      </div>
    </div>
  )
}

async function continueAfterVerification() {
  const destination = sessionStorage.getItem('login-destination')
  sessionStorage.removeItem('login-destination')
  const checkRes = await fetch('/api/account/check-password')
  const checkData = await checkRes.json()
  if (!checkData.passwordChanged) return window.location.replace('/change-password')
  if (destination !== 'mall') return window.location.replace('/admin')
  window.location.replace(checkData.customerId ? `/tenant/${checkData.customerId}/portfolio` : '/dashboard')
}
