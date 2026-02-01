'use client'

import {
    FaBed,
    FaDoorOpen,
    FaDollarSign,
    FaConciergeBell,
    FaMapPin,
    FaCheckCircle,
    FaTimesCircle,
    FaUsers,
} from 'react-icons/fa'
import { use, useCallback, useContext, useEffect, useState } from 'react'
// Functions
import { capitalizeWords, renderStars } from '@/src/utils/Functions'
// Context
import {
    AdminContext,
    AreAuthModalsOpenContext,
    UserContext,
} from '@/src/contexts/Contexts'
// Components
import ReviewCard from '@/src/components/CardRelated/ReviewCard'
import BookingModal from '@/src/components/BookingRelated/BookingModal'
// Types
import { HotelObject, LocationObject } from '@/src/types/objectsTypes'
import { HotelPageParamsType } from '@/src/types/propsTypes'
// Styles
import '@/src/styles/pages/hotels/[id]/page.css'

export default function Page({ params }: HotelPageParamsType) {
    // Get ID /hotels/:id
    const { id } = use(params)
    // Contexts Functions
    const { isLoggedIn } = useContext(UserContext)
    const { getProductById, getLocationById, createBooking } =
        useContext(AdminContext)
    const { isLoginModalOpenState } = useContext(AreAuthModalsOpenContext)
    // States
    const [product, setProduct] = useState<HotelObject>()
    const [location, setLocation] = useState<LocationObject>()
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setIsLoginOpen] = isLoginModalOpenState

    const fetchProduct = useCallback(async () => {
        const data = await getProductById(id)
        setProduct(data as HotelObject)
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
        <div className='hotel-page'>
            {/* Hero Section */}
            <section
                className='hotel-hero'
                style={
                    details.img
                        ? { backgroundImage: `url(${details.img})` }
                        : {}
                }
            >
                <div className='overlay' />
                <div className='hotel-hero-content'>
                    <div>
                        <h1 className='hotel-title'>{product.name}</h1>

                        {/* Rating */}
                        {details.rating && (
                            <div className='hotel-rating'>
                                {renderStars(Number(details.rating))}
                            </div>
                        )}

                        {location && (
                            <p className='hotel-location'>
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
            <section className='hotel-info'>
                {details.room_types && details.room_types.length > 0 && (
                    <div className='info-item'>
                        <FaBed className='info-icon' />
                        <span className='info-text'>
                            Types{' '}
                            <strong>
                                {details.room_types
                                    .map((type) => capitalizeWords(type))
                                    .join(', ')}
                            </strong>
                        </span>
                    </div>
                )}
                {details.available_rooms && (
                    <div className='info-item'>
                        <FaDoorOpen className='info-icon' />
                        <span className='info-text'>
                            Available{' '}
                            <strong>
                                {Object.values(details.available_rooms).reduce(
                                    (sum, val) => sum + val,
                                    0
                                )}{' '}
                                Rooms
                            </strong>
                        </span>
                    </div>
                )}
                {details.prices_per_night && (
                    <div className='info-item'>
                        <FaDollarSign className='info-icon' />
                        {(() => {
                            const firstPrice = Object.entries(
                                details.prices_per_night
                            ).find(([, value]) => value > 0)
                            return firstPrice ? (
                                <span className='info-text'>
                                    <strong>{firstPrice[1]} EGP</strong> / Night
                                    ({capitalizeWords(firstPrice[0])})
                                </span>
                            ) : (
                                <span className='info-text'>Not available</span>
                            )
                        })()}
                    </div>
                )}
                {details.for_children !== undefined && (
                    <div className='info-item'>
                        <FaUsers className='info-icon' />
                        <span className='info-text'>
                            <strong>
                                {details.for_children
                                    ? 'Children Allowed'
                                    : 'No Children'}
                            </strong>
                        </span>
                    </div>
                )}
            </section>

            {/* Details Section */}
            <section className='hotel-details'>
                {product.description && (
                    <div className='detail-group'>
                        <h2 className='section-title'>About</h2>
                        <p className='desc-text'>{product.description}</p>
                    </div>
                )}

                {/* Pros */}
                {details.pros && details.pros.length > 0 && (
                    <div className='detail-group'>
                        <h2 className='section-title'>Pros</h2>
                        <ul className='amenities-list'>
                            {details.pros.map((item, index) => (
                                <li key={index}>
                                    <FaCheckCircle className='amenity-icon' />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Cons */}
                {details.cons && details.cons.length > 0 && (
                    <div className='detail-group'>
                        <h2 className='section-title'>Cons</h2>
                        <ul className='amenities-list'>
                            {details.cons.map((item, index) => (
                                <li key={index}>
                                    <FaTimesCircle className='amenity-icon' />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Policy */}
                {details.policy && (
                    <div className='detail-group'>
                        <h2 className='section-title'>Policy</h2>
                        <p className='desc-text'>{details.policy}</p>
                    </div>
                )}

                {/* Prices Section */}
                {details.prices_per_night && (
                    <div className='detail-group'>
                        <h2 className='section-title'>Prices per Night</h2>
                        <ul className='available-rooms-list'>
                            {Object.entries(details.prices_per_night).map(
                                ([type, price]) => (
                                    <li
                                        key={type}
                                        className='flex items-center gap-2'
                                    >
                                        {price > 0 ? (
                                            <>
                                                <FaCheckCircle className='text-green-600' />
                                                <span>
                                                    <strong>{price} EGP</strong>{' '}
                                                    / Night (
                                                    {capitalizeWords(type)})
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <FaTimesCircle className='text-red-500' />
                                                <span>
                                                    No price set for{' '}
                                                    {capitalizeWords(type)}
                                                </span>
                                            </>
                                        )}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                )}

                {/* Available Rooms */}
                {details.available_rooms && (
                    <div className='detail-group'>
                        <h2 className='section-title'>Available Rooms</h2>
                        <ul className='available-rooms-list'>
                            {Object.entries(details.available_rooms).map(
                                ([type, count]) => (
                                    <li
                                        key={type}
                                        className='flex items-center gap-2'
                                    >
                                        {count > 0 ? (
                                            <>
                                                <FaCheckCircle className='text-green-600' />
                                                <span>
                                                    {count}{' '}
                                                    {capitalizeWords(type)} room
                                                    {count > 1 && 's'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <FaTimesCircle className='text-red-500' />
                                                <span>
                                                    No {capitalizeWords(type)}{' '}
                                                    rooms
                                                </span>
                                            </>
                                        )}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                )}

                {/* Amenities per Room Type */}
                {details.amenities_per_type &&
                    Object.keys(details.amenities_per_type).length > 0 && (
                        <div className='detail-group'>
                            <h2 className='section-title'>Amenities</h2>
                            {Object.entries(details.amenities_per_type).map(
                                ([type, list]) =>
                                    list.length > 0 && (
                                        <div key={type}>
                                            <h3 className='font-semibold text-c2 mb-1 mt-4'>
                                                {capitalizeWords(type)}
                                            </h3>
                                            <ul className='amenities-list'>
                                                {list.map((amenity, i) => (
                                                    <li key={i}>
                                                        <FaConciergeBell className='amenity-icon' />
                                                        {amenity}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                            )}
                        </div>
                    )}

                {/* Reviews Section */}
                {details.reviews && details.reviews.length > 0 && (
                    <section className='reviews-section'>
                        <h2 className='reviews-title'>Guest Reviews</h2>
                        <div className='reviews-grid'>
                            {details.reviews.map((review, i) => (
                                <ReviewCard review={review} key={i} />
                            ))}
                        </div>
                    </section>
                )}
            </section>

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
