'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as Yup from 'yup'
import '@/src/styles/components/AuthRelated/Modal.css'

export default function ResetPassword() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailParam = searchParams.get('email') || ''

    const [email, setEmail] = useState(emailParam)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [validationErrors, setValidationErrors] = useState<{
        newPassword?: string
        confirmPassword?: string
    }>({})

    // Yup schema enforces password rules strictly
    const schema = Yup.object().shape({
        newPassword: Yup.string()
            .required('Password is required')
            .min(8, 'Password must be at least 8 characters')
            .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
            .matches(/[0-9]/, 'Password must contain at least one number')
            .matches(/[@$!%*?&]/, 'Password must contain at least one special character'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('newPassword')], 'Passwords must match')
            .required('Please confirm your password'),
    })

    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault()
        setMessage('')
        setValidationErrors({})

        try {
            // Validate before sending
            await schema.validate({ newPassword, confirmPassword }, { abortEarly: false })

            setLoading(true)
            const res = await fetch('http://localhost:3001/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword }),
            })
            const data = await res.json()

            if (res.ok) {
                setMessage('Your password has been reset successfully!')
                setTimeout(() => {
                    router.push('/login')
                }, 1000)
            } else {
                setMessage(data.message || 'Error resetting password')
            }
        } catch (err: any) {
            if (err.inner) {
                const errors: Record<string, string> = {}
                err.inner.forEach((error: any) => {
                    if (error.path) errors[error.path] = error.message
                })
                setValidationErrors(errors)
            } else {
                setMessage('Error resetting password')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='modal-overlay'>
            <form className='modal' onSubmit={handleResetPassword}>
                <h2 className='modal-title'>Reset Password</h2>

                {message && (
                    <p className={message.toLowerCase().includes('success') ? 'success-msg' : 'error-msg'}>
                        {message}
                    </p>
                )}

                <input
                    type='password'
                    placeholder='New Password'
                    className='modal-input'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                {validationErrors.newPassword && (
                    <div className='error-msg'>{validationErrors.newPassword}</div>
                )}

                <input
                    type='password'
                    placeholder='Confirm Password'
                    className='modal-input'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {validationErrors.confirmPassword && (
                    <div className='error-msg'>{validationErrors.confirmPassword}</div>
                )}

                <button type='submit' className='submit-btn' disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </div>
    )
}
