// src/api/busbooking.api.ts
//src/api/busbooking.api.ts
import axios from 'axios'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
})

export type CreateBusBookingPayload = {
  trip_instance_id: string
  phone: string
  seats: {
    seat_number: string
    passenger_name: string
    age: number
  }[]
}

// ✅ FIXED: Match backend routes
export const searchTrips = async (params: {
  from: string;
  to: string;
  date: string;
  bus_type?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await API.get('/trip-instances/search', { params })
  return data
}

export const getTripInstance = async (tripInstanceId: string) => {
  const { data } = await API.get(`/trip-instances/${tripInstanceId}`)
  return data
}

export const createBusBooking = async (payload: CreateBusBookingPayload) => {
  const { data } = await API.post('/bus-bookings', payload)
  return data
}

export const getUserBusBookings = async () => {
  const { data } = await API.get('/bus-bookings') // ✅ Changed from '/my'
  return data
}

export const getBusBookingDetails = async (bookingId: string) => {
  const { data } = await API.get(`/bus-bookings/${bookingId}`)
  return data
}

export const cancelBusBooking = async (bookingId: string) => {
  const { data } = await API.delete(`/bus-bookings/${bookingId}/cancel`)
  return data
}