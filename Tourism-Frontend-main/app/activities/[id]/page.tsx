'use client'

import dayjs from 'dayjs'
import { MdAccessTimeFilled } from 'react-icons/md'
import { use, useCallback, useContext, useEffect, useState } from 'react'
import {
    FaClock,
    FaMapPin,
    FaDollarSign,
    FaBolt,
    FaCheckCircle,
} from 'react-icons/fa'
import { FaPersonSnowboarding } from 'react-icons/fa6'
// Contexts
import {
    AdminContext,
    AreAuthModalsOpenContext,
    UserContext,
} from '@/src/contexts/Contexts'
// Components
import BookingModal from '@/src/components/BookingRelated/BookingModal'
// Types
import { ActivityPageParamsType } from '@/src/types/propsTypes'
import { ActivityObject, LocationObject } from '@/src/types/objectsTypes'
// Style
import '@/src/styles/pages/activities/[id]/page.css'

export default function Page({ params }: ActivityPageParamsType) {
    // Get ID /activities/:id
    const { id } = use(params)
    // Contexts Functions
    const { isLoggedIn } = useContext(UserContext)
    const { getProductById, getLocationById, createBooking } =
        useContext(AdminContext)
    const { isLoginModalOpenState } = useContext(AreAuthModalsOpenContext)
    // States
    const [product, setProduct] = useState<ActivityObject>()
    const [location, setLocation] = useState<LocationObject>()
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setIsLoginOpen] = isLoginModalOpenState

    const fetchProduct = useCallback(async () => {
        const data = await getProductById(id)
        setProduct(data as ActivityObject)
    }, [getProductById, id])

    const fetchLocation = useCallback(async () => {
        if (product) {
            const data = await getLocationById(product.location_id)
            setLocation(data)
        }
    }, [getLocationById, product])

    useEffect(() => {
        fetchProduct().then()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        fetchLocation().then()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product])

    if (!product) {
        return <div className='p-6'>Loading...</div>
    }

    // Destructure for readability
    const { details } = product

    return (
        <div className='activity-page'>
            {/* Hero Section */}
            <section
                className='activity-hero'
                style={
                    details.img
                        ? { backgroundImage: `url(${details.img})` }
                        : {}
                }
            >
                <div className='overlay' />
                <div className='activity-hero-content'>
                    <div>
                        <h1 className='activity-title'>{product.name}</h1>
                        {location && (
                            <p className='activity-location'>
                                <FaMapPin className='location-icon' />
                                {location.name}
                            </p>
                        )}
                    </div>

                    {!product.is_active ? (
                        <p className='inactive-label'>
                            This {product.type.trim()} is currently inactive.
                        </p>
                    ) : isLoggedIn() ? (
                        <button
                            className='book-btn'
                            onClick={() => setIsBookingOpen(true)}
                        >
                            Book Now
                        </button>
                    ) : (
                        <p className='not-logged-in'>
                            <span onClick={() => setIsLoginOpen(true)}>
                                Login
                            </span>{' '}
                            to book this {product.type.trim()}.
                        </p>
                    )}
                </div>
            </section>

            {/* Info Section */}
            <section className='activity-info'>
                {details.duration_hours && (
                    <div className='info-item'>
                        <MdAccessTimeFilled className='info-icon' />
                        <span className='info-text'>
                            Duration{' '}
                            <strong>{details.duration_hours} hours</strong>
                        </span>
                    </div>
                )}
                {details.start_time && (
                    <div className='info-item'>
                        <FaClock className='info-icon' />
                        <span className='info-text'>
                            Starts at{' '}
                            <strong>
                                {' '}
                                {dayjs(details.start_time).format(
                                    new Date(
                                        details.start_time
                                    ).getFullYear() === new Date().getFullYear()
                                        ? 'DD MMM hh:mm A'
                                        : 'DD MMM YYYY hh:mm A'
                                )}
                            </strong>
                        </span>
                    </div>
                )}
                {details.price_per_person && (
                    <div className='info-item'>
                        <FaDollarSign className='info-icon' />
                        <span className='info-text'>
                            <strong>{details.price_per_person} EGP</strong> /
                            Person
                        </span>
                    </div>
                )}
                {details.difficulty_level && (
                    <div className='info-item'>
                        <FaBolt className='info-icon' />
                        <span className='info-text'>
                            Difficulty{' '}
                            <strong>{details.difficulty_level}</strong>
                        </span>
                    </div>
                )}
                {details.max_size && (
                    <div className='info-item'>
                        <FaPersonSnowboarding className='info-icon' />
                        <span className='info-text'>
                            Allowed <strong>{details.max_size} persons</strong>
                        </span>
                    </div>
                )}
            </section>

            {/* Details Section */}
            {(product.description || details.includes) && (
                <section className='activity-details'>
                    {product.description && (
                        <div className='detail-group'>
                            <h2 className='section-title'>About</h2>
                            <p className='desc-text'>{product.description}</p>
                        </div>
                    )}
                    {details.includes && (
                        <div className='detail-group'>
                            <h2 className='section-title'>Includes</h2>
                            <ul className='includes-list'>
                                {details.includes.map((item, idx) => (
                                    <li key={idx}>
                                        <FaCheckCircle className='include-icon' />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            )}

            {/* Booking Modal */}
            {isBookingOpen && (
                <BookingModal
                    type={product.type}
                    productId={product._id}
                    onCloseAction={() => setIsBookingOpen(false)}
                    onConfirmAction={async (data) => {
                        await createBooking(data)
                    }}
                />
            )}
        </div>
    )
}
