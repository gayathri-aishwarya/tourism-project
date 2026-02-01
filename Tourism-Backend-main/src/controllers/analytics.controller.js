const catchAsync = require('../utils/catchAsync')
const {successResponse} = require('../utils/responseHandlers')
const analyticsService = require('../services/analytics.service')

exports.getOverview = catchAsync(async (req, res)=>{
    const {start, end, branch_id: branchId} = req.query

    if (!start || !end){
        return res.status(400).json({message:'start and end are required ISO dates'})
    }

    const data = await analyticsService.getOverview({start, end, branchId})
    successResponse(res, data, 200, 'Overview analytics computed')
})

exports.getTopProducts = catchAsync(async (req, res) =>{
    const {start, end, branch_id: branchId,sortBy = 'revenue', limit = 10, type } = req.query

    if (!start || !end){
        return res.status(400).json({message:'start and end are required ISO dates'})
    }

    const data = await analyticsService.getTopProducts({
        start,
        end,
        branchId,
        sortBy,
        limit: Number(limit),
        type
    })

    successResponse(res, data, 200, 'Top products analytics computed')
})