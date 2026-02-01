const mongoose = require('mongoose')
const Booking = require('../models/booking')
const Payment = require('../models/payment')


async function getOverview({start, end, branchId}){
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (Number.isNaN(startDate) || Number.isNaN(endDate)){
        throw new Error('Invalid start or end date')
    }

    const match = {
        createdAt: {$gte: startDate, $lte: endDate}
    }

    if (branchId){
        try{
            match.branchId = new mongoose.Types.ObjectId(String(branchId))
        }catch{
            throw new Error('Invalid branch_id')
        }
    }

    const [agg] = await Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            paidBookings: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'paid'] },
                      { $eq: ['$paymentStatus', 'paid'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            failedBookings: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0],
              },
            },
            totalRevenue: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'paid'] },
                      { $eq: ['$paymentStatus', 'paid'] },
                    ],
                  },
                  { $ifNull: ['$total_price', 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalBookings: 1,
            paidBookings: 1,
            failedBookings: 1,
            avgOrderValue: {
              $cond: [
                { $gt: ['$paidBookings', 0] },
                { $divide: ['$totalRevenue', '$paidBookings'] },
                0,
              ],
            },
          },
        },
      ])

    // Count payments in the same date range
    const paymentFilter = { createdAt: { $gte: startDate, $lte: endDate } }

    const [intentionsCreated, paymentsCompleted] = await Promise.all([
    Payment.countDocuments(paymentFilter),
    Payment.countDocuments({ ...paymentFilter, status: 'completed' }),
    ])

    const conversionRate = intentionsCreated > 0 ? paymentsCompleted / intentionsCreated : 0

    return {
        totalRevenue: agg?.totalRevenue || 0,
        totalBookings: agg?.totalBookings || 0,
        paidBookings: agg?.paidBookings || 0,
        failedBookings: agg?.failedBookings || 0,
        avgOrderValue: agg?.avgOrderValue || 0,
        intentionsCreated,
        paymentsCompleted,
        conversionRate,
    }


}

async function getTopProducts({start, end, branchId, sortBy ='revenue', limit=10, type}){
  const startDate = new Date(start)
  const endDate = new Date(end)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())){
    throw new Error('Invalid start or end date')
  }
  
  const matchPaid = {
    createdAt: {$gte: startDate, $lte: endDate},
    $or: [{status:'paid'}, {paymentStatus:'paid'}]
  }

  if (branchId){
    try{
      matchPaid.branch_id = new mongoose.Types.ObjectId(String(branchId))
    }catch{
      throw new Error('Invalid branch_id')
    }
  }


  
  const pipeline = [
    { $match: matchPaid },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product_id',
        revenue: {
          $sum: {
            $multiply: ['$items.amount', { $ifNull: ['$items.quantity', 1] }],
          },
        },
        bookingIds: { $addToSet: '$_id' },
        units: { $sum: { $ifNull: ['$items.quantity', 1] } },
      },
    },
    { $project: { _id: 1, revenue: 1, bookings: { $size: '$bookingIds' }, units: 1 } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
  ]

  if (type) {
    pipeline.push({ $match: { 'product.type': type } })
  }

  pipeline.push(
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$product.name',
        type: '$product.type',
        locationId: '$product.location_id',
        revenue: 1,
        bookings: 1,
        units: 1,
      },
    },
    { $sort: sortBy === 'bookings' ? { bookings: -1, revenue: -1 } : { revenue: -1, bookings: -1 } },
    { $limit: Number(limit) }
  )

  const results = await Booking.aggregate(pipeline)
  return results
}

module.exports = {
    getOverview,
    getTopProducts
}