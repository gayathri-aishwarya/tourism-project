// Style
import '@/src/styles/pages/contact/page.css'

export default function Page() {
    return (
        <div className='contact-page'>
            <h1 className='contact-heading'>Contact Us</h1>
            <p className='contact-content'>
                We’re here to help! Reach out to us through any of the following
                ways:
            </p>

            <section className='contact-section'>
                <h2 className='section-title'>Our Office</h2>
                <p className='section-content'>
                    <strong>Al-Fairuz Travel</strong> <br />
                    123 Main Street, Cairo, Egypt
                </p>
            </section>

            <section className='contact-section'>
                <h2 className='section-title'>Phone</h2>
                <p className='section-content'>
                    Call us at <strong>+20 123 456 7890</strong>
                </p>
            </section>

            <section className='contact-section'>
                <h2 className='section-title'>Email</h2>
                <p className='section-content'>
                    Write to us at <strong>support@alfairuztravel.com</strong>
                </p>
            </section>

            <section className='contact-section'>
                <h2 className='section-title'>Business Hours</h2>
                <p className='section-content'>
                    <strong>Sunday – Thursday:</strong> 9:00 AM – 6:00 PM <br />
                    <strong>Friday – Saturday:</strong> Closed
                </p>
            </section>
        </div>
    )
}
