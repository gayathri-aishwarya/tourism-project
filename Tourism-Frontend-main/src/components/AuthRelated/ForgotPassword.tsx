'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ForgotPassword() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const prefillEmail = searchParams.get('email') || ''

    const [email, setEmail] = useState(prefillEmail)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendOtp = async () => {
        if (!email) {
            setMessage('Please enter your email')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()

            if (res.ok) {
                setMessage('OTP sent! Check your email.')
                // redirect to verify OTP page after 1 sec
                setTimeout(() => {
                    router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`)
                }, 1000)
            } else {
                setMessage(data.message || 'Error sending OTP')
            }
        } catch (err) {
            console.error(err)
            setMessage('Error sending OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full p-2 border rounded mb-4"
                />

                <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded"
                >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>

                {message && <p className="mt-4 text-center text-red-500">{message}</p>}
            </div>
        </div>
    )
}
