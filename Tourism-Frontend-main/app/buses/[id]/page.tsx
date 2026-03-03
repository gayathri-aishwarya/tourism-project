'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FaSpinner, FaArrowLeft } from 'react-icons/fa'
import { adminBusApi } from '@/src/api/admin-bus.api'
import styles from './page.module.css'

export default function BusDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [debug, setDebug] = useState<string>('')

    useEffect(() => {
        const checkAndRedirect = async () => {
            try {
                const id = params?.id as string
                
                if (!id) {
                    setError('Invalid bus ID')
                    setLoading(false)
                    return
                }

                console.log('Checking ID:', id)
                setDebug(`Checking ID: ${id}`)

                // First, let's check if this is a valid trip instance
                try {
                    console.log('Attempting to fetch trip instance...')
                    const tripResponse = await adminBusApi.getTripInstance(id)
                    console.log('Trip response:', tripResponse)
                    
                    if (tripResponse && tripResponse.instance) {
                        console.log('Found trip instance, redirecting to seat selection')
                        // It's a trip instance, redirect to seat selection
                        router.replace(`/buses/select-seat/${id}`)
                        return
                    }
                } catch (tripError: any) {
                    console.log('Trip instance fetch failed:', tripError.message)
                    setDebug(prev => prev + '\nTrip fetch failed: ' + tripError.message)
                    
                    // Check if it's a 404 or other error
                    if (tripError.response?.status === 404) {
                        console.log('Trip instance not found (404)')
                    } else {
                        console.log('Other error fetching trip:', tripError)
                    }
                }

                // If not a trip instance, check if it's a bus
                try {
                    console.log('Attempting to fetch buses...')
                    const busesResponse = await adminBusApi.getBuses()
                    console.log('Buses response received')
                    
                    if (busesResponse && busesResponse.buses) {
                        const bus = busesResponse.buses.find((b: any) => b._id === id)
                        
                        if (bus) {
                            console.log('Found bus:', bus.vehicle_no)
                            setDebug(prev => prev + '\nFound bus: ' + bus.vehicle_no)
                            
                            // It's a bus, check if it has a seat layout
                            if (bus.seat_layout && bus.seat_layout.length > 0) {
                                // Redirect to a bus info page or show bus details
                                // For now, redirect to buses listing
                                router.replace('/buses')
                                return
                            }
                        }
                    }
                    
                    console.log('No bus found with ID:', id)
                    setDebug(prev => prev + '\nNo bus found with this ID')
                } catch (busError: any) {
                    console.error('Error fetching buses:', busError)
                    setDebug(prev => prev + '\nBus fetch error: ' + busError.message)
                }

                // If we get here, neither trip nor bus was found
                setError('Bus or trip not found. Please check the URL and try again.')
                setLoading(false)
            } catch (err: any) {
                console.error('Error in redirect:', err)
                setError('An error occurred: ' + err.message)
                setLoading(false)
            }
        }

        checkAndRedirect()
    }, [params, router])

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <FaSpinner className={styles.spinner} />
                <p>Loading...</p>
                <p className={styles.debug}>{debug}</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <h2>Error</h2>
                <p>{error}</p>
                <p className={styles.debug}>Debug info: {debug}</p>
                <button onClick={() => router.push('/buses')} className={styles.backButton}>
                    <FaArrowLeft /> Back to Buses
                </button>
            </div>
        )
    }

    return null
}