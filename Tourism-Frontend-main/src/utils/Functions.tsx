import { FaStar } from 'react-icons/fa'
// Types
import { SeatType, BusSeatsLayout } from '@/src/types/objectsTypes'

/**
 * Capitalizes the first letter of each word in a string
 */
export const capitalizeWords = (text?: string) => {
    if (!text) return ''
    return text
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/**
 * Renders full, half, and empty stars based on rating (out of 5)
 */
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
                    <FaStar className='text-gray-300' />
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

/**
 * Converts a BusSeatsLayout object into a compact string for DB storage
 */
export const seatsObjectToString = (layout: BusSeatsLayout): string => {
    if (!layout?.rows || !layout.rows.length) return ''

    return layout.rows
        .map((row) => {
            const sideToString = (side?: SeatType[]) =>
                side
                    ? side
                          .map((seat) => `${seat.number}:${seat.isBooked ? 1 : 0}`)
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

/**
 * Converts a compact bus seats string from the DB back into a BusSeatsLayout object
 */
export const seatsStringToObject = (str: string): BusSeatsLayout => {
    if (!str || !str.trim()) return { rows: [] }

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

/**
 * Calculates total, booked, and available seats from a BusSeatsLayout object
 */
export const busSeatsStats = (layout: BusSeatsLayout) => {
    let total = 0
    let booked = 0

    if (!layout?.rows || !Array.isArray(layout.rows)) {
        return { total: 0, booked: 0, available: 0 }
    }

    for (const row of layout.rows) {
        for (const side of ['left', 'middle', 'right'] as const) {
            const seats = row[side]
            if (Array.isArray(seats)) {
                for (const seat of seats) {
                    total++
                    if (seat.isBooked) booked++
                }
            }
        }
    }

    return { total, booked, available: total - booked }
}

/**
 * Calculates the duration between departure and arrival as a readable string
 */
export const getDuration = (arrival: Date, departure: Date) => {
    const diffMs = new Date(arrival).getTime() - new Date(departure).getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return minutes === 0 ? `${hours} hours` : `${hours}h ${minutes}m`
}
