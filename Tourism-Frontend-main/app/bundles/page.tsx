'use client'

import { useCallback, useContext, useEffect, useState } from 'react'
// Components
import BundleCard from '@/src/components/CardRelated/BundleCard'
// Contexts
import { AdminContext } from '@/src/contexts/Contexts'
// Types
import { PopulatedBundleObject } from '@/src/types/objectsTypes'
// Style
import '@/src/styles/pages/bundles/page.css'

export default function Page() {
    // Contexts Functions
    const { getBundles } = useContext(AdminContext)
    // States
    const [bundles, setBundles] = useState<PopulatedBundleObject[]>([])

    const fetchBundles = useCallback(async () => {
        const data = await getBundles()
        setBundles(data || [])
    }, [getBundles])

    useEffect(() => {
        fetchBundles().then()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!bundles) {
        return <div className='p-6'>Loading...</div>
    }

    return (
        <div className='bundles-page'>
            <section className='bundles-section'>
                <h2 className='section-title'>Travel Bundles</h2>
                <p className='section-subtitle'>
                    Choose the perfect bundle for your journey
                </p>
                {bundles.length > 0 ? (
                    <div className='bundles-grid'>
                        {bundles.map((bundle) => (
                            <BundleCard bundle={bundle} key={bundle._id} />
                        ))}
                    </div>
                ) : (
                    <p className='no-bundles'>No bundles found.</p>
                )}
            </section>
        </div>
    )
}
