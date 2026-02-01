//app/profile/page.tsx
'use client'

import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import {
    FaUserCircle,
    FaCalendarAlt,
    FaEnvelope,
    FaPhone,
    FaClock,
    FaSync,
    FaPlus,
    FaCheckCircle,
    FaChartLine,
    FaPlane,
    FaExclamationTriangle,
} from 'react-icons/fa'
import { UserContext, AdminContext } from '@/src/contexts/Contexts'
import { BookingObject } from '@/src/types/objectsTypes'
import BookingTable from '@/src/components/BookingRelated/BookingTable'
import '@/src/styles/pages/profile/page.css'

interface BookingTableRow {
    id: string
    tourName: string
    location: string
    date: string
    guests: number
    amount: number
    status: string
    payment: string
    nights?: number
    imageUrl?: string
}

export default function ProfilePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, token } = useContext(UserContext)
    const { getBookingsByUser } = useContext(AdminContext)
    const [bookings, setBookings] = useState<BookingObject[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Enhanced booking summary stats
    const [totalSpent, setTotalSpent] = useState(0)
    const [totalBookings, setTotalBookings] = useState(0)
    const [upcomingTrips, setUpcomingTrips] = useState(0)
    const [pendingActions, setPendingActions] = useState(0)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Handle success messages from URL query params
    useEffect(() => {
        const message = searchParams.get('message')
        if (message) {
            setSuccessMessage(message)
            const timer = setTimeout(() => {
                setSuccessMessage(null)
                router.replace('/profile', { scroll: false })
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [searchParams, router])

    // Debug booking data structure
    useEffect(() => {
        if (bookings.length > 0) {
            console.log('📊 Actual booking data:', bookings[0])
        }
    }, [bookings])

    // Enhanced fetch bookings with comprehensive stats
   const fetchBookings = async () => {
    if (!user?._id) return

    try {
        console.log('🔍 Fetching bookings for user:', user._id)
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await getBookingsByUser(user._id)  // ← ADD :any
        console.log('📥 Raw API response:', res)
        console.log('📥 Response type:', typeof res, Array.isArray(res))
        
        // ULTRA SAFE ARRAY EXTRACTION
        let userBookings: BookingObject[] = []
        if (Array.isArray(res)) {
            userBookings = res
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if (res && typeof res === 'object' && Array.isArray((res as any).bookings)) {  
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            userBookings = (res as any).bookings  
        }
        
        console.log('📋 FINAL userBookings:', userBookings.length, 'items')
        console.log('📋 First booking:', userBookings[0])
        
        setBookings(userBookings)

        // ULTRA SAFE STATS - NO CRASH!
        const spent = Array.isArray(userBookings) && userBookings.length > 0 
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? userBookings.reduce((sum: number, booking: any) => sum + (booking.total_price || 0), 0)
            : 0
        const total = Array.isArray(userBookings) ? userBookings.length : 0

        setTotalSpent(spent)
        setTotalBookings(total)
        setUpcomingTrips(0)
        setPendingActions(0)
        
    } catch (err) {
        console.error('❌ Failed to fetch bookings:', err)
    } finally {
        setIsLoading(false)
    }
}



    useEffect(() => {
        if (user && user._id) {
            fetchBookings().then(() => setIsLoading(false))
        } else {
            const timer = setTimeout(() => setIsLoading(false), 500)
            return () => clearTimeout(timer)
        }
    }, [user])

    // EDIT & DELETE functions (unchanged)
    const handleEditBooking = async (bookingId: string) => {
        try {
            const bookingToEdit = bookings.find((b) => b._id === bookingId)
            if (!bookingToEdit) {
                alert('Booking not found')
                return
            }
            if (bookingToEdit.status.toLowerCase() !== 'pending') {
                alert('Only pending bookings can be edited')
                return
            }
            router.push(`/profile/bookings/${bookingId}/edit`)
        } catch (error) {
            console.error('❌ Error navigating to edit page:', error)
            alert('Failed to open edit page. Please try again.')
        }
    }

    const handleDeleteBooking = async (bookingId: string) => {
        if (
            !window.confirm(
                'Are you sure you want to delete this booking? This action cannot be undone.'
            )
        )
            return

        try {
            const response = await fetch(
                `${
                    process.env.NEXT_PUBLIC_BACKEND_URL ||
                    'http://localhost:5000/api'
                }/bookings/me/${bookingId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${
                            token || localStorage.getItem('token')
                        }`,
                    },
                }
            )

            if (response.status === 204) {
                setBookings((prev) =>
                    prev.filter((booking) => booking._id !== bookingId)
                )
                setSuccessMessage('Booking deleted successfully!')
                fetchBookings()
                if (response.status === 204) {
                    setBookings((prev) =>
                        prev.filter((booking) => booking._id !== bookingId)
                    )
                    setSuccessMessage('Booking deleted successfully!')
                    fetchBookings().then(() => setIsLoading(false)) // ← ADD THIS
                    setTimeout(() => setSuccessMessage(null), 5000)
                }

                setTimeout(() => setSuccessMessage(null), 5000)
            } else {
                const error = await response.json()
                alert(error.message || 'Failed to delete booking')
            }
        } catch (error) {
            console.error('Error deleting booking:', error)
            alert('Failed to delete booking. Please try again.')
        }
    }

    // Transform bookings for table - UPDATED with nights summary and images
const transformedBookings: BookingTableRow[] = bookings.map((booking) => {
  const firstItem = booking.items && booking.items.length > 0 ? booking.items[0] : null
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = firstItem as any
  
  console.log('🖼️ FULL DEBUG:', {
  item_keys: Object.keys(item || {}),
  has_product_id: !!item?.product_id,
  product_id_keys: item?.product_id ? Object.keys(item.product_id) : 'NO product_id',
  booking_items: booking.items,
  first_item_keys: firstItem ? Object.keys(firstItem) : 'NO firstItem'
})


  let tourName = 'Unknown Tour'
  if (item?.name) tourName = item.name
  else if (item?.product_id?.name) tourName = item.product_id.name

  let location = 'Unknown Location'
  const details = item?.details || item?.product_id?.details || {}
  if (details.from_location && details.to_location) {
    location = `${details.from_location} → ${details.to_location}`
  } else if (details.location) {
    location = details.location
  }

  let dateString = 'Date not set'
  if (booking.createdAt) {
    dateString = new Date(booking.createdAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  let guests = 1
  if (details.quantity) guests = details.quantity
  else if (details.persons_booked) guests = details.persons_booked

  // ✅ FIXED IMAGE EXTRACTION (S3 URLs)
  // ✅ FIXED - CORRECT NESTED PATH!
// Replace image extraction with this (no TS errors):
let imageUrl = ''
//eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeItem = item as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeBooking = booking as any

if (safeItem?.images?.[0]) imageUrl = safeItem.images[0]
else if (safeItem?.product_id?.images?.[0]) imageUrl = safeItem.product_id.images[0]
else if (safeItem?.image) imageUrl = safeItem.image
else if (safeItem?.product_id?.image) imageUrl = safeItem.product_id.image
else if (safeBooking.items?.[0]?.images?.[0]) imageUrl = safeBooking.items[0].images[0]


console.log('🖼️ FIXED DEBUG:', {
  item_images: item?.images?.[0],
  product_images: item?.product_id?.images?.[0],
  final_imageUrl: imageUrl || 'NONE'
})


  let nights = 0
  if (details.nights) nights = details.nights
  else if (details.duration_hours) nights = Math.ceil(details.duration_hours / 24)
  else if (details.start_date && details.end_date) {
    const start = new Date(details.start_date)
    const end = new Date(details.end_date)
    nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    id: booking._id,
    tourName,
    location,
    date: dateString,
    guests,
    amount: booking.total_price || 0,
    status: booking.status
      ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
      : 'Pending',
    payment: booking.paymentStatus
      ? booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)
      : 'Unpaid',
    nights,
    imageUrl,  // ← PASSES S3 URL TO TABLE!
  }
})


    if (isLoading) {
        return (
            <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
                <div className='max-w-7xl mx-auto'>
                    <div className='animate-pulse'>
                        <div className='h-8 bg-gray-200 rounded w-1/4 mb-6'></div>
                        <div className='h-32 bg-gray-200 rounded mb-8'></div>
                        <div className='h-64 bg-gray-200 rounded'></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className='profile-page'>
                <div className='profile-empty'>
                    <h2>No user profile found</h2>
                    <p>Please log in to view your profile.</p>
                    <Link href='/login' className='login-button'>
                        Go to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-7xl mx-auto'>
                {/* SUCCESS MESSAGE TOAST */}
                {successMessage && (
                    <div className='fixed top-4 right-4 z-50 animate-fade-in-down'>
                        <div className='bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg max-w-sm'>
                            <div className='flex items-start'>
                                <FaCheckCircle className='h-5 w-5 text-green-400 mt-0.5' />
                                <div className='ml-3'>
                                    <p className='text-sm text-green-700 font-medium'>
                                        {successMessage}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSuccessMessage(null)}
                                    className='ml-auto text-green-700 hover:text-green-900'
                                >
                                    <svg
                                        className='h-4 w-4'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* USER INFO CARD */}
                <div className='mb-8'>
                    <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
                        <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                            <FaUserCircle className='text-blue-600' />
                            Profile Information
                        </h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='flex items-start gap-3'>
                                <FaEnvelope className='text-gray-500 mt-1' />
                                <div>
                                    <p className='text-sm text-gray-500'>
                                        Email
                                    </p>
                                    <p className='font-medium'>{user.email}</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <FaPhone className='text-gray-500 mt-1' />
                                <div>
                                    <p className='text-sm text-gray-500'>
                                        Phone
                                    </p>
                                    <p className='font-medium'>
                                        {user.phone || 'Not Provided'}
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <FaClock className='text-gray-500 mt-1' />
                                <div>
                                    <p className='text-sm text-gray-500'>
                                        Member Since
                                    </p>
                                    <p className='font-medium'>
                                        {dayjs(user.createdAt).format(
                                            'DD MMM YYYY'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ENHANCED BOOKING SUMMARY DASHBOARD */}
                <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8'>
                    {/* Total Spent */}
                    <div className='bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group'>
                        <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm'>
                                <FaChartLine className='w-6 h-6' />
                            </div>
                            <div className='text-white/80 text-sm font-medium'>
                                Total Spent
                            </div>
                        </div>
                        <div className='text-4xl font-bold mb-1 group-hover:scale-105 transition-transform'>
                            EGP{' '}
                            {totalSpent.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                            })}
                        </div>
                        <p className='text-white/70 text-sm'>
                            Across {totalBookings} bookings
                        </p>
                    </div>

                    {/* Total Bookings */}
                    <div className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group'>
                        <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm'>
                                <FaPlane className='w-6 h-6' />
                            </div>
                            <div className='text-white/80 text-sm font-medium'>
                                Total Bookings
                            </div>
                        </div>
                        <div className='text-4xl font-bold mb-1 group-hover:scale-105 transition-transform'>
                            {totalBookings}
                        </div>
                        <p className='text-white/70 text-sm'>All time</p>
                    </div>

                    {/* Upcoming Trips */}
                    <div className='bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group'>
                        <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm'>
                                <FaCalendarAlt className='w-6 h-6' />
                            </div>
                            <div className='text-white/80 text-sm font-medium'>
                                Upcoming Trips
                            </div>
                        </div>
                        <div className='text-4xl font-bold mb-1 group-hover:scale-105 transition-transform'>
                            {upcomingTrips}
                        </div>
                        <p className='text-white/70 text-sm'>
                            Confirmed + Pending
                        </p>
                    </div>

                    {/* Pending Actions */}
                    <div className='bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group'>
                        <div className='flex items-center justify-between mb-4'>
                            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm'>
                                <FaExclamationTriangle className='w-6 h-6' />
                            </div>
                            <div className='text-white/80 text-sm font-medium'>
                                Pending Actions
                            </div>
                        </div>
                        <div className='text-4xl font-bold mb-1 group-hover:scale-105 transition-transform'>
                            {pendingActions}
                        </div>
                        <p className='text-white/70 text-sm'>Needs attention</p>
                    </div>
                </div>

                {/* BOOKING TABLE SECTION */}
                <div className='mb-8'>
                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
                        <h3 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
                            <FaCalendarAlt className='text-blue-600' />
                            Recent Bookings
                        </h3>
                        <button
                            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium'
                            onClick={() => router.push('/')}
                        >
                            <FaPlus />
                            New Booking
                        </button>
                    </div>

                    {transformedBookings.length > 0 ? (
                        <BookingTable
                            bookings={transformedBookings}
                            onEdit={handleEditBooking}
                            onDelete={handleDeleteBooking}
                        />
                    ) : (
                        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center'>
                            <FaCalendarAlt className='text-gray-300 text-5xl mx-auto mb-4' />
                            <h4 className='text-xl font-semibold text-gray-700 mb-2'>
                                No bookings yet
                            </h4>
                            <p className='text-gray-500 mb-6'>
                                Start your journey by making your first booking
                            </p>
                            <button
                                className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium'
                                onClick={() => router.push('/')}
                            >
                                Explore Tours
                            </button>
                        </div>
                    )}
                </div>

                {/* CSS animation */}
                <style jsx global>{`
                    @keyframes fade-in-down {
                        0% {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .animate-fade-in-down {
                        animation: fade-in-down 0.3s ease-out;
                    }
                `}</style>
            </div>
        </div>
    )
}
