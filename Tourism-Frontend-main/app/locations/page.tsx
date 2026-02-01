'use client'

import { useCallback, useContext, useEffect, useState } from 'react'
// Components
import LocationCard from '@/src/components/CardRelated/LocationCard'
// Contexts
import { AdminContext } from '@/src/contexts/Contexts'
// Types
import { LocationObject } from '@/src/types/objectsTypes'
// Style
import '@/src/styles/pages/locations/page.css'

export default function Page() {
    // Contexts Functions
    const { getLocations } = useContext(AdminContext)
    // States
    const [locations, setLocations] = useState<LocationObject[]>([])

    const fetchLocations = useCallback(async () => {
        const data = await getLocations()
        setLocations(data || [])
    }, [getLocations])

    useEffect(() => {
        fetchLocations().then()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!locations) {
        return <div className='p-6'>Loading...</div>
    }

    return (
        <div className='locations-page'>
            <section className='locations-section'>
                <h2 className='section-title'>Best Locations</h2>
                <p className='section-subtitle'>
                    Choose your favorite location
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
                    <p className='no-locations'>No locations found.</p>
                )}
            </section>
        </div>
    )
}
