'use client'

import { FaHotel, FaPassport, FaBus } from 'react-icons/fa'
import { useCallback, useContext, useEffect, useState } from 'react'
// Components
import LocationCard from '@/src/components/CardRelated/LocationCard'
import HotelCard from '@/src/components/CardRelated/HotelCard'
import ReviewCard from '@/src/components/CardRelated/ReviewCard'
import SearchInput from '@/src/components/InputRelated/SearchInput'
import BundleCard from '@/src/components/CardRelated/BundleCard'
// Style
import '@/src/styles/pages/page.css'
import { AdminContext } from '@/src/contexts/Contexts'
import {
    HotelObject,
    LocationObject,
    PopulatedBundleObject,
} from '@/src/types/objectsTypes'

export default function Page() {
    // Contexts Functions
    const { getLocations, getProducts, getBundles } = useContext(AdminContext)
    // States
    const [hotels, setHotels] = useState<HotelObject[]>([])
    const [locations, setLocations] = useState<LocationObject[]>([])
    const [bundles, setBundles] = useState<PopulatedBundleObject[]>([])

    const fetchLocations = useCallback(async () => {
        const data = await getLocations()
        setLocations(data.slice(0, 6) || [])
    }, [getLocations])

    const fetchBestsellers = useCallback(async () => {
        const data = await getProducts()
        setHotels(
            data.items
                .filter((product) => product.type === 'hotel')
                .slice(0, 3) as HotelObject[]
        )
    }, [getProducts])

    const fetchBundles = useCallback(async () => {
        const data = await getBundles()
        setBundles((data || []).slice(0, 3))
    }, [getBundles])

    useEffect(() => {
        fetchLocations().then()
        fetchBestsellers().then()
        fetchBundles().then()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!hotels || !locations || !bundles) {
        return <div className='p-6'>Loading...</div>
    }

    // Static data for home page
    const homeData = {
        hero: {
            title: 'Your next journey starts here',
            subtitle: 'We plan every detail, so you can just enjoy the journey',
        },
        bestLocations: {
            title: 'Best Locations',
            subtitle: 'Choose your favorite location',
        },
        services: {
            title: 'Our Services',
            items: [
                { icon: <FaHotel />, label: 'Hotel Reservations' },
                { icon: <FaPassport />, label: 'Visa Assistance' },
                { icon: <FaBus />, label: 'Transportation' },
            ],
        },
        bestsellerHotels: {
            title: 'Bestseller Hotels',
            subtitle: 'Choose from our Bestseller Hotels',
        },
        bestsellerBundles: {
            title: 'Bestseller Bundles',
            subtitle: 'Hand-picked travel bundles just for you',
        },
        customerReviews: {
            title: 'Customer Reviews',
            reviews: [
                {
                    name: 'Mohamed',
                    rating: 4.5,
                    text: 'Office ipsum you must be muted. Running solutions helicopter mindfulness pollination.',
                },
                {
                    name: 'Sarah',
                    rating: 4.8,
                    text: 'An amazing trip! Everything was perfectly organized from start to finish.',
                },
                {
                    name: 'James',
                    rating: 4.6,
                    text: 'Highly recommend! Great service and unforgettable experiences.',
                },
            ],
        },
    }

    return (
        <div className='home-page'>
            {/* Hero Section */}
            <section
                className='hero-section'
                style={{
                    backgroundImage: `url(/assets/images/home/hero.jpg)`,
                }}
            >
                <div className='home-hero-content'>
                    <h1 className='hero-title'>{homeData.hero.title}</h1>
                    <p className='hero-subtitle'>{homeData.hero.subtitle}</p>

                    <SearchInput />

                    <button className='program-btn'>Make a Program</button>
                </div>
            </section>

            {/* Locations Section */}
            <section className='locations-section'>
                <h2 className='section-title'>
                    {homeData.bestLocations.title}
                </h2>
                <p className='section-subtitle'>
                    {homeData.bestLocations.subtitle}
                </p>
                {locations.length > 0 ? (
                    <div className='locations-grid'>
                        {locations.map((location) => (
                            <LocationCard
                                location={location}
                                key={location._id}
                            />
                        ))}
                    </div>
                ) : (
                    <p className='not-found-text'>No locations found.</p>
                )}
            </section>

            {/* Services Section */}
            <section className='services-section'>
                <h2 className='section-title'>{homeData.services.title}</h2>
                <div className='services-grid'>
                    {homeData.services.items.map((service) => (
                        <div className='service-card' key={service.label}>
                            <div className='service-icon'>{service.icon}</div>
                            <span className='service-label'>
                                {service.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bestseller Hotels Section */}
            <section className='bestseller-section'>
                <h2 className='section-title'>
                    {homeData.bestsellerHotels.title}
                </h2>
                <p className='section-subtitle'>
                    {homeData.bestsellerHotels.subtitle}
                </p>
                {hotels.length > 0 ? (
                    <div className='bestseller-grid'>
                        {hotels.map((hotel, i) => (
                            <HotelCard hotel={hotel} key={i} />
                        ))}
                    </div>
                ) : (
                    <p className='not-found-text'>No hotels found.</p>
                )}
            </section>

            {/* Bestseller Bundles Section */}
            <section className='bestseller-section'>
                <h2 className='section-title'>
                    {homeData.bestsellerBundles.title}
                </h2>
                <p className='section-subtitle'>
                    {homeData.bestsellerBundles.subtitle}
                </p>
                {bundles.length > 0 ? (
                    <div className='bestseller-grid'>
                        {bundles.map((bundle) => (
                            <BundleCard bundle={bundle} key={bundle._id} />
                        ))}
                    </div>
                ) : (
                    <p className='not-found-text'>No bundles found.</p>
                )}
            </section>

            {/* Reviews Section */}
            <section className='reviews-section'>
                <h2 className='section-title pb-4'>
                    {homeData.customerReviews.title}
                </h2>
                <div className='reviews-grid'>
                    {homeData.customerReviews.reviews.map((review, i) => (
                        <ReviewCard review={review} key={i} />
                    ))}
                </div>
            </section>
        </div>
    )
}
