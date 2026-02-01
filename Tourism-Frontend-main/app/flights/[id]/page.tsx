'use client'

import dayjs from 'dayjs'
import {
    MdFlight,
    MdLocationOn,
    MdTimer,
    MdAirlines,
    MdAirplaneTicket,
} from 'react-icons/md'
import { use, useCallback, useContext, useEffect, useState } from 'react'
import {
    FaPlaneDeparture,
    FaPlaneArrival,
    FaDollarSign,
    FaMapPin,
    FaGlobeAfrica,
} from 'react-icons/fa'
// Context
import {
    AdminContext,
    AreAuthModalsOpenContext,
    UserContext,
} from '@/src/contexts/Contexts'
// Components
import BookingModal from '@/src/components/BookingRelated/BookingModal'
// Types
import { FlightPageParamsType } from '@/src/types/propsTypes'
import { FlightObject, LocationObject } from '@/src/types/objectsTypes'
// Functions
import { getDuration } from '@/src/utils/Functions'
// Styles
import '@/src/styles/pages/flights/[id]/page.css'

export default function Page({ params }: FlightPageParamsType) {
    // Get ID /flights/:id
    const { id } = use(params)
    // Contexts Functions
    const { isLoggedIn } = useContext(UserContext)
    const { getProductById, getLocationById, createBooking } =
        useContext(AdminContext)
    const { isLoginModalOpenState } = useContext(AreAuthModalsOpenContext)
    // States
    const [product, setProduct] = useState<FlightObject>()
    const [location, setLocation] = useState<LocationObject>()
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setIsLoginOpen] = isLoginModalOpenState

    const fetchProduct = useCallback(async () => {
        const data = await getProductById(id)
        setProduct(data as FlightObject)
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
        <div className='flight-page'>
            {/* Hero Section */}
            <section
                className='flight-hero'
                style={
                    details.img
                        ? { backgroundImage: `url(${details.img})` }
                        : {}
                }
            >
                <div className='overlay' />
                <div className='flight-hero-content'>
                    <div>
                        <h1 className='flight-title'>{product.name}</h1>
                        {location && (
                            <p className='flight-location'>
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
            <section className='flight-info'>
                {details.airline && (
                    <div className='info-item'>
                        <MdAirlines className='info-icon' />
                        <span className='info-text'>
                            Airline <strong>{details.airline}</strong>
                        </span>
                    </div>
                )}
                {details.flight_number && (
                    <div className='info-item'>
                        <MdFlight className='info-icon' />
                        <span className='info-text'>
                            Flight No. <strong>{details.flight_number}</strong>
                        </span>
                    </div>
                )}
                {details.departure_airport && (
                    <div className='info-item'>
                        <MdLocationOn className='info-icon' />
                        <span className='info-text'>
                            From <strong>{details.departure_airport}</strong>
                        </span>
                    </div>
                )}
                {details.arrival_airport && (
                    <div className='info-item'>
                        <MdLocationOn className='info-icon' />
                        <span className='info-text'>
                            To <strong>{details.arrival_airport}</strong>
                        </span>
                    </div>
                )}
                {details.departure_time && (
                    <div className='info-item'>
                        <FaPlaneDeparture className='info-icon' />
                        <span className='info-text'>
                            Departs{' '}
                            <strong>
                                {dayjs(details.departure_time).format(
                                    new Date(
                                        details.departure_time
                                    ).getFullYear() === new Date().getFullYear()
                                        ? 'DD MMM hh:mm A'
                                        : 'DD MMM YYYY hh:mm A'
                                )}
                            </strong>
                        </span>
                    </div>
                )}
                {details.arrival_time && (
                    <div className='info-item'>
                        <FaPlaneArrival className='info-icon' />
                        <span className='info-text'>
                            Arrives{' '}
                            <strong>
                                {dayjs(details.arrival_time).format(
                                    new Date(
                                        details.arrival_time
                                    ).getFullYear() === new Date().getFullYear()
                                        ? 'DD MMM hh:mm A'
                                        : 'DD MMM YYYY hh:mm A'
                                )}
                            </strong>
                        </span>
                    </div>
                )}
                {details.arrival_time && details.departure_time && (
                    <div className='info-item'>
                        <MdTimer className='info-icon' />
                        <span className='info-text'>
                            Duration{' '}
                            <strong>
                                {getDuration(
                                    details.arrival_time,
                                    details.departure_time
                                )}
                            </strong>
                        </span>
                    </div>
                )}
                {details.price_per_ticket && (
                    <div className='info-item'>
                        <FaDollarSign className='info-icon' />
                        <span className='info-text'>
                            <strong>{details.price_per_ticket} EGP</strong> /
                            Ticket
                        </span>
                    </div>
                )}
                {details.flight_type && (
                    <div className='info-item'>
                        <FaGlobeAfrica className='info-icon' />
                        <span className='info-text'>
                            Type <strong>{details.flight_type}</strong>
                        </span>
                    </div>
                )}
                {details.available_tickets && (
                    <div className='info-item'>
                        <MdAirplaneTicket className='info-icon' />
                        <span className='info-text'>
                            Available{' '}
                            <strong>{details.available_tickets} tickets</strong>
                        </span>
                    </div>
                )}
            </section>

            {/* Details Section */}
            {product.description && (
                <section className='flight-details'>
                    <div className='detail-group'>
                        <h2 className='section-title'>About</h2>
                        <p className='desc-text'>{product.description}</p>
                    </div>
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
