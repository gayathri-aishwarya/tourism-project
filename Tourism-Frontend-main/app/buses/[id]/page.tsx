'use client'

import dayjs from 'dayjs'
import {
    FaClock,
    FaDollarSign,
    FaWifi,
    FaBusAlt,
    FaMapPin,
} from 'react-icons/fa'
import { MdLocationOn } from 'react-icons/md'
import { use, useCallback, useContext, useEffect, useState } from 'react'
// Components
import BusSeats from '@/src/components/OtherRelated/BusSeats'
import BookingModal from '@/src/components/BookingRelated/BookingModal'
// Contexts
import {
    AdminContext,
    AreAuthModalsOpenContext,
    UserContext,
} from '@/src/contexts/Contexts'
// Functions
import { seatsStringToObject } from '@/src/utils/Functions'
// Types
import {
    BusObject,
    BusSeatsLayout,
    LocationObject,
} from '@/src/types/objectsTypes'
import { BusPageParamsType } from '@/src/types/propsTypes'
// Style
import '@/src/styles/pages/buses/[id]/page.css'

export default function Page({ params }: BusPageParamsType) {
    // Get ID /buses/:id
    const { id } = use(params)
    // Contexts Functions
    const { isLoggedIn } = useContext(UserContext)
    const { getProductById, getLocationById, createBooking } =
        useContext(AdminContext)
    const { isLoginModalOpenState } = useContext(AreAuthModalsOpenContext)
    // States
    const [product, setProduct] = useState<BusObject>()
    const [location, setLocation] = useState<LocationObject>()
    const [busSeats, setBusSeats] = useState<BusSeatsLayout>({
        rows: [
            {
                left: [],
                right: [],
            },
        ],
    })
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const [selectedSeats, setSelectedSeats] = useState<number[]>([])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setIsLoginOpen] = isLoginModalOpenState

    const fetchProduct = useCallback(async () => {
        const data = await getProductById(id)
        setProduct(data as BusObject)
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
        if (product) setBusSeats(seatsStringToObject(product.details.bus_seats))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product])

    // Destructure for readability
    if (!product) {
        return <div className='p-6'>Loading...</div>
    }

    const { details } = product

    return (
        <div className='bus-page'>
            {/* Hero Section */}
            <section
                className='bus-hero'
                style={
                    details.img
                        ? { backgroundImage: `url(${details.img})` }
                        : {}
                }
            >
                <div className='overlay' />
                <div className='bus-hero-content'>
                    <div>
                        <h1 className='bus-title'>{product.name}</h1>
                        {location && (
                            <p className='bus-location'>
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
            <section className='bus-info'>
                {details.from_location && (
                    <div className='info-item'>
                        <MdLocationOn className='info-icon' />
                        <span className='info-text'>
                            From <strong>{details.from_location}</strong>
                        </span>
                    </div>
                )}
                {details.to_location && (
                    <div className='info-item'>
                        <MdLocationOn className='info-icon' />
                        <span className='info-text'>
                            To <strong>{details.to_location}</strong>
                        </span>
                    </div>
                )}
                {details.departure_time && (
                    <div className='info-item'>
                        <FaClock className='info-icon' />
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
                        <FaClock className='info-icon' />
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
                {details.bus_model && (
                    <div className='info-item'>
                        <FaBusAlt className='info-icon' />
                        <span className='info-text'>
                            Model <strong>{details.bus_model}</strong>
                        </span>
                    </div>
                )}
                {details.wifi_available !== undefined && (
                    <div className='info-item'>
                        <FaWifi className='info-icon' />
                        <span className='info-text'>
                            <strong>
                                {details.wifi_available
                                    ? 'Wi-Fi Available'
                                    : 'No Wi-Fi'}
                            </strong>
                        </span>
                    </div>
                )}
                {details.price_per_seat && (
                    <div className='info-item'>
                        <FaDollarSign className='info-icon' />
                        <span className='info-text'>
                            <strong>{details.price_per_seat} EGP</strong> / Seat
                        </span>
                    </div>
                )}
            </section>

            {/* Details Section */}
            {(product.description ||
                details.available_times ||
                details.bus_seats) && (
                <section className='bus-details'>
                    {product.description && (
                        <div className='detail-group'>
                            <h2 className='section-title'>About</h2>
                            <p className='desc-text'>{product.description}</p>
                        </div>
                    )}
                    {details.available_times && (
                        <div className='detail-group'>
                            <h2 className='section-title'>Available Times</h2>
                            <ul>
                                {details.available_times.map((time, index) => (
                                    <li key={index}>
                                        <FaClock className='info-icon' />
                                        <p className='desc-text'>
                                            {new Date().getFullYear() ===
                                            new Date(time).getFullYear()
                                                ? dayjs(time).format(
                                                      'hh:mm A, DD MMM'
                                                  )
                                                : dayjs(time).format(
                                                      'hh:mm A, DD MMM YYYY'
                                                  )}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {details.bus_seats && (
                        <div className='detail-group'>
                            <h2 className='section-title'>Seats</h2>
                            <BusSeats
                                layout={busSeats}
                                onSelect={setSelectedSeats}
                                selectedSeats={selectedSeats}
                            />
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
                    busSeats={selectedSeats}
                    onConfirmAction={async (data) => {
                        await createBooking(data)
                        await fetchProduct()
                        setSelectedSeats([])
                    }}
                />
            )}
        </div>
    )
}
