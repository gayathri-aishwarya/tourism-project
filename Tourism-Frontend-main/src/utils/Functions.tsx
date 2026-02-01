import { FaStar } from 'react-icons/fa'
// Types
import { SeatType, BusSeatsLayout } from '@/src/types/objectsTypes'

export const capitalizeWords = (text: string) => {
    return text
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

export const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
        <>
            {Array.from({ length: fullStars }).map((_, i) => (
                <FaStar
                    key={`full-${i}`}
                    className='text-c2 inline-block align-middle mr-1 text-[1rem]'
                />
            ))}

            {hasHalfStar && (
                <span
                    key='half'
                    className='relative inline-block align-middle mr-1 text-[1rem] leading-none'
                >
                    {/* base (empty) */}
                    <FaStar className='text-gray-300' />
                    {/* filled half */}
                    <span className='absolute inset-0 w-1/2 overflow-hidden'>
                        <FaStar className='text-c2' />
                    </span>
                </span>
            )}

            {Array.from({ length: emptyStars }).map((_, i) => (
                <FaStar
                    key={`empty-${i}`}
                    className='text-gray-300 inline-block align-middle mr-1 text-[1rem]'
                />
            ))}
        </>
    )
}

export const seatsObjectToString = (layout: BusSeatsLayout): string => {
    /**
     * Imagine you are describing the bus seats as a simple text message.
     *
     * Each row of the bus is written separately, with rows divided by a "|" symbol.
     * Inside each row, the seats on the left, middle, and right are separated by ";".
     * Each seat is written as "number:status".
     *   - number = the seat number (like 1, 2, 3…)
     *   - status = 0 if free, 1 if booked
     *
     * Example:
     *   Row 1 has seats 1 (free) and 2 (booked) on the left,
     *   and seat 11 (free) on the right.
     *   That row looks like: "1:0,2:1;11:0"
     *
     * If we have two rows, we join them with "|":
     *   "1:0,2:1;11:0 | 3:0,4:0;12:1"
     *
     * This makes the bus layout into a single string you can store in a database.
     */

    return layout.rows
        .map((row) => {
            const sideToString = (side?: SeatType[]) =>
                side
                    ? side
                          .map(
                              (seat) =>
                                  `${seat.number}:${seat.isBooked ? 1 : 0}`
                          )
                          .join(',')
                    : ''

            const parts = [
                sideToString(row.left),
                sideToString(row.middle),
                sideToString(row.right),
            ].filter(Boolean)
            return parts.join(';')
        })
        .join(' | ')
}

export const seatsStringToObject = (str: string): BusSeatsLayout => {
    /**
     * This takes the short text version of seats and turns it back into a bus layout object.
     *
     * We read each row by splitting at the "|" symbol.
     * Then inside each row, we split the left, middle, and right sides by ";".
     * Each seat is split into two parts: "number:status".
     *   - number = seat number
     *   - status = 0 (free) or 1 (booked)
     *
     * Example string:
     *   "1:0,2:1;11:0 | 3:0,4:0;12:1"
     *
     * Becomes an object with two rows:
     *   Row 1 → left seats [1 free, 2 booked], right seat [11 free]
     *   Row 2 → left seats [3 free, 4 free], right seat [12 booked]
     *
     * This way, we can rebuild the detailed seat layout for rendering in the UI.
     */

    const rows = str.split('|').map((rowStr, rowIndex) => {
        const sides = rowStr.trim().split(';')

        const parseSeats = (side: string, prefix: string) =>
            side
                ? side.split(',').map((s, i) => {
                      const [num, booked] = s.split(':')
                      return {
                          id: `${prefix}${rowIndex + 1}_${i + 1}`,
                          number: parseInt(num),
                          isBooked: booked === '1',
                      }
                  })
                : []

        return {
            left: parseSeats(sides[0], 'L'),
            middle: sides[2] ? parseSeats(sides[1], 'M') : undefined,
            right: parseSeats(sides[sides.length - 1], 'R'),
        }
    })

    return { rows }
}

export const busSeatsStats = (layout: BusSeatsLayout) => {
    let total = 0
    let booked = 0
    layout.rows.forEach((row) => {
        ;(['left', 'middle', 'right'] as const).forEach((side) => {
            const seats = row[side]
            if (seats) {
                seats.forEach((seat) => {
                    total++
                    if (seat.isBooked) booked++
                })
            }
        })
    })
    return { total, booked, available: total - booked }
}

export const getDuration = (arrival: Date, departure: Date) => {
    const diffMs = new Date(arrival).getTime() - new Date(departure).getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return minutes === 0 ? `${hours} hours` : `${hours}h ${minutes}m`
}
