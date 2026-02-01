// src/services/websiteLead.service.js
const WebsiteLead = require('../models/websiteLead');
const { 
  calculatePhoneDiscount, 
  generateDiscountCode,
  isValidEgyptianPhone 
} = require('../utils/discountUtils');
const ApiError = require('../utils/apiError');

/**
 * Create a new website lead
 */
const createWebsiteLead = async (leadData, trackingData = {}) => {
  const {
    name,
    email,
    phone,
    address,
    marital_status,
    age,
    job,
    gender,
    consent_given,
    terms_accepted,
    marketing_consent
  } = leadData;

  // Validate phone number
  if (!isValidEgyptianPhone(phone)) {
    throw new ApiError(400, 'Please enter a valid Egyptian mobile number');
  }

  // Check if email already exists
  const existingLead = await WebsiteLead.findOne({ email });
  if (existingLead) {
    throw new ApiError(400, 'Email already registered in our leads system');
  }

  // Calculate discount
  const discount_amount = calculatePhoneDiscount(phone);
  
  // Generate discount code (check for uniqueness)
  let discount_code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (!isUnique && attempts < maxAttempts) {
    discount_code = generateDiscountCode(phone);
    const existingCode = await WebsiteLead.findOne({ discount_code });
    
    if (!existingCode) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    // Fallback to timestamp-based code
    discount_code = `FAY-${phone.slice(-4)}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  }
  
  // Set discount expiry (30 days from now)
  const discount_expiry = new Date();
  discount_expiry.setDate(discount_expiry.getDate() + 30);

  // Prepare lead object
  const lead = new WebsiteLead({
    name,
    email,
    phone,
    address,
    marital_status,
    age,
    job,
    gender,
    discount_amount,
    discount_code,
    discount_expiry,
    consent_given: consent_given || false,
    terms_accepted: terms_accepted || false,
    marketing_consent: marketing_consent || false,
    ...trackingData
  });

  // Save to database
  await lead.save();
  
  // Return plain object (no success wrapper)
  return {
    lead: lead.toObject(),
    discount: {
      amount: discount_amount,
      code: discount_code,
      expiry: discount_expiry
    }
  };
};

/**
 * Get all leads with pagination and filtering
 */
const getAllLeads = async (filters = {}, options = {}) => {
  const {
    status,
    discount_used,
    date_from,
    date_to,
    search
  } = filters;

  const page = Math.max(1, parseInt(options.page || 1, 10));
  const limit = Math.max(1, parseInt(options.limit || 20, 10));
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  if (status) query.status = status;
  if (discount_used !== undefined) query.discount_used = discount_used;
  
  // Date range filter
  if (date_from || date_to) {
    query.created_at = {};
    if (date_from) query.created_at.$gte = new Date(date_from);
    if (date_to) query.created_at.$lte = new Date(date_to);
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query
  const [leads, total] = await Promise.all([
    WebsiteLead.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WebsiteLead.countDocuments(query)
  ]);

  // Return plain object (no success wrapper)
  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get lead by ID
 */
const getLeadById = async (id) => {
  const lead = await WebsiteLead.findById(id).lean();
  
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  // Return plain object (no success wrapper)
  return { lead };
};

/**
 * Update lead status
 */
const updateLeadStatus = async (id, updates) => {
  const lead = await WebsiteLead.findByIdAndUpdate(
    id,
    { 
      ...updates,
      updated_at: new Date()
    },
    { new: true, runValidators: true }
  ).lean();

  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  // Return plain object (no success wrapper)
  return { lead };
};

/**
 * Validate discount code
 */
const validateDiscountCode = async (discountCode) => {
  const lead = await WebsiteLead.findOne({ 
    discount_code: discountCode.toUpperCase()
  }).lean();

  if (!lead) {
    throw new ApiError(404, 'Discount code not found');
  }

  if (lead.discount_used) {
    throw new ApiError(400, 'Discount code has already been used');
  }

  if (new Date() > lead.discount_expiry) {
    throw new ApiError(400, 'Discount code has expired');
  }

  // Return plain object (no success wrapper)
  return {
    valid: true,
    discount_amount: lead.discount_amount,
    expiry_date: lead.discount_expiry,
    lead_id: lead._id
  };
};

/**
 * Mark discount as used
 */
const useDiscountCode = async (discountCode, bookingId) => {
  const lead = await WebsiteLead.findOne({ 
    discount_code: discountCode.toUpperCase()
  });

  if (!lead) {
    throw new ApiError(404, 'Discount code not found');
  }

  if (!lead.isDiscountValid()) {
    throw new ApiError(400, 'Discount code is no longer valid');
  }

  await lead.markDiscountUsed(bookingId);

  // Return plain object (no success wrapper)
  return {
    message: 'Discount applied successfully',
    discount_amount: lead.discount_amount,
    lead_id: lead._id
  };
};

/**
 * Export leads to CSV
 */
const exportLeadsToCSV = async (filters = {}) => {
  const query = {};
  
  if (filters.date_from || filters.date_to) {
    query.created_at = {};
    if (filters.date_from) query.created_at.$gte = new Date(filters.date_from);
    if (filters.date_to) query.created_at.$lte = new Date(filters.date_to);
  }

  const leads = await WebsiteLead.find(query)
    .sort({ created_at: -1 })
    .lean();

  // Convert to CSV format
  const headers = [
    'Name', 'Email', 'Phone', 'Discount Amount', 'Discount Code',
    'Discount Expiry', 'Discount Used', 'Created At', 'Status'
  ];

  const rows = leads.map(lead => [
    lead.name,
    lead.email,
    lead.phone,
    lead.discount_amount,
    lead.discount_code,
    new Date(lead.discount_expiry).toLocaleDateString(),
    lead.discount_used ? 'Yes' : 'No',
    new Date(lead.created_at).toLocaleDateString(),
    lead.status
  ]);

  return {
    headers,
    rows,
    count: leads.length
  };
};

module.exports = {
  createWebsiteLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  validateDiscountCode,
  useDiscountCode,
  exportLeadsToCSV
};