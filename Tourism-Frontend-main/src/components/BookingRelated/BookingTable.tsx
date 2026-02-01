'use client'

import React from 'react'
import Link from 'next/link'
import { FaEdit, FaTrash } from 'react-icons/fa'

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
}

interface BookingTableProps {
  bookings: BookingTableRow[]
  onEdit?: (bookingId: string) => void
  onDelete?: (bookingId: string) => void
}

const BookingTable: React.FC<BookingTableProps> = ({ bookings, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentColor = (payment: string) => {
    switch (payment.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'partial':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canEdit = (status: string) => {
    return status.toLowerCase() === 'pending'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header - 8 COLUMNS */}
      <div className="grid grid-cols-8 bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="font-semibold text-gray-700">Booking ID</div>
        <div className="font-semibold text-gray-700">Tour</div>
        <div className="font-semibold text-gray-700">Date</div>
        <div className="font-semibold text-gray-700">Guests</div>
        <div className="font-semibold text-gray-700">Amount</div>
        <div className="font-semibold text-gray-700">Status</div>
        <div className="font-semibold text-gray-700">Payment</div>
        <div className="font-semibold text-gray-700">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {bookings.map((booking) => (
          <div key={booking.id} className="grid grid-cols-8 px-6 py-4 hover:bg-gray-50 transition-colors">
            {/* 1. Booking ID - Clickable Link ✅ */}
            <div>
              <Link
                href={`/profile/bookings/${booking.id}`}
                className="font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors"
              >
                #{booking.id.slice(0, 8)}
              </Link>
            </div>

            {/* 2. Tour Name & Location */}
            <div>
              <div className="font-medium text-gray-900">{booking.tourName}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <span>📍</span>
                {booking.location}
              </div>
            </div>

            {/* 3. Date */}
            <div className="text-gray-700">{booking.date}</div>

            {/* 4. Guests */}
            <div className="text-gray-700 flex items-center gap-1">
              <span>👥</span>
              {booking.guests}
            </div>

            {/* 5. Amount */}
            <div className="font-semibold text-gray-900">
              EGP {booking.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>

            {/* 6. Booking Status */}
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>

            {/* 7. Payment Status */}
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPaymentColor(booking.payment)}`}>
                {booking.payment}
              </span>
            </div>

            {/* 8. Actions */}
            <div className="flex items-center gap-2">
              {canEdit(booking.status) ? (
                <>
                  <button
                    onClick={() => onEdit?.(booking.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                    title="Edit Booking"
                  >
                    <FaEdit className="text-xs" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDelete?.(booking.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                    title="Delete Booking"
                  >
                    <FaTrash className="text-xs" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <span className="text-gray-400 text-sm italic">Locked</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {bookings.length === 0 && (
        <div className="px-6 py-12 text-center border-t border-gray-100">
          <div className="text-gray-400 text-lg mb-2">No bookings found</div>
        </div>
      )}
    </div>
  )
}

export default BookingTable
