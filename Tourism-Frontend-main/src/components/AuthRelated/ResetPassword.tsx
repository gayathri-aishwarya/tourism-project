'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetPassword() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailParam = searchParams.get('email') || ''

    const [email] = useState(emailParam)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            setMessage('Please fill in all fields')
            return
        }
        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const res = await fetch('http://localhost:3001/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword }),
            })
            const data = await res.json()
            if (res.ok) {
                setMessage('Your password has been reset successfully.')
                setTimeout(() => {
                    router.push('/') // go back to login page
                }, 1500)
            } else {
                setMessage(data.message || 'Error resetting password')
            }
        } catch (err) {
            console.error(err)
            setMessage('Error resetting password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />

                <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded"
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                {message && <p className="mt-2 text-center text-red-500">{message}</p>}
            </div>
        </div>
    )
}
