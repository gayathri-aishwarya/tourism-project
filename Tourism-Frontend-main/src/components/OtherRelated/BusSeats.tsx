import { MdEventSeat } from 'react-icons/md'
import { GiSteeringWheel } from 'react-icons/gi'
// Functions
import { busSeatsStats } from '@/src/utils/Functions'
// Types
import { BusSeatsProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/OtherRelated/BusSeats.css'

export default function BusSeats({
    layout,
    onSelect,
    selectedSeats,
}: BusSeatsProps) {
    // Calculate stats
    const { total, booked, available } = busSeatsStats(layout)

    // Handle seat click
    const toggleSeat = (seat: {
        id: string
        number: number
        isBooked: boolean
    }) => {
        if (seat.isBooked) return // can't select booked seats

        let updatedSeats: number[]
        if (selectedSeats.includes(seat.number)) {
            updatedSeats = selectedSeats.filter((s) => s !== seat.number)
        } else {
            updatedSeats = [...selectedSeats, seat.number]
        }

        onSelect?.(updatedSeats) // send back to parent
    }

    return (
        <div className='seats-layout-container'>
            {/* Header bar */}
            <div className='seats-header'>
                <span>
                    Total <p>{total}</p>
                </span>
                <span>
                    Booked <p className='stats-booked'>{booked}</p>
                </span>
                <span>
                    Available <p>{available}</p>
                </span>
                <span>
                    Selected{' '}
                    <p className='stats-selected'>{selectedSeats.length}</p>
                </span>
            </div>

            {/* Bus container */}
            <div className='bus-container'>
                {/* Front of the bus */}
                <div className='bus-front'>
                    <GiSteeringWheel />
                    <p>Driver</p>
                </div>

                {/* Seats layout */}
                <div className='seats-layout'>
                    {layout.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className='seat-row'>
                            {/* Left side */}
                            <div className='seat-side'>
                                {row.left.map((seat) => (
                                    <div
                                        key={seat.id}
                                        onClick={() => toggleSeat(seat)}
                                        className={`seat ${seat.isBooked ? 'booked' : 'available'} ${
                                            selectedSeats.includes(seat.number)
                                                ? 'selected'
                                                : ''
                                        }`}
                                    >
                                        <MdEventSeat />
                                        <span>{seat.number}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Aisle */}
                            <div className='aisle' />

                            {/* Middle seats (optional) */}
                            {row.middle && (
                                <>
                                    <div className='seat-side'>
                                        {row.middle.map((seat) => (
                                            <div
                                                key={seat.id}
                                                onClick={() => toggleSeat(seat)}
                                                className={`seat ${seat.isBooked ? 'booked' : 'available'} ${
                                                    selectedSeats.includes(
                                                        seat.number
                                                    )
                                                        ? 'selected'
                                                        : ''
                                                }`}
                                            >
                                                <MdEventSeat />
                                                <span>{seat.number}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className='aisle' />
                                </>
                            )}

                            {/* Right side */}
                            <div className='seat-side'>
                                {row.right.map((seat) => (
                                    <div
                                        key={seat.id}
                                        onClick={() => toggleSeat(seat)}
                                        className={`seat ${seat.isBooked ? 'booked' : 'available'} ${
                                            selectedSeats.includes(seat.number)
                                                ? 'selected'
                                                : ''
                                        }`}
                                    >
                                        <MdEventSeat />
                                        <span>{seat.number}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
