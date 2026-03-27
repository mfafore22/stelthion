'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'

export default function TwoFactorPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [emailHint, setEmailHint] = useState('')
  const [sending, setSending] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [alreadyVerified, setAlreadyVerified] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Send OTP once on mount — uses sessionStorage to survive strict mode
  useEffect(() => {
    const alreadySent = sessionStorage.getItem('otp-sent')
    if (alreadySent === 'true') {
      setSending(false)
      setEmailHint(sessionStorage.getItem('otp-email-hint') || '')
      return
    }

    fetch('/api/two-factor/send', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.alreadyVerified) {
          setAlreadyVerified(true)
          const dest = sessionStorage.getItem('login-destination')
          sessionStorage.removeItem('login-destination')
          if (dest === 'admin') {
            router.replace('/admin/dashboard')
          } else if (dest === 'mall') {
            router.replace('/dashboard')
          } else {
            router.replace('/admin/dashboard')
          }
          return
        }
        if (data.sent) {
          setEmailHint(data.emailHint)
          sessionStorage.setItem('otp-sent', 'true')
          sessionStorage.setItem('otp-email-hint', data.emailHint)
        } else if (data.error) {
          setError(data.error)
        }
        setSending(false)
      })
      .catch(() => {
        setError('Failed to send verification code')
        setSending(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus first input when ready
  useEffect(() => {
    if (!sending && !alreadyVerified) {
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    }
  }, [sending, alreadyVerified])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setVerifying(true)

    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter all 6 digits')
      setVerifying(false)
      return
    }

    try {
      const res = await fetch('/api/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
        setVerifying(false)
        return
      }

      if (data.verified) {
        // Clear OTP session flags
        sessionStorage.removeItem('otp-sent')
        sessionStorage.removeItem('otp-email-hint')

        const dest = sessionStorage.getItem('login-destination')
        sessionStorage.removeItem('login-destination')

        if (dest === 'admin') {
          router.replace('/admin/dashboard')
        } else if (dest === 'mall') {
          router.replace(data.mallRedirectTo || '/dashboard')
        } else {
          if (data.role === 'ADMIN') {
            router.replace('/admin/dashboard')
          } else {
            router.replace(data.mallRedirectTo || '/dashboard')
          }
        }
      }
    } catch {
      setError('Verification failed. Please try again.')
      setVerifying(false)
    }
  }

  async function handleResend() {
    setError('')
    setSending(true)
    sessionStorage.removeItem('otp-sent')
    sessionStorage.removeItem('otp-email-hint')
    try {
      const res = await fetch('/api/two-factor/send', { method: 'POST' })
      const data = await res.json()
      if (data.sent) {
        setEmailHint(data.emailHint)
        sessionStorage.setItem('otp-sent', 'true')
        sessionStorage.setItem('otp-email-hint', data.emailHint)
      } else {
        setError(data.error || 'Failed to resend code')
      }
    } catch {
      setError('Failed to resend code')
    }
    setSending(false)
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    if (next.every(Boolean) && index === 5) {
      setTimeout(() => otpRefs.current[5]?.form?.requestSubmit(), 50)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  if (alreadyVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafafa]">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Redirecting...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fafafa]">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 px-10 py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
              stelthion
            </h1>
            <p className="text-sm text-gray-400 -mt-0.5 tracking-wide">
              Synexis<span className="text-[10px] align-super">™</span>
            </p>
            <p className="text-sm text-gray-500 mt-4 font-medium">
              Email Verification
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {sending ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Sending verification code...</p>
            </div>
          ) : (
            <>
              {emailHint && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 mb-6">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Code sent to <strong>{emailHint}</strong>
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                    <ShieldCheck size={14} className="text-gray-400" />
                    Enter 6-digit code
                  </label>
                  <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        disabled={verifying}
                        className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-gray-200 bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:opacity-50"
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying || otp.some((d) => !d)}
                  className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </form>

              <button
                onClick={handleResend}
                disabled={sending}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors text-center"
              >
                Resend code
              </button>
            </>
          )}

          <p className="text-center text-xs text-gray-400 mt-8">
            Secure access for authorized personnel only
          </p>
        </div>
      </div>
    </div>
  )
}