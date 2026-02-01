import { FaBus, FaHotel, FaPassport } from 'react-icons/fa'
// Style
import '@/src/styles/pages/about/page.css'

export default function Page() {
    return (
        <div className='about-page'>
            <h1 className='about-heading'>About Us</h1>
            <p className='about-content'>
                Al-Fairuz Travel is your gateway to exploring the world with
                ease, comfort, and excitement. We specialize in crafting
                seamless travel experiences across Egypt and beyond, tailored to
                every type of traveler — from families and couples to solo
                adventurers.
            </p>

            <section className='services-section'>
                <h2 className='section-title'>Our Services</h2>
                <div className='services-grid'>
                    {[
                        { icon: <FaHotel />, label: 'Hotel Reservations' },
                        { icon: <FaPassport />, label: 'Visa Assistance' },
                        { icon: <FaBus />, label: 'Transportation' },
                    ].map((service) => (
                        <div className='service-card' key={service.label}>
                            <div className='service-icon'>{service.icon}</div>
                            <span className='service-label'>
                                {service.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
