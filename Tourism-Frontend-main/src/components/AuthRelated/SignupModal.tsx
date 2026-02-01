import * as Yup from 'yup'
import { FiX } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { useContext, useEffect, useState, FormEvent } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
// Contexts
import { UserContext } from '@/src/contexts/Contexts'
// Types
import { ModalsProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/AuthRelated/Modal.css'

export default function SignupModal({ onCloseAction }: ModalsProps) {
    const { signup, loginGoogle, isLoggedIn } = useContext(UserContext)

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({})

    const schema = Yup.object().shape({
        firstName: Yup.string().required('First name is required'),
        lastName: Yup.string().required('Last name is required'),
        phone: Yup.string().required('Phone number is required'),
        email: Yup.string()
            .email('Invalid email')
            .required('Email is required'),
        password: Yup.string()
            .min(6, 'Password must be at least 6 characters')
            .required('Password is required'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password')], 'Passwords must match')
            .required('Confirm password is required'),
    })

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setValidationErrors({})

        try {
            await schema.validate(
                {
                    firstName,
                    lastName,
                    phone,
                    email,
                    password,
                    confirmPassword,
                },
                { abortEarly: false }
            )

            setLoading(true)
            await signup({ firstName, lastName, phone, email, password })
                .catch((err) => setError(err))
                .finally(() => setLoading(false))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (validationErr: any) {
            const errors: Record<string, string> = {}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <h2 className='modal-title'>Sign Up</h2>
                {error && <div className='error-msg'>{error}</div>}

                <div className='name-fields'>
                    <input
                        id='signup-firstName'
                        type='text'
                        placeholder='First Name'
                        className='modal-input'
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <input
                        id='signup-lastName'
                        type='text'
                        placeholder='Last Name'
                        className='modal-input'
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
                {validationErrors.firstName && (
                    <div className='error-msg'>
                        {validationErrors.firstName}
                    </div>
                )}
                {validationErrors.lastName && (
                    <div className='error-msg'>{validationErrors.lastName}</div>
                )}

                <input
                    id='signup-phone'
                    type='text'
                    placeholder='Phone Number'
                    className='modal-input'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />
                {validationErrors.phone && (
                    <div className='error-msg'>{validationErrors.phone}</div>
                )}

                <input
                    id='signup-email'
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
                        id='signup-password'
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
                        {showPassword ? (
                            <AiOutlineEyeInvisible />
                        ) : (
                            <AiOutlineEye />
                        )}
                    </button>
                </div>
                {validationErrors.password && (
                    <div className='error-msg'>{validationErrors.password}</div>
                )}

                <div className='password-wrapper'>
                    <input
                        id='signup-confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='Confirm Password'
                        className='modal-input'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                        type='button'
                        className='eye-btn'
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                    >
                        {showConfirmPassword ? (
                            <AiOutlineEyeInvisible />
                        ) : (
                            <AiOutlineEye />
                        )}
                    </button>
                </div>
                {validationErrors.confirmPassword && (
                    <div className='error-msg'>
                        {validationErrors.confirmPassword}
                    </div>
                )}

                <button type='submit' className='submit-btn' disabled={loading}>
                    {loading ? 'Signing up...' : 'SIGN UP'}
                </button>

                <div className='separator'>or create account with</div>
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
                    Already have an Account?{' '}
                    <a href='#' className='link'>
                        Log In
                    </a>
                </p>
            </form>
        </div>
    )
}
