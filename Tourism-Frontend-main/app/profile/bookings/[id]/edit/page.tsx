// app/profile/bookings/[id]/edit/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useContext, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { UserContext } from '@/src/contexts/Contexts'
import '@/src/styles/pages/profile/page.css'
import { FiCalendar, FiMoon, FiPackage, FiDollarSign, FiArrowLeft, FiSave, FiAlertCircle } from 'react-icons/fi'

// Define a type for the booking data we expect from API
interface BookingItem {
  _id?: string;
  name?: string;
  description?: string;
  type?: string;
  quantity?: number;
  amount?: number;
  details?: {
    start_date?: string;
    end_date?: string;
    nights?: number;
    quantity?: number;
    price_per_night?: number;
    price_per_person?: number;
    price_per_ticket?: number;
    price_per_seat?: number;
    room_type?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  product_id?: {
    type?: string;
    name?: string;
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any;
  };
}

interface BookingData {
  _id: string;
  user_id: string;
  branch_id: string;
  status: string;
  paymentStatus: string;
  items: BookingItem[];
  total_price: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: any[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// Update the getEditableFields function to have a proper return type
interface EditableFieldsResult {
  canEdit: boolean;
  editableFields: string[];
  productType: string;
  reason: string;
}

export default function EditBookingPage() {
  const { token } = useContext(UserContext)
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // form state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [nights, setNights] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number | ''>('')

  useEffect(() => {
    if (!id || !token) return

    const loadBooking = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('Loading booking with ID:', id)
        console.log('Using token:', token ? 'Yes' : 'No')

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api'
        // IMPORTANT: Use the correct endpoint - bookings/me/:id NOT bookings/my-bookings/:id
        const url = `${backendUrl}/bookings/me/${id}`
        console.log('Fetching from URL:', url)

        const res = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        })

        console.log('Response status:', res.status)
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Unauthorized. Please login again.')
          }
          if (res.status === 404) {
            throw new Error('Booking not found')
          }
          const text = await res.text()
          console.error('Error response text:', text)
          throw new Error(
            `Failed to load booking: ${res.status} ${res.statusText}`
          )
        }

        const data: BookingData = await res.json()
        console.log('Booking data received:', data)
        setBooking(data)

        // Extract first item
        const item = data.items?.[0]
        console.log('First item:', item)
        
        if (item) {
          // Try to get dates from different possible locations
          const details = item.details || {}
          
          let startDateValue = details.start_date
          let endDateValue = details.end_date
          
          if (!startDateValue && details.departure_time) {
            startDateValue = details.departure_time
          }
          if (!endDateValue && details.arrival_time) {
            endDateValue = details.arrival_time
          }
          
          setStartDate(
            startDateValue
              ? dayjs(startDateValue).format('YYYY-MM-DD')
              : ''
          )
          setEndDate(
            endDateValue
              ? dayjs(endDateValue).format('YYYY-MM-DD')
              : ''
          )
          setNights(details.nights || details.duration_hours || 1)
          setQuantity(details.quantity || details.persons_booked || details.tickets_booked || 1)
        } else {
          setError('No items found in this booking')
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('Error loading booking:', err)
        setError(message || 'Failed to load booking')
        setBooking(null)
      } finally {
        setLoading(false)
      }
    }

