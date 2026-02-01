'use client'

import * as Yup from 'yup'
import { FiX } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { useContext, useState, useEffect, FormEvent } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { useRouter } from 'next/navigation'

// Contexts
import { UserContext } from '@/src/contexts/Contexts'

// Types
import { ModalsProps } from '@/src/types/propsTypes'

// Style
import '@/src/styles/components/AuthRelated/Modal.css'

export default function LoginModal({ onCloseAction }: ModalsProps) {
    const router = useRouter()
    const { login, loginGoogle, isLoggedIn } = useContext(UserContext)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [validationErrors, setValidationErrors] = useState<{
        email?: string
        password?: string
    }>({})

    const schema = Yup.object().shape({
        email: Yup.string()
            .email('Invalid email address')
            .required('Email is required'),
        password: Yup.string().required('Password is required'),
    })

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setValidationErrors({})

        try {
            await schema.validate({ email, password }, { abortEarly: false })

            setLoading(true)
            await login({ email, password }, rememberMe)
                .catch((err) => {
                    setError(err.response?.data?.message || 'Login failed')
                })
                .finally(() => setLoading(false))
        } catch (validationErr: any) {
            const errors: Record<string, string> = {}
            validationErr.inner.forEach((err: any) => {
                if (err.path) errors[err.path] = err.message
            })
            setValidationErrors(errors)
        }
    }

    useEffect(() => {
        if (isLoggedIn()) {
            onCloseAction()
        }
    }, [isLoggedIn, onCloseAction])

    const handleForgotPassword = () => {
        if (!email) {
            alert('Please enter your email first.')
            return
        }
        // navigate to forgot password page with email pre-filled
        router.push(`/auth/forgot-password?email=${encodeURIComponent(email)}`)
        onCloseAction() // close login modal
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
                <h2 className='modal-title'>Log In</h2>
                {error && <div className='error-msg'>{error}</div>}

                <input
                    id='login-email'
                    type='email'
                    placeholder='Email address'
                    className='modal-input'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {validationErrors.email && (
                    <div className='error-msg'>{validationErrors.email}</div>
                )}

                <div className='password-wrapper'>
                    <input
                        id='login-password'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Password'
                        className='modal-input'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type='button'
                        className='eye-btn'
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    </button>
                </div>
                {validationErrors.password && (
                    <div className='error-msg'>{validationErrors.password}</div>
                )}

                <div className='modal-options'>
                    <label className='remember'>
                        <input
                            type='checkbox'
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        Remember me
                    </label>
                    <button
                        type='button'
                        className='forgot-password'
                        onClick={handleForgotPassword}
                    >
                        Forgot Password?
                    </button>
                </div>

                <button type='submit' className='submit-btn' disabled={loading}>
                    {loading ? 'Logging in...' : 'LOGIN'}
                </button>

                <div className='separator'>or continue with</div>
                <div className='social-buttons'>
                    <button
                        type='button'
                        className='social-btn'
                        onClick={() => loginGoogle()}
                    >
                        <FcGoogle className='icon' />
                        Google
                    </button>
                </div>

                <p className='toggle-auth'>
                    Don’t have an Account?{' '}
                    <a href='#' className='link'>
                        Sign Up
                    </a>
                </p>
            </form>
        </div>
    )
}
