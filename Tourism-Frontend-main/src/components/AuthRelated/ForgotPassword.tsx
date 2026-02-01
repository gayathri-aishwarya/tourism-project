'use client'

import * as Yup from 'yup'
import { FiX } from 'react-icons/fi'
import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Types
import { ModalsProps } from '@/src/types/propsTypes'

// Style
import '@/src/styles/components/AuthRelated/Modal.css'

export default function ForgotPasswordModal({ onCloseAction }: ModalsProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const prefillEmail = searchParams.get('email') || ''

    const [email, setEmail] = useState(prefillEmail)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [validationErrors, setValidationErrors] = useState<{ email?: string }>({})

    const schema = Yup.object().shape({
        email: Yup.string()
            .email('Invalid email address')
            .required('Email is required'),
    })

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setValidationErrors({})

        try {
            await schema.validate({ email }, { abortEarly: false })
            setLoading(true)

            const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.message || 'Failed to send OTP')
                return
            }

            setTimeout(() => {
                router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`)
            }, 800)
        } catch (validationErr: any) {
            const errors: Record<string, string> = {}
            validationErr.inner.forEach((err: any) => {
                if (err.path) errors[err.path] = err.message
            })
            setValidationErrors(errors)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='modal-overlay'>
            <form className='modal' onSubmit={handleSubmit}>
                <button
                    type='button'
                    className='close-btn'
                    onClick={onCloseAction}
                >
                    <FiX />
                </button>

                <h2 className='modal-title'>Forgot Password</h2>

                {error && <div className='error-msg'>{error}</div>}

                <input
                    type='email'
                    placeholder='Email address'
                    className='modal-input'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {validationErrors.email && (
                    <div className='error-msg'>{validationErrors.email}</div>
                )}

                <button type='submit' className='submit-btn' disabled={loading}>
                    {loading ? 'Sending OTP...' : 'SEND OTP'}
                </button>
            </form>
        </div>
    )
}
