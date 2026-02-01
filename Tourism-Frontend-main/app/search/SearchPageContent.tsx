'use client'

import { useSearchParams } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
// Components
import SearchInput from '@/src/components/InputRelated/SearchInput'
import BusCard from '@/src/components/CardRelated/BusCard'
import HotelCard from '@/src/components/CardRelated/HotelCard'
import ActivityCard from '@/src/components/CardRelated/ActivityCard'
import FlightCard from '@/src/components/CardRelated/FlightCard'
// Contexts
import { AdminContext } from '@/src/contexts/Contexts'
// Types
import {
    ActivityObject,
    BusObject,
    FlightObject,
    HotelObject,
    ProductObject,
} from '@/src/types/objectsTypes'
// Style
import '@/src/styles/pages/search/page.css'

const PRODUCT_TYPES = [
    { value: 'hotel', label: 'Hotels' },
    { value: 'bus', label: 'Buses' },
    { value: 'flight', label: 'Flights' },
    { value: 'activity', label: 'Activities' },
]

export default function Page() {
    // Contexts Functions
    const { getProducts } = useContext(AdminContext)
    // Search Parameters (?q=search)
    const searchParams = useSearchParams()
    // States
    const [onlyActive, setOnlyActive] = useState(false)
    const [results, setResults] = useState<ProductObject[]>([])
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])

    // Checkbox handle to apply filter (e.g. When checking hotel, show hotels only)
    const handleCheckboxChange = (type: string) => {
        setSelectedTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        )
    }

    const renderProductCard = (product: ProductObject) => {
        switch (product.type) {
            case 'bus':
                return <BusCard key={product._id} bus={product as BusObject} />
            case 'hotel':
                return (
                    <HotelCard
                        key={product._id}
                        hotel={product as HotelObject}
                    />
                )
            case 'activity':
                return (
                    <ActivityCard
                        key={product._id}
                        activity={product as ActivityObject}
                    />
                )
            case 'flight':
                return (
                    <FlightCard
                        key={product._id}
                        flight={product as FlightObject}
                    />
                )
            default:
                return null
        }
    }

    // Fetch and filter products
    useEffect(() => {
        const fetchProducts = async () => {
            const searchQuery = searchParams.get('q') || ''
            const fetched = await getProducts(searchQuery)

            if (fetched && Array.isArray(fetched.items)) {
                let filteredItems = fetched.items

                if (onlyActive) {
                    filteredItems = filteredItems.filter(
                        (item: ProductObject) => item.is_active
                    )
                }

                if (selectedTypes.length > 0) {
                    filteredItems = filteredItems.filter(
                        (item: ProductObject) =>
                            selectedTypes.includes(item.type)
                    )
                }

                setResults(filteredItems)
            } else {
                setResults([])
            }
        }
        fetchProducts().then()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, selectedTypes, onlyActive])

    if (!results) {
        return <div className='p-6'>Loading...</div>
    }

    return (
        <div className='search-page'>
            {/* Hero Section */}
            <div
                className='search-hero'
                style={{
                    backgroundImage: "url('/assets/images/home/hero.jpg')",
                }}
            >
                <div className='hero-content'>
                    <h1 className='hero-title'>Find Your Perfect Stay</h1>
                    <p className='hero-subtitle'>
                        Browse and book the best travel options instantly.
                    </p>
                    <div className='hero-search-input'>
                        <SearchInput />
                    </div>
                </div>
            </div>

            <div className='search-content'>
                {/* Filter Section */}
                <div className='filter-box'>
                    <h3 className='filter-title'>Filter by Type</h3>
                    <div className='checkbox-group'>
                        {PRODUCT_TYPES.map((type) => (
                            <label key={type.value} className='checkbox-label'>
                                <input
                                    type='checkbox'
                                    className='custom-checkbox'
                                    checked={selectedTypes.includes(type.value)}
                                    onChange={() =>
                                        handleCheckboxChange(type.value)
                                    }
                                />
                                {type.label}
                            </label>
                        ))}

                        <label className='checkbox-label'>
                            <input
                                type='checkbox'
                                className='custom-checkbox'
                                checked={onlyActive}
                                onChange={() => setOnlyActive((prev) => !prev)}
                            />
                            Only show active
                        </label>
                    </div>
                </div>

                {/* Results */}
                <div className='results-section'>
                    <h2 className='results-title'>
                        <p>Results for:</p>
                        <p className='results-type'>
                            {searchParams.get('q') || 'All products'}
                        </p>

                        {/* Applied filters */}
                        {(selectedTypes.length > 0 || onlyActive) && (
                            <>
                                <p className='-ml-1.5'>
                                    , with filter
                                    {selectedTypes.length +
                                        (onlyActive ? 1 : 0) >
                                        1 && 's'}
                                    :{' '}
                                </p>
                                <div className='flex flex-wrap gap-2'>
                                    {selectedTypes.map((type) => {
                                        const label =
                                            PRODUCT_TYPES.find(
                                                (t) => t.value === type
                                            )?.label || type
                                        return (
                                            <span
                                                key={type}
                                                className='filter-chip'
                                            >
                                                {label}
                                            </span>
                                        )
                                    })}

                                    {onlyActive && (
                                        <span className='filter-chip'>
                                            Only Active
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </h2>

                    {results.length === 0 ? (
                        <div className='no-results'>No results found.</div>
                    ) : (
                        <div className='results-grid'>
                            {results.map(renderProductCard)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
