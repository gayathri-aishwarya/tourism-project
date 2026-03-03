// src/components/NavRelated/Nav.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useContext } from 'react'
import {
    FaUserCircle,
    FaHome,
    FaInfoCircle,
    FaBoxOpen,
    FaMapMarkerAlt,
    FaBus,
    FaSignOutAlt,
} from 'react-icons/fa'
// Contexts
import { AreAuthModalsOpenContext, UserContext } from '@/src/contexts/Contexts'
// Components
import Container from '@/src/components/ContainerRelated/Container'
import LoginModal from '@/src/components/AuthRelated/LoginModal'
import SignUpModal from '@/src/components/AuthRelated/SignupModal'

// Functions
import { capitalizeWords } from '@/src/utils/Functions'
// Style
import '@/src/styles/components/NavRelated/Nav.css'

export default function Nav() {
    const pathname = usePathname()
    // Contexts Functions
    const { user, isAdmin, isEmployee, logout } = useContext(UserContext)
    const { isLoginModalOpenState, isSignUpModalOpenState } = useContext(
        AreAuthModalsOpenContext
    )
    // States
    const [isLoginOpen, setIsLoginOpen] = isLoginModalOpenState
    const [isSignUpOpen, setIsSignUpOpen] = isSignUpModalOpenState

    // Static data for nav - ADDED BUSES LINK HERE
    const navData = {
        logo: {
            homeHref: '/',
            noWords: '/assets/logos/logo-no-words.svg',
            wordsOnly: '/assets/logos/logo-words-only.png',
            noWordsWidth: 60,
            noWordsHeight: 86,
            wordsOnlyWidth: 200,
            wordsOnlyHeight: 200,
            alt: 'Al-Fairuz',
        },
        links: [
            { href: '/', label: 'Home', icon: <FaHome /> },
            { href: '/about', label: 'About', icon: <FaInfoCircle /> },
            { href: '/bundles', label: 'Bundles', icon: <FaBoxOpen /> },
            { href: '/locations', label: 'Locations', icon: <FaMapMarkerAlt /> },
            { href: '/buses', label: 'Buses', icon: <FaBus /> }, // ADDED THIS LINE
        ],
    }

    return (
        <nav>
            <Container>
                <div className='left'>
                    <Link href={navData.logo.homeHref} className='go-to-home'>
                        <div className='logo-only-wrapper'>
                            <Image
                                width={navData.logo.noWordsWidth}
                                height={navData.logo.noWordsHeight}
                                src={navData.logo.noWords}
                                priority={true}
                                alt='Logo'
                            />
                        </div>
                        <div className='logo-words-wrapper'>
                            <Image
                                width={navData.logo.wordsOnlyWidth}
                                height={navData.logo.wordsOnlyHeight}
                                src={navData.logo.wordsOnly}
                                alt={navData.logo.alt}
                            />
                        </div>
                    </Link>
                </div>

                <div className='mid'>
                    {navData.links.map((link) => (
                        <Link
                            href={link.href}
                            key={link.href}
                            className={`nav-button-mid ${
                                pathname === link.href ? 'active-link' : ''
                            }`}
                        >
                            <span className='nav-icon'>{link.icon}</span>
                            <p>{link.label}</p>
                        </Link>
                    ))}
                </div>

                <div className='right'>
                    {user ? (
                        <>
                            {isAdmin() || isEmployee() ? (
                                <Link
                                    href='/dashboard'
                                    className='nav-user-btn'
                                >
                                    <FaUserCircle className='nav-user-icon' />
                                    <span className='nav-user-name'>
                                        {capitalizeWords(user.firstName)} - Go
                                        To Dashboard
                                    </span>
                                </Link>
                            ) : (
                                <Link href='/profile' className='nav-user-btn'>
                                    {user.profileImage ? (
                                        <Image
                                            width={40}
                                            height={40}
                                            src={user.profileImage}
                                            alt={user.firstName}
                                            className='nav-user-icon'
                                        />
                                    ) : (
                                        <FaUserCircle className='nav-user-icon' />
                                    )}

                                    <span className='nav-user-name'>
                                        {capitalizeWords(user.firstName)}
                                    </span>
                                </Link>
                            )}
                            <button
                                className='nav-logout-btn'
                                onClick={() => logout()}
                                aria-label='Logout'
                            >
                                <FaSignOutAlt />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className='nav-login-btn'
                                onClick={() => setIsLoginOpen(true)}
                            >
                                Login
                            </button>
                            <button
                                className='nav-signup-btn secondary-link'
                                onClick={() => setIsSignUpOpen(true)}
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </div>

                {isLoginOpen && (
                    <LoginModal onCloseAction={() => setIsLoginOpen(false)} />
                )}
                {isSignUpOpen && (
                    <SignUpModal onCloseAction={() => setIsSignUpOpen(false)} />
                )}
            </Container>
        </nav>
    )
}