'use client'

import Image from 'next/image'
import { useState, use, useContext, useCallback, useEffect } from 'react'
// Contexts
import { AdminContext } from '@/src/contexts/Contexts'
// Types
import {
    ActivityObject,
    BusObject,
    FlightObject,
    HotelObject,
    LocationObject,
    ProductObject,
} from '@/src/types/objectsTypes'
import { LocationPageParamsType } from '@/src/types/propsTypes'
// Components
import HotelCard from '@/src/components/CardRelated/HotelCard'
import ActivityCard from '@/src/components/CardRelated/ActivityCard'
import BusCard from '@/src/components/CardRelated/BusCard'
import FlightCard from '@/src/components/CardRelated/FlightCard'
// Styles
import '@/src/styles/pages/locations/[id]/page.css'

const TABS = [
    { id: 'hotels', label: 'Hotels' },
    { id: 'activities', label: 'Activities' },
    { id: 'buses', label: 'Buses' },
    { id: 'flights', label: 'Flights' },
]

export default function Page({ params }: LocationPageParamsType) {
    // Get ID /locations/:id
    const { id } = use(params)
    // Contexts Functions
    const { getLocationById, getProducts } = useContext(AdminContext)
    // States
    const [location, setLocation] = useState<LocationObject>()
    const [products, setProducts] = useState<ProductObject[]>([])
    const [activeTab, setActiveTab] = useState<
        'hotels' | 'activities' | 'buses' | 'flights'
    >('hotels')

    const fetchData = useCallback(async () => {
        try {
            const [locationData, productsData] = await Promise.all([
                getLocationById(id),
                // ✅ PASS location_id and type parameters
                getProducts({ location_id: id, type: 'hotel' }),
            ])
            setLocation(locationData)
            
            console.log('📍 Location ID:', id)
            console.log('📦 Products response:', productsData)
            console.log('🏨 Hotels count:', productsData?.items?.length || 0)
            
            // ✅ Backend already filtered by location_id
            setProducts(productsData?.items || [])
        } catch (error) {
            console.error('❌ Error fetching data:', error)
            setProducts([])
        }
    }, [getLocationById, getProducts, id])

    useEffect(() => {
        fetchData().then()
    }, [fetchData])

    if (!location) {
        return <div className="loading-container">
            <p>Loading location...</p>
        </div>
    }

    // Products filters for each tab
    const hotelsData = products.filter((p) => p.type === 'hotel')
    const activitiesData = products.filter((p) => p.type === 'activity')
    const busesData = products.filter((p) => p.type === 'bus')
    const flightsData = products.filter((p) => p.type === 'flight')

      // Debug: Log counts - FIXED: Remove dependencies that cause infinite loops

    // If tab has no products
    const renderNoProducts = (typeLabel: string) => (
        <div className="no-products-container">
            <p className='no-products'>No {typeLabel} found</p>
            <p className='no-products-hint'>Try checking back later or contact support.</p>
        </div>
    )

    return (
        <div className='location-page'>
            {/* Hero Section */}
            <section
                className='location-hero'
                style={{
                    backgroundImage: `url(${location.heroImage})`,
                }}
            >
                <div className='overlay' />
                <div className="hero-content">
                    <h1 className="hero-title">{location.name}</h1>
                    <p className="hero-subtitle">Discover amazing places to stay</p>
                </div>
            </section>

            {/* Location Info */}
            <section className='location-info'>
                <div className='location-text'>
                    <h1 className='location-title'>{location.name}</h1>
                    <p className='location-desc'>{location.description}</p>
                    {/* ✅ Show hotel count */}
                    <div className='location-stats'>
                        <span className='stat'>
                            🏨 <strong>{hotelsData.length}</strong> Hotels
                        </span>
                        <span className='stat'>
                            ⭐ <strong>{location.rating || '5'}</strong> Rating
                        </span>
                    </div>
                </div>
                <Image
                    width={200}
                    height={200}
                    src={location.heroImage}
                    alt={`${location.name} view`}
                    className='location-side-img'
                    priority
                />
            </section>

            {/* Location Tabs */}
            <section className='location-tabs'>
                <div className='tabs-header'>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() =>
                                setActiveTab(tab.id as typeof activeTab)
                            }
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.label} {
                                tab.id === 'hotels' ? `(${hotelsData.length})` :
                                tab.id === 'activities' ? `(${activitiesData.length})` :
                                tab.id === 'buses' ? `(${busesData.length})` :
                                tab.id === 'flights' ? `(${flightsData.length})` : ''
                            }
                        </button>
                    ))}
                </div>

                <div className='tabs-content'>
                    {activeTab === 'hotels' &&
                        (hotelsData.length > 0 ? (
                            <div className='cards-grid'>
                                {hotelsData.map((hotel) => (
                                    <HotelCard
                                        hotel={hotel as HotelObject}
                                        key={hotel._id}
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
                                        activity={activity as ActivityObject}
                                        key={activity._id}
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
                                        bus={bus as BusObject}
                                        key={bus._id}
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
                                        flight={flight as FlightObject}
                                        key={flight._id}
                                    />
                                ))}
                            </div>
                        ) : (
                            renderNoProducts('flights')
                        ))}
                </div>
            </section>
        </div>
    )
}