    loadBooking()
  }, [id, token])

  // Calculate nights automatically when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = dayjs(startDate)
      const end = dayjs(endDate)
      if (end.isAfter(start)) {
        const calculatedNights = end.diff(start, 'day')
        setNights(calculatedNights)
      }
    }
  }, [startDate, endDate])

  // Check if this booking type supports editing
  const getEditableFields = (): EditableFieldsResult => {
    console.log('=== getEditableFields called ===');
    console.log('Booking exists?', !!booking);
    console.log('Booking items?', booking?.items?.length);
    
    if (!booking?.items?.[0]) {
      console.log('No booking items found');
      return {
        canEdit: false,
        editableFields: [],
        productType: 'unknown',
        reason: 'No booking items'
      };
    }
    
    const item = booking.items[0];
    console.log('Item structure:', item);
    console.log('Item.type value:', item.type);
    console.log('Type of item.type:', typeof item.type);
    
    // Get product type - check all possible locations
    let productType = 'unknown';
    
    // Priority 1: Direct item.type
    if (item.type) {
      productType = item.type.toLowerCase();
      console.log('Found type in item.type:', productType);
    }
    // Priority 2: Product_id object with type
    else if (item.product_id && typeof item.product_id === 'object' && item.product_id.type) {
      productType = item.product_id.type.toLowerCase();
      console.log('Found type in product_id object:', productType);
    }
    // Priority 3: Details type
    else if (item.details?.type) {
      productType = item.details.type.toLowerCase();
      console.log('Found type in item.details.type:', productType);
    }
    // Priority 4: Infer from details
    else if (item.details) {
      if (item.details.room_type) {
        productType = 'hotel';
        console.log('Inferred type as hotel from room_type');
      }
      if (item.details.seat_numbers) {
        productType = 'bus';
        console.log('Inferred type as bus from seat_numbers');
      }
      if (item.details.persons_booked || item.details.number_of_persons) {
        productType = 'activity';
        console.log('Inferred type as activity from persons_booked');
      }
      if (item.details.tickets_booked) {
        productType = 'flight';
        console.log('Inferred type as flight from tickets_booked');
      }
    }
    
    console.log('Final product type:', productType);
    
    // Define which fields are editable for each product type
    const editableTypes: Record<string, string[]> = {
      'hotel': ['start_date', 'end_date', 'nights', 'quantity'],
      'activity': ['start_date', 'end_date', 'quantity'], // Added end_date for activity
      'bus': [], // Bus might not be editable after seat selection
      'flight': [] // Flight might not be editable
    }
    
    const editableFields = editableTypes[productType] || []
    const canEdit = editableFields.length > 0
    
    console.log('Editable fields for', productType, ':', editableFields);
    console.log('Can edit?', canEdit);
    
    return {
      canEdit,
      editableFields,
      productType,
      reason: !canEdit ? `Edit is not available for ${productType} bookings` : ''
    }
  }

  // Debug useEffect to track booking type detection
  useEffect(() => {
    if (booking) {
      console.log('=== DEBUG: Booking Type Detection ===');
      console.log('Full booking object:', booking);
      
      if (booking.items && booking.items.length > 0) {
        const item = booking.items[0];
        console.log('First item:', item);
        console.log('Item keys:', Object.keys(item));
        
        // Check all possible type locations
        console.log('Checking type locations:');
        console.log('1. item.type:', item.type);
        console.log('2. item.product_id?.type:', item.product_id?.type);
        console.log('3. item.details?.type:', item.details?.type);
        
        // Call getEditableFields to see the result
        const result = getEditableFields();
        console.log('getEditableFields result:', result);
      }
    }
  }, [booking]);

  // Then destructure with type safety
  const { canEdit, editableFields, productType, reason } = getEditableFields()

  // Live total calculation
  const liveTotal = useMemo(() => {
    if (!booking) return 0
    const item = booking.items[0]
    if (!item) return booking.total_price || 0
    
    const details = item.details || {}
    const pricePerNight = details.price_per_night || details.price_per_person || details.price_per_ticket || details.price_per_seat || 0
    const n = nights === '' ? details.nights || 1 : nights
    const q = quantity === '' ? details.quantity || 1 : quantity
    
    return Number(pricePerNight) * Number(n) * Number(q)
  }, [booking, nights, quantity])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !booking) {
      setError('Not authenticated or booking not loaded.')
      return
    }

    // Check if booking is still pending
    if (booking.status.toLowerCase() !== 'pending') {
      setError('Only pending bookings can be edited')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const body: Record<string, unknown> = {}
      if (startDate) body.start_date = startDate
      if (endDate) body.end_date = endDate
      if (nights !== '') body.nights = Number(nights)
      if (quantity !== '') body.quantity = Number(quantity)

      console.log('Updating booking with data:', body)

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api'
      const url = `${backendUrl}/bookings/me/${id}`
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      console.log('Update response status:', res.status)
      
      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json()
          throw new Error(errorData.message || 'Bad request')
        }
        if (res.status === 404) {
          throw new Error('Booking not found or no longer editable')
        }
        const text = await res.text()
        throw new Error(`Failed to update booking: ${res.status} ${res.statusText}`)
      }

      const updatedBooking = await res.json()
      console.log('Booking updated successfully:', updatedBooking)
      
      // Redirect to profile with success message
      router.push('/profile?message=Booking updated successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Error updating booking:', err)
      setError(message || 'Failed to update booking')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Loading booking details...</p>
      </div>
    </div>
  )
  
  if (error || !booking) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-red-500 text-center mb-4">
          <FiAlertCircle className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Error</h2>
        <p className="text-gray-600 mb-6 text-center">{error || 'Booking not found'}</p>
        <button
          onClick={() => router.push('/profile')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition duration-200"
        >
          Back to Profile
        </button>
      </div>
    </div>
  )

  const item = booking.items[0]
  const details = item?.details || {}
  const originalTotal = booking.total_price || 0
  const hasChanges = liveTotal !== originalTotal

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition duration-200"
          >
            <FiArrowLeft className="mr-2" />
            Back to Profile
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {canEdit ? 'Edit Your Booking' : 'View Booking Details'}
            </h1>
            <p className="text-gray-600 mb-4">
              {canEdit ? 'Update your booking details' : 'This booking cannot be edited'}
            </p>
            
            {!canEdit && reason && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-yellow-700 flex items-center">
                  <FiAlertCircle className="mr-2" />
                  {reason}
                </p>
              </div>
            )}
            
            <div className="flex items-center bg-blue-50 rounded-xl p-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{item?.name || 'Booking'}</h2>
                <p className="text-gray-600 text-sm">Booking ID: {booking._id?.slice(-8)} • Type: {productType}</p>
                <p className="text-gray-600 text-sm">Status: <span className={`font-medium ${booking.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>{booking.status}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center mb-6">
                <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                  <FiCalendar className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {canEdit ? 'Update Details' : 'Booking Details'}
                </h2>
              </div>

              {canEdit ? (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Start Date - Only show if editable */}
                    {editableFields.includes('start_date') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2 text-blue-600" />
                            Start Date
                          </div>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition duration-200"
                            required
                          />
                          <div className="absolute left-4 top-3.5 text-gray-400">
                            <FiCalendar />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* End Date - Only show if editable */}
                    {editableFields.includes('end_date') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2 text-blue-600" />
                            End Date
                          </div>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition duration-200"
                            required
                            min={startDate}
                          />
                          <div className="absolute left-4 top-3.5 text-gray-400">
                            <FiCalendar />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Nights - Only show if editable */}
                    {editableFields.includes('nights') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <div className="flex items-center">
                            <FiMoon className="mr-2 text-blue-600" />
                            Number of Nights
                          </div>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            value={nights}
                            onChange={(e) =>
                              setNights(e.target.value ? Number(e.target.value) : '')
                            }
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition duration-200"
                            required
                          />
                          <div className="absolute left-4 top-3.5 text-gray-400">
                            <FiMoon />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quantity - Only show if editable */}
                    {editableFields.includes('quantity') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <div className="flex items-center">
                            <FiPackage className="mr-2 text-blue-600" />
                            Quantity
                          </div>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(e.target.value ? Number(e.target.value) : '')
                            }
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition duration-200"
                            required
                          />
                          <div className="absolute left-4 top-3.5 text-gray-400">
                            <FiPackage />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-100 rounded-2xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Summary</h3>
                    <div className="space-y-4">
                      {details.price_per_night && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Price per night:</span>
                          <span className="text-xl font-bold text-blue-600">
                            {details.price_per_night.toLocaleString()} EGP
                          </span>
                        </div>
                      )}
                      {editableFields.includes('nights') && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Nights:</span>
                          <span className="font-semibold text-gray-800">{nights}</span>
                        </div>
                      )}
                      {editableFields.includes('quantity') && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-semibold text-gray-800">{quantity}</span>
                        </div>
                      )}
                      <div className="border-t border-blue-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {liveTotal.toLocaleString()} EGP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => router.push('/profile')}
                      disabled={saving}
                      className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center"
                    >
                      <FiArrowLeft className="mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center shadow-lg shadow-blue-200"
                    >
                      <FiSave className="mr-2" />
                      {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                /* View-only mode for non-editable bookings */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {startDate && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-semibold">{dayjs(startDate).format('MMM D, YYYY')}</p>
                      </div>
                    )}
                    {endDate && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-semibold">{dayjs(endDate).format('MMM D, YYYY')}</p>
                      </div>
                    )}
                    {nights && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Nights</p>
                        <p className="font-semibold">{nights}</p>
                      </div>
                    )}
                    {quantity && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-semibold">{quantity}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <button
                      onClick={() => router.push('/profile')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition duration-200"
                    >
                      Back to Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price Comparison Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg mr-3">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Price Summary</h2>
              </div>

              <div className="space-y-6">
                {/* Original Price */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Original Total</h3>
                  <div className="flex items-center">
                    <div className="text-2xl font-bold text-gray-700">
                      {originalTotal.toLocaleString()} EGP
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <>
                    {/* New Price */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
                      <h3 className="text-sm font-medium text-blue-600 mb-2">New Total</h3>
                      <div className="flex items-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {liveTotal.toLocaleString()} EGP
                        </div>
                      </div>
                    </div>

                    {/* Difference */}
                    <div className={`p-4 rounded-xl ${hasChanges ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Difference</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">
                          <span className={hasChanges ? (liveTotal > originalTotal ? 'text-red-600' : 'text-emerald-600') : 'text-gray-700'}>
                            {hasChanges ? (liveTotal > originalTotal ? '+' : '-') : ''}
                            {hasChanges ? Math.abs(liveTotal - originalTotal).toLocaleString() : '0'} EGP
                          </span>
                        </div>
                        {hasChanges && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${liveTotal > originalTotal ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {liveTotal > originalTotal ? 'Increase' : 'Discount'}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Booking Info */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Booking Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${booking.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment:</span>
                      <span className={`font-medium ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-800">{productType}</span>
                    </div>
                    {booking.createdAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Booked on:</span>
                        <span className="font-medium text-gray-800">
                          {dayjs(booking.createdAt).format('MMM D, YYYY')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}