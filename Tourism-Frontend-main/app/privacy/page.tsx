import Link from 'next/link'
// Style
import '@/src/styles/pages/privacy/page.css'

export default function Page() {
    return (
        <div className='privacy-page'>
            <h1 className='privacy-heading'>Privacy Policy</h1>
            <p className='privacy-content'>
                At <strong>Al-Fairuz Travel</strong>, your privacy is our top
                priority. This policy explains how we collect, use, and protect
                your information when you interact with our services.
            </p>

            <section className='policy-section'>
                <h2 className='section-title'>Information We Collect</h2>
                <p className='section-content'>
                    We may collect details such as{' '}
                    <strong>
                        name, email, phone number, and booking information
                    </strong>{' '}
                    to provide and improve your travel experience.
                </p>
            </section>

            <section className='policy-section'>
                <h2 className='section-title'>How We Use Your Information</h2>
                <p className='section-content'>
                    Your data is used to <strong>confirm bookings</strong>,
                    provide travel assistance, personalize your journey, and
                    share important updates. <br />
                    <strong>We never sell your data</strong> to third parties.
                </p>
            </section>

            <section className='policy-section'>
                <h2 className='section-title'>Data Protection</h2>
                <p className='section-content'>
                    We apply strict <strong>security measures</strong> to keep
                    your data safe from unauthorized access, alteration, or
                    misuse.
                </p>
            </section>

            <section className='policy-section'>
                <h2 className='section-title'>Contact Us</h2>
                <p className='section-content'>
                    If you have questions about this Privacy Policy, please
                    reach out through our
                    <Link href='/contact' className='contact-link'>
                        {' '}
                        Contact Page
                    </Link>
                    .
                </p>
            </section>
        </div>
    )
}
