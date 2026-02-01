'use client'

import Link from 'next/link'
import { FiMapPin } from 'react-icons/fi'
import { useContext, useEffect, useState, useCallback } from 'react'
// Types
import {
    ProductObject,
    LocationObject,
    PopulatedBundleObject,
} from '@/src/types/objectsTypes'
// Contexts
import { AdminContext } from '@/src/contexts/Contexts'
// Style
import '@/src/styles/components/CardRelated/BundleCard.css'

type BundleCardProps = {
    bundle: PopulatedBundleObject
}

export default function BundleCard({ bundle }: BundleCardProps) {
    const { getProducts, getLocationById } = useContext(AdminContext)

    const [products, setProducts] = useState<ProductObject[]>([])
    const [location, setLocation] = useState<LocationObject | null>(null)

    const fetchData = useCallback(async () => {
        try {
            const [productResp, locationResp] = await Promise.all([
                getProducts(),
                getLocationById(bundle.location_id),
            ])

            setProducts(
                productResp?.items.filter((p) =>
                    bundle.product_ids.some((bp) => bp._id === p._id)
                ) || []
            )
            setLocation(locationResp as LocationObject)
        } catch (err) {
            console.error('Failed to fetch bundle card data', err)
        }
    }, [bundle, getProducts, getLocationById])

    useEffect(() => {
        fetchData().then()
    }, [fetchData])

    return (
        <Link
            href={`/bundles/${bundle._id}`}
            className={`bundle-card ${!bundle.is_active ? 'inactive' : ''}`}
        >
            {!bundle.is_active && (
                <div className='inactive-overlay'>Bundle is inactive</div>
            )}

            <div className='bundle-header'>
                <h3 className='bundle-name'>{bundle.name}</h3>
                <span className='bundle-price'>{bundle.price} EGP</span>
            </div>

            <p className='bundle-description'>{bundle.description}</p>

            {location && (
                <p className='bundle-location'>
                    <FiMapPin className='location-icon' />
                    {location.name}
                </p>
            )}

            <div className='bundle-products'>
                <span className='products-label'>Includes:</span>
                {products.length > 0 ? (
                    products.map((p) => (
                        <span key={p._id} className='product-chip'>
                            {p.name}
                        </span>
                    ))
                ) : (
                    <span className='no-products'>No products</span>
                )}
            </div>
        </Link>
    )
}
