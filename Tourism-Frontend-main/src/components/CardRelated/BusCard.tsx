import dayjs from 'dayjs'
import Link from 'next/link'
import Image from 'next/image'
// Types
import { BusCardProps } from '@/src/types/propsTypes'
// Functions

// Style
import '@/src/styles/components/CardRelated/BusCard.css'
import { busSeatsStats, seatsStringToObject } from '@/src/utils/Functions'

export default function BusCard({ bus }: BusCardProps) {
    // Destructure for readability
    const { details } = bus
    // Get bus seats layout object & total seats
    const busSeats = seatsStringToObject(details.bus_seats)
    const { total } = busSeatsStats(busSeats)

    return (
        <Link
            href={`/buses/${bus._id}`}
            className={`bus-card ${!bus.is_active ? 'inactive' : ''}`}
        >
            <Image
                src={details.img}
                alt={bus.name}
                width={400}
                height={250}
                className='bus-card-img'
            />

            {!bus.is_active && <div className='inactive-overlay'>Bus is inactive</div>}

            <div className='bus-card-content'>
                <h3 className='bus-title'>{bus.name}</h3>

                <p className='bus-seats'>
                    {total} seats • {details.bus_model}
                </p>

                <div className='bus-info'>
                    <span className='bus-date'>
                        Departs{' '}
                        {dayjs(details.departure_time).format('hh:mm A')}
                    </span>
                    <span className='bus-time'>
                        Arrives {dayjs(details.arrival_time).format('hh:mm A')}
                    </span>
                </div>

                <div className='bus-footer'>
                    <span className='bus-wifi'>
                        {details.wifi_available ? 'WiFi Available' : 'No WiFi'}
                    </span>
                    <span className='bus-price'>
                        <p>{details.price_per_seat} EGP</p>
                    </span>
                </div>
            </div>
        </Link>
    )
}
