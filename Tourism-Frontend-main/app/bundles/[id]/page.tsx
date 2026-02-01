'use client'

import { use, useCallback, useContext, useEffect, useState } from 'react'
import Image from 'next/image'
// Context
import {
    AdminContext,
    AreAuthModalsOpenContext,
    UserContext,
} from '@/src/contexts/Contexts'
// Types
import {
    PopulatedBundleObject,
    LocationObject,
    ProductObject,
    HotelObject,
    ActivityObject,
    BusObject,
    FlightObject,
} from '@/src/types/objectsTypes'
import { BundlePageParamsType } from '@/src/types/propsTypes'
// Components
import HotelCard from '@/src/components/CardRelated/HotelCard'
import ActivityCard from '@/src/components/CardRelated/ActivityCard'
import BusCard from '@/src/components/CardRelated/BusCard'
import FlightCard from '@/src/components/CardRelated/FlightCard'
import BookingModal from '@/src/components/BookingRelated/BookingModal'
// Styles
import '@/src/styles/pages/bundles/[id]/page.css'

const TABS = [
    { id: 'hotels', label: 'Hotels' },
    { id: 'activities', label: 'Activities' },
    { id: 'buses', label: 'Buses' },
    { id: 'flights', label: 'Flights' },
]

export default function Page({ params }: BundlePageParamsType) {
    // Get ID /bundles/:id
    const { id } = use(params)
    // Contexts Functions
    const { isLoggedIn } = useContext(UserContext)
    const { getBundleById, getLocationById, createBooking } =
        useContext(AdminContext)
    const { isLoginModalOpenState } = useContext(AreAuthModalsOpenContext)
    // States
    const [bundle, setBundle] = useState<PopulatedBundleObject>()
    const [location, setLocation] = useState<LocationObject>()
    const [activeTab, setActiveTab] = useState<
        'hotels' | 'activities' | 'buses' | 'flights'
    >('hotels')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setIsLoginOpen] = isLoginModalOpenState
    const [isBookingOpen, setIsBookingOpen] = useState(false)

    const fetchData = useCallback(async () => {
        const data = (await getBundleById(id)) as PopulatedBundleObject
        if (data) {
            setBundle(data)
            const loc = await getLocationById(data.location_id)
            setLocation(loc)
        }
    }, [getBundleById, getLocationById, id])

    useEffect(() => {
        fetchData().then()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!bundle) {
        return <p className='p-6'>Loading...</p>
    }

    // Products filters for each tab
    const products = bundle.product_ids as ProductObject[]
    const hotelsData = products.filter((p) => p.type === 'hotel')
    const activitiesData = products.filter((p) => p.type === 'activity')
    const busesData = products.filter((p) => p.type === 'bus')
    const flightsData = products.filter((p) => p.type === 'flight')

    // If tab has no products
    const renderNoProducts = (label: string) => (
        <p className='no-products'>No {label} found in this bundle</p>
    )

    return (
        <div className='bundle-page'>
            {/* Hero Section */}
            <section className='bundle-hero'>
                <div className='overlay' />
                <div className='bundle-hero-content'>
                    <div>
                        <h1 className='bundle-title'>{bundle.name}</h1>
                        <p className='bundle-desc'>{bundle.description}</p>
                    </div>
                    <div className='bundle-action'>
                        <div className='bundle-price'>
                            <strong>{bundle.price} EGP</strong>{' '}
                            <span className='price-unit'>/ Bundle</span>
                        </div>

                        {!bundle.is_active ? (
                            <p className='inactive-label'>
                                This bundle is currently inactive.
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
                                to book this bundle.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Location Info */}
            {location && (
                <section className='bundle-location'>
                    <div className='location-text'>
                        <h2 className='section-heading'>
                            Location for this bundle
                        </h2>
                        <p className='location-note'>
                            This bundle is designed for travelers visiting{' '}
                            <span className='highlight'>{location.name}</span>.
                            Below, you’ll find all included services and
                            products available in this destination.
                        </p>
                        <h3 className='location-title'>{location.name}</h3>
                        <p className='location-desc'>{location.description}</p>
                    </div>
                    <Image
                        src={location.heroImage}
                        alt={location.name}
                        width={300}
                        height={200}
                        className='location-img'
                    />
                </section>
            )}

            {/* Products Tabs */}
            <section className='bundle-products'>
                <h2 className='section-heading'>What’s included</h2>
                <div className='tabs-header'>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() =>
                                setActiveTab(tab.id as typeof activeTab)
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className='tabs-content'>
                    {activeTab === 'hotels' &&
                        (hotelsData.length > 0 ? (
                            <div className='cards-grid'>
                                {hotelsData.map((hotel) => (
                                    <HotelCard
                                        key={hotel._id}
                                        hotel={hotel as HotelObject}
                                    />
                                ))}
                            </div>
                        ) : (
                            renderNoProducts('hotels')
                        ))}

                    {activeTab === 'activities' &&
                        (activitiesData.length > 0 ? (
                            <div className='cards-grid'>
                                {activitiesData.map((activity) => (
                                    <ActivityCard
                                        key={activity._id}
                                        activity={activity as ActivityObject}
                                    />
                                ))}
                            </div>
                        ) : (
                            renderNoProducts('activities')
                        ))}

                    {activeTab === 'buses' &&
                        (busesData.length > 0 ? (
                            <div className='cards-grid'>
                                {busesData.map((bus) => (
                                    <BusCard
                                        key={bus._id}
                                        bus={bus as BusObject}
                                    />
                                ))}
                            </div>
                        ) : (
                            renderNoProducts('buses')
                        ))}

                    {activeTab === 'flights' &&
                        (flightsData.length > 0 ? (
                            <div className='cards-grid'>
                                {flightsData.map((flight) => (
                                    <FlightCard
                                        key={flight._id}
                                        flight={flight as FlightObject}
                                    />
                                ))}
                            </div>
                        ) : (
                            renderNoProducts('flights')
                        ))}
                </div>
            </section>

            {isBookingOpen && (
                <BookingModal
                    type='bundle'
                    productId={bundle._id}
                    onCloseAction={() => setIsBookingOpen(false)}
                    onConfirmAction={async (data) => {
                        await createBooking(data)
                    }}
                />
            )}
        </div>
    )
}
