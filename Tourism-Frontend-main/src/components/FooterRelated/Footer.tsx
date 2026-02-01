'use client'

import Link from 'next/link'
import {
    FaGift,
    FaGlobeAfrica,
    FaChevronDown,
    FaFacebookF,
    FaInstagram,
} from 'react-icons/fa'
import { useContext } from 'react'
// Components
import Container from '@/src/components/ContainerRelated/Container'
// Contexts
import { UserContext } from '@/src/contexts/Contexts'
// Style
import '@/src/styles/components/FooterRelated/Footer.css'

export default function Footer() {
    const { isLoggedIn, isAdmin, isEmployee } = useContext(UserContext)

    // Static data for footer
    const footerData = {
        voucher: {
            heading: 'Get a free travel voucher!',
            description:
                'Enter your phone number and we’ll send you an exclusive discount.',
            inputPlaceholder: 'Your phone number',
            buttonLabel: 'Claim Now',
        },
        contact: {
            phoneNumbers: ['02737788988', '02737788988'],
            email: 'shjdh@shhjjx.com',
            social: [
                { href: 'https://www.facebook.com/', icon: <FaFacebookF /> },
                { href: 'https://instagram.com/', icon: <FaInstagram /> },
            ],
        },
        quickLinks: [
            ...(isLoggedIn()
                ? isAdmin() || isEmployee()
                    ? [{ label: 'Dashboard', href: '/dashboard' }]
                    : [{ label: 'Account', href: '/profile' }]
                : []),
            { label: 'Contact', href: '/contact' },
            { label: 'About Us', href: '/about' },
            { label: 'Privacy Policy', href: '/privacy' },
        ],
    }

    return (
        <footer>
            <Container>
                <div className='footer-grid'>
                    {/* Voucher Section */}
                    <div className='voucher-section'>
                        <p className='voucher-heading'>
                            {footerData.voucher.heading}
                        </p>
                        <p className='voucher-description'>
                            {footerData.voucher.description}
                        </p>
                        <div className='voucher-input-wrapper'>
                            <FaGift className='voucher-icon' />
                            <input
                                type='text'
                                name='phone_number'
                                placeholder={
                                    footerData.voucher.inputPlaceholder
                                }
                                className='voucher-input'
                            />
                            <button className='voucher-button'>
                                {footerData.voucher.buttonLabel}
                            </button>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className='footer-col'>
                        <h3 className='footer-heading'>Contact Us</h3>
                        <div className='contact-group'>
                            <p className='footer-text-bolder'>Call Us</p>
                            {footerData.contact.phoneNumbers.map((phone, i) => (
                                <p className='footer-text' key={i}>
                                    {phone}
                                </p>
                            ))}
                        </div>
                        <div className='contact-group'>
                            <p className='footer-text-bolder'>Email</p>
                            <p className='footer-text'>
                                {footerData.contact.email}
                            </p>
                        </div>
                        <div className='contact-group'>
                            <p className='footer-text-bolder'>Social Media</p>
                            <div className='social-icons'>
                                {footerData.contact.social.map((link, i) => (
                                    <Link
                                        href={link.href}
                                        target='_blank'
                                        key={i}
                                    >
                                        {link.icon}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className='footer-col'>
                        <h3 className='footer-heading'>Quick Links</h3>
                        <div className='footer-links-list'>
                            {footerData.quickLinks.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.href}
                                    className='footer-link'
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Floating Country Button */}
                <div className='country-button-fixed'>
                    <button className='country-button'>
                        <FaGlobeAfrica className='country-icon' />
                        <FaChevronDown className='arrow-icon' />
                    </button>
                </div>
            </Container>
        </footer>
    )
}
