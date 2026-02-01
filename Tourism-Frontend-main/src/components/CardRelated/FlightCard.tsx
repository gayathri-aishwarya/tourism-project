import dayjs from 'dayjs'
import Link from 'next/link'
import Image from 'next/image'
// Functions
import { getDuration } from '@/src/utils/Functions'
// Types
import { FlightCardProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/CardRelated/FlightCard.css'

export default function FlightCard({ flight }: FlightCardProps) {
    // Destructure for readability
    const { details } = flight

    return (
        <Link
            href={`/flights/${flight._id}`}
            className={`flight-card ${!flight.is_active ? 'inactive' : ''}`}
        >
            <Image
                src={details.img}
                alt={flight.name}
                width={400}
                height={250}
                className='flight-card-img'
            />

            {!flight.is_active && (
                <div className='inactive-overlay'>Flight is inactive</div>
            )}

            <div className='flight-card-content'>
                <p className='flight-airline'>{details.airline}</p>

                <h3 className='flight-route'>
                    <span className='inline-flex items-center gap-2 w-full'>
                        <span className='truncate max-w-[45%]'>
                            {details.departure_airport}
                        </span>
                        <span className='shrink-0'>→</span>
                        <span className='truncate max-w-[45%]'>
                            {details.arrival_airport}
                        </span>
                    </span>
                </h3>

                <div className='flight-info'>
                    <span className='flight-date'>
                        Departs{' '}
                        {dayjs(details.departure_time).format('hh:mm A')}
                    </span>
                    <span className='flight-time'>
                        Arrives {dayjs(details.arrival_time).format('hh:mm A')}
                    </span>
                </div>

                <div className='flight-footer'>
                    <span className='flight-duration'>
                        {getDuration(
                            details.arrival_time,
                            details.departure_time
                        )}
                    </span>
                    <span className='flight-price'>
                        <p>{details.price_per_ticket} EGP</p>
                    </span>
                </div>
            </div>
        </Link>
    )
}
