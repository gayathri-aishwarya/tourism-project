import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import api from '../api/axios'
import TripCard from '../components/BustripRelated/TripCard'
import { TripInstance } from '../types/trip'

export default function TripList() {
  const [trips, setTrips] = useState<TripInstance[]>([])
  const router = useRouter()

  useEffect(() => {
    api.get('/trip-instances')
      .then(res => setTrips(res.data))
      .catch(err => {
        console.error('Failed to load trips', err)
      })
  }, [])

  const handleSelect = (tripInstanceId: string) => {
    router.push(`/book/${tripInstanceId}`)
  }

  return (
    <div>
      <h2>Available Trips</h2>

      {trips.map(trip => (
        <TripCard
          key={trip._id}
          trip={trip}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}
