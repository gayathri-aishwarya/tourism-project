import Link from 'next/link'
import Image from 'next/image'
import { FaStar } from 'react-icons/fa'
// Types
import { HotelCardProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/CardRelated/HotelCard.css'

export default function HotelCard({ hotel }: HotelCardProps) {
    const { details } = hotel
    
    // Add null check
    if (!details || !details.prices_per_night) {
        return null
    }

    const firstPrice = Object.entries(details.prices_per_night).find(
        ([, value]) => value > 0
    )

    return (
        <Link
            href={`/hotels/${hotel._id}`}
            className={`hotel-card ${!hotel.is_active ? 'inactive' : ''}`}
        >
            {details.img && (  // ✅ Add conditional rendering
                <Image
                    src={details.img}
                    alt={hotel.name}
                    width={400}
                    height={250}
                    className='hotel-img'
                />
            )}

            {!hotel.is_active && (
                <div className='inactive-overlay'>Hotel is inactive</div>
            )}

            <div className='hotel-info'>
                <div className='hotel-header'>
                    <h3 className='hotel-name'>{hotel.name}</h3>
                    {details.rating && (
                        <div className='hotel-card-rating'>
                            <FaStar className='rating-icon' />
                            <span className='rating-number'>
                                {details.rating}
                            </span>
                        </div>
                    )}
                </div>

                {(() => {
                    if (!details.amenities_per_type) return

                    const { single, double, triple } = details.amenities_per_type

                    const firstNonEmpty =
                        (single && single.length > 0 && single) ||
                        (double && double.length > 0 && double) ||
                        (triple && triple.length > 0 && triple) ||
                        []

                    return (
                        firstNonEmpty.length > 0 && (
                            <div className='hotel-amenities'>
                                {firstNonEmpty.map((amenity, idx) => (
                                    <span key={idx} className='amenity'>
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        )
                    )
                })()}
            </div>

            <div className='hotel-footer'>
                <div className='hotel-room-types'>
                    {details.room_types &&
                        details.room_types.length > 0 &&
                        details.room_types.map((type, idx) => (
                            <span key={idx} className='room-type'>
                                {type}
                            </span>
                        ))}
                </div>

                <p className='hotel-price'>
                    {firstPrice ? (
                        <>
                            {firstPrice[1]} EGP <span>/ Night</span>
                        </>
                    ) : (
                        'Not available'
                    )}
                </p>
            </div>
        </Link>
    )
}
