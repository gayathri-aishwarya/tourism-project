'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyOtp() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailParam = searchParams.get('email') || ''

    const [email, setEmail] = useState(emailParam)
    const [otp, setOtp] = useState('')
    const [timerText, setTimerText] = useState('OTP expires in 12:00')
    const [resendEnabled, setResendEnabled] = useState(false)
    const [message, setMessage] = useState('')
    const [resendMessage, setResendMessage] = useState('')
    const countdown = useRef<NodeJS.Timeout | null>(null)

    const startOtpTimer = (duration = 12 * 60) => {
        let timer = duration
        if (countdown.current) clearInterval(countdown.current)
        countdown.current = setInterval(() => {
            const minutes = Math.floor(timer / 60)
            const seconds = timer % 60
            setTimerText(`OTP expires in ${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`)

            if (timer <= 0) {
                if (countdown.current) clearInterval(countdown.current)
                setTimerText('OTP expired. Please resend.')
                setResendEnabled(true)
            }

            timer--
        }, 1000)
    }

    useEffect(() => {
        startOtpTimer()
        setResendEnabled(false)
        return () => { if(countdown.current) clearInterval(countdown.current) }
    }, [])

    const handleVerifyOtp = async () => {
        setMessage('')
        if (!email || !otp) {
            setMessage('Please enter email and OTP')
            return
        }

        try {
            const res = await fetch('http://localhost:3001/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            })
            const data = await res.json()
            if (res.ok) {
                setMessage('OTP verified successfully.')
                if (countdown.current) clearInterval(countdown.current)
                router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
            } else {
                setMessage(data.message)
            }
        } catch (err) {
            console.error(err)
            setMessage('Error verifying OTP')
        }
    }

    const handleResendOtp = async () => {
        setResendMessage('')
        if (!email) {
            setResendMessage('Enter your email first!')
            return
        }

        try {
            const res = await fetch('http://localhost:3001/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (res.ok) {
                setResendMessage('OTP resent! Check your email.')
                startOtpTimer()
                setResendEnabled(false)
            } else {
                setResendMessage(data.message)
            }
        } catch (err) {
            console.error(err)
            setResendMessage('Error resending OTP')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Verify OTP</h2>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full p-2 border rounded mb-2"
                />

                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full p-2 border rounded mb-2"
                />

                <button
                    onClick={handleVerifyOtp}
                    className="w-full bg-blue-600 text-white p-2 rounded mb-2"
                >
                    Verify OTP
                </button>

                <p className="text-center text-gray-600">{timerText}</p>

                <button
                    onClick={handleResendOtp}
                    disabled={!resendEnabled}
                    className={`w-full mt-2 p-2 rounded text-white ${resendEnabled ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    Resend OTP
                </button>

                {message && <p className="mt-2 text-center text-red-500">{message}</p>}
                {resendMessage && <p className="mt-1 text-center text-red-500">{resendMessage}</p>}
            </div>
        </div>
    )
}
