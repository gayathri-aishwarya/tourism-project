'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Style
import '@/src/styles/components/AuthRelated/Modal.css'

export default function VerifyOtp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<number | null>(null)

  // Start countdown
  const startCountdown = () => {
    setCountdown(60)
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    startCountdown()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleVerifyOtp = async () => {
    if (!otp) {
      setMessage('Please enter OTP')
      setSuccess(false)
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('http://localhost:3001/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage('OTP verified successfully!')
        setSuccess(true)

        // Redirect to reset password page after short delay
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
        }, 800)
      } else {
        setMessage(data.message || 'OTP verification failed')
        setSuccess(false)
      }
    } catch (err) {
      console.error(err)
      setMessage('Error verifying OTP')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCount >= 5) return // silently prevent more than 5 attempts

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('http://localhost:3001/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage('OTP resent! Check your email.')
        setSuccess(true)
        setResendCount((prev) => prev + 1)
        startCountdown()
      } else {
        setMessage(data.message || 'Error resending OTP')
        setSuccess(false)
      }
    } catch (err) {
      console.error(err)
      setMessage('Error resending OTP')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault()
          handleVerifyOtp()
        }}
      >
        <h2 className="modal-title">Verify OTP</h2>

        {message && (
          <div className={success ? 'success-msg' : 'error-msg'}>{message}</div>
        )}

        <input
          type="text"
          placeholder="Enter OTP"
          className="modal-input"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="modal-options">
          <button
            type="button"
            className="forgot-password"
            onClick={handleResendOtp}
            disabled={countdown > 0}
            style={{
              color: countdown > 0 ? 'gray' : 'orange',
              cursor: countdown > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
      </form>
    </div>
  )
}
