'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { FiArrowLeft } from 'react-icons/fi'

import { createBusBooking, getTripInstance } from '@/src/api/bus-booking.api'
import { BusObject, TripInstance } from '@/src/types/objectsTypes'

import '@/src/styles/components/DashboardRelated/TableAndForm.css'

/* ---------------- UI-ONLY TYPES (IMPORTANT) ---------------- */

type UISeat = {
    id: string
    number: number
    isBooked: boolean
}

type SelectedSeat = UISeat & {
    name: string
    age: number
}

/* ----------------------------------------------------------- */

export default function TripBookingPage() {
    const params = useParams()
    const router = useRouter()

    const tripInstanceId = Array.isArray(params?.tripInstanceId)
        ? params.tripInstanceId[0]
        : params?.tripInstanceId

    const [tripInstance, setTripInstance] = useState<TripInstance | null>(null)
    const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([])
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchTripDetails = useCallback(async () => {
        if (!tripInstanceId) return
        try {
            const data = await getTripInstance(tripInstanceId)
            setTripInstance(data)
        } catch (err) {
            console.error(err)
            setError('Failed to load trip details.')
        }
    }, [tripInstanceId])

    useEffect(() => {
        fetchTripDetails()
    }, [fetchTripDetails])

    /* ---------------- SEAT LOGIC ---------------- */

    const toggleSeat = (seat: UISeat) => {
        const exists = selectedSeats.find((s) => s.number === seat.number)

        if (exists) {
            setSelectedSeats((prev) =>
                prev.filter((s) => s.number !== seat.number)
            )
        } else {
            setSelectedSeats((prev) => [
                ...prev,
                { ...seat, name: '', age: 0 },
            ])
        }
    }

    const updatePassengerInfo = (
        seatNumber: number,
        field: 'name' | 'age',
        value: string | number
    ) => {
        setSelectedSeats((prev) =>
            prev.map((s) =>
                s.number === seatNumber ? { ...s, [field]: value } : s
            )
        )
    }

    const renderSeat = (seat: UISeat) => {
        const selected = selectedSeats.some((s) => s.number === seat.number)

        const className = seat.isBooked
            ? 'seat booked'
            : selected
            ? 'seat selected'
            : 'seat available'

        return (
            <div
                key={seat.number}
                className={className}
                onClick={() => !seat.isBooked && toggleSeat(seat)}
            >
                {seat.number}
            </div>
        )
    }

    /* ---------------- BOOKING ---------------- */

    const handleBooking = async () => {
        if (!tripInstance || !tripInstanceId) return

        if (!phone) {
            setError('Enter a valid phone number.')
            return
        }

        if (selectedSeats.length === 0) {
            setError('Select at least one seat.')
            return
        }

        for (const s of selectedSeats) {
            if (!s.name || !s.age) {
                setError('Each passenger must have name and age.')
                return
            }
        }

        try {
            setLoading(true)
            await createBusBooking({
                trip_instance_id: tripInstanceId,
                phone,
                seats: selectedSeats.map((s) => ({
                    seat_number: s.number.toString(),
                    passenger_name: s.name,
                    age: s.age,
                })),
            })
            router.push('/my-bookings')
        } catch (err) {
            console.error(err)
            setError('Booking failed.')
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- UI ---------------- */

    if (!tripInstance) return <p>Loading trip details...</p>

    const busTemplate = tripInstance.trip_template as BusObject
    const seatNumbers = busTemplate.details.bus_seats.split(',')

    const calculateFare = () => {
        const price = busTemplate.details.price_per_seat
        return selectedSeats.reduce(
            (sum, s) => sum + (s.age < 5 ? price / 2 : price),
            0
        )
    }

    return (
        <div className='table-wrapper p-4'>
            <button
                className='secondary-btn mb-4 flex items-center'
                onClick={() => router.back()}
            >
                <FiArrowLeft className='mr-1' /> Back
            </button>

            <div className='header-bar mb-4'>
                <h2 className='page-title'>
                    {busTemplate.details.from_location} →{' '}
                    {busTemplate.details.to_location}
                </h2>
                <p>
                    {dayjs(tripInstance.travel_date).format('DD MMM YYYY')} |
                    Departure:{' '}
                    {dayjs(busTemplate.details.departure_time).format('HH:mm')}
                </p>
            </div>

            <div className='mb-4'>
                <h3 className='font-semibold mb-2'>Select Seats</h3>
                <div className='grid grid-cols-8 gap-2'>
                    {seatNumbers.map((num) =>
                        renderSeat({
                            id: num,
                            number: Number(num),
                            isBooked: tripInstance.booked_seats.includes(num),
                        })
                    )}
                </div>
            </div>

            {selectedSeats.length > 0 && (
                <div className='drawer'>
                    <h3 className='drawer-title mb-2'>Passenger Details</h3>

                    {selectedSeats.map((s) => (
                        <div key={s.number} className='form-grid mb-2'>
                            <input
                                className='form-input'
                                placeholder={`Seat ${s.number} Name`}
                                value={s.name}
                                onChange={(e) =>
                                    updatePassengerInfo(
                                        s.number,
                                        'name',
                                        e.target.value
                                    )
                                }
                            />
                            <input
                                type='number'
                                className='form-input'
                                placeholder='Age'
                                value={s.age}
                                onChange={(e) =>
                                    updatePassengerInfo(
                                        s.number,
                                        'age',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </div>
                    ))}

                    <input
                        className='form-input mt-2'
                        placeholder='Phone'
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <div className='mt-3 font-semibold'>
                        Total Fare: {calculateFare()} EGP
                    </div>

                    {error && <p className='text-red-500 mt-2'>{error}</p>}

                    <button
                        className='primary-btn mt-4'
                        onClick={handleBooking}
                        disabled={loading}
                    >
                        {loading ? 'Booking...' : 'Confirm Booking'}
                    </button>
                </div>
            )}
        </div>
    )
}
