import axios from './axios';

// ========== TYPE DEFINITIONS ==========

export interface GenerateInstancesDTO {
  trip_template_id: string;
  start_date: string;
  end_date: string;
}

export interface UpdateTripInstanceDTO {
  status?: 'active' | 'cancelled' | 'completed';
  travel_date?: string;
}

export interface Bus {
  _id: string;
  vehicle_no: string;
  bus_type: 'seater' | 'sleeper' | 'semi-sleeper';
  total_seats: number;
  seat_layout: string[][] | string[];
  created_at: string;
  updated_at: string;
}

export interface CreateBusDTO {
  vehicle_no: string;
  bus_type: 'seater' | 'sleeper' | 'semi-sleeper';
  total_seats: number;
  seat_layout?: string[][] | string[];
}

export interface TripTemplate {
  _id: string;
  bus_id: string | Bus;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  ticket_price: number;
  schedule_type: 'never' | 'daily' | 'weekly' | 'monthly';
  schedule_meta: any;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTripTemplateDTO {
  bus_id?: string;        
  vehicle_no: string;      
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration?: number;
  ticket_price: number;
  schedule_type: 'never' | 'daily' | 'weekly' | 'monthly';
  schedule_meta?: any;
  is_active?: boolean;
}

export interface TripInstance {
  _id: string;
  trip_template_id: string | TripTemplate;
  travel_date: string;
  booked_seats: string[];
  available_seats: number;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

// ========== API SERVICE ==========

export const adminBusApi = {
  // ========== BUS MANAGEMENT ==========
  
  /**
   * Get all buses
   */
  getBuses: async () => {
    try {
      const { data } = await axios.get('/buses');
      return data;
    } catch (error) {
      console.error('Error fetching buses:', error);
      throw error;
    }
  },

/**
 * Get single bus by vehicle number
 * Note: Your backend might expect a different URL structure
 */
getBus: async (identifier: string) => {
  try {
    // Try multiple approaches
    console.log('Fetching bus with identifier:', identifier);
    
    // First, try to get all buses and find by ID or vehicle_no
    const { data } = await axios.get('/buses');
    
    if (data && data.buses) {
      // Try to find by _id first (if it's an ID)
      let bus = data.buses.find((b: any) => b._id === identifier);
      
      // If not found by ID, try by vehicle_no
      if (!bus) {
        bus = data.buses.find((b: any) => b.vehicle_no === identifier);
      }
      
      if (bus) {
        return { success: true, bus };
      }
    }
    
    throw new Error('Bus not found');
  } catch (error) {
    console.error('Error fetching bus:', error);
    throw error;
  }
},

  /**
   * Create a new bus
   */
  createBus: async (busData: CreateBusDTO) => {
    try {
      const { data } = await axios.post('/buses', busData);
      return data;
    } catch (error) {
      console.error('Error creating bus:', error);
      throw error;
    }
  },

  /**
   * Update an existing bus - IMPORTANT: Uses vehicle_no, not _id
   */
  updateBus: async (vehicleNo: string, busData: Partial<CreateBusDTO>) => {
    try {
      console.log('Updating bus with vehicle_no:', vehicleNo);
      console.log('Update data:', busData);
      
      const { data } = await axios.put(`/buses/${vehicleNo}`, busData);
      return data;
    } catch (error) {
      console.error('Error updating bus:', error);
      throw error;
    }
  },

  /**
   * Delete a bus - IMPORTANT: Uses vehicle_no, not _id
   */
  deleteBus: async (vehicleNo: string) => {
    try {
      console.log('Deleting bus with vehicle_no:', vehicleNo);
      
      const { data } = await axios.delete(`/buses/${vehicleNo}`);
      return data;
    } catch (error) {
      console.error('Error deleting bus:', error);
      throw error;
    }
  },

  /**
   * Generate seat layout based on bus type and total seats
   */
  generateSeatLayout: async (busType: string, totalSeats: number) => {
    try {
      const { data } = await axios.post('/buses/generate-layout', { 
        bus_type: busType, 
        total_seats: totalSeats 
      });
      return data;
    } catch (error) {
      console.error('Error generating layout:', error);
      throw error;
    }
  },

  // ========== TRIP TEMPLATES ==========

  /**
   * Get all trip templates
   */
  getTripTemplates: async () => {
    try {
      const { data } = await axios.get('/trip-templates');
      return data;
    } catch (error) {
      console.error('Error fetching trip templates:', error);
      throw error;
    }
  },

  /**
   * Get single trip template by ID
   */
  getTripTemplate: async (id: string) => {
    try {
      const { data } = await axios.get(`/trip-templates/${id}`);
      return data;
    } catch (error) {
      console.error('Error fetching trip template:', error);
      throw error;
    }
  },

  /**
   * Create a new trip template
   */
createTripTemplate: async (templateData: CreateTripTemplateDTO) => {
  try {
    console.log('🚀 Sending trip template data:', JSON.stringify(templateData, null, 2));
    console.log('URL:', '/trip-templates');
    console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    
    const { data } = await axios.post('/trip-templates', templateData);
    console.log('✅ Response:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Error creating trip template:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data ? JSON.parse(error.config.data) : null
      }
    });
    throw error;
  }
},

  /**
   * Update an existing trip template
   */
  updateTripTemplate: async (id: string, templateData: Partial<CreateTripTemplateDTO>) => {
    try {
      const { data } = await axios.put(`/trip-templates/${id}`, templateData);
      return data;
    } catch (error) {
      console.error('Error updating trip template:', error);
      throw error;
    }
  },

  /**
   * Delete a trip template
   */
  deleteTripTemplate: async (id: string) => {
    try {
      const { data } = await axios.delete(`/trip-templates/${id}`);
      return data;
    } catch (error) {
      console.error('Error deleting trip template:', error);
      throw error;
    }
  },

  // ========== TRIP INSTANCES ==========

  /**
   * Get all trip instances with optional filters
   */
  getTripInstances: async (filters?: { 
    trip_template_id?: string; 
    status?: string; 
    date?: string;
    from_date?: string;
    to_date?: string;
  }) => {
    try {
      const { data } = await axios.get('/trip-instances', { params: filters });
      return data;
    } catch (error) {
      console.error('Error fetching trip instances:', error);
      throw error;
    }
  },

  /**
   * Get single trip instance by ID
   */
  getTripInstance: async (id: string) => {
    try {
      const { data } = await axios.get(`/trip-instances/${id}`);
      return data;
    } catch (error) {
      console.error('Error fetching trip instance:', error);
      throw error;
    }
  },

  /**
   * Generate trip instances for a date range based on template schedule
   */
  generateInstances: async (payload: GenerateInstancesDTO) => {
    try {
      const { data } = await axios.post('/trip-instances/generate', payload);
      return data;
    } catch (error) {
      console.error('Error generating instances:', error);
      throw error;
    }
  },

  /**
   * Update a trip instance (status, date, etc.)
   */
  updateTripInstance: async (id: string, updateData: UpdateTripInstanceDTO) => {
    try {
      const { data } = await axios.put(`/trip-instances/${id}`, updateData);
      return data;
    } catch (error) {
      console.error('Error updating trip instance:', error);
      throw error;
    }
  },


  /**
 * Delete a trip instance (permanent delete)
 * Note: This will only work if there are no bookings for this instance
 */
deleteTripInstance: async (id: string) => {  // ✅ ADD THIS METHOD
  try {
    const { data } = await axios.delete(`/trip-instances/${id}`);
    return data;
  } catch (error) {
    console.error('Error deleting trip instance:', error);
    throw error;
  }
},

/**
 * Cancel a trip instance (soft delete - changes status to cancelled)
 */
cancelTripInstance: async (id: string) => {
  try {
    const { data } = await axios.delete(`/trip-instances/${id}/cancel`);
    return data;
  } catch (error) {
    console.error('Error cancelling trip instance:', error);
    throw error;
  }
},


getBusPublic: async (id: string) => {
  try {
    console.log('Fetching bus public with ID:', id);
    const { data } = await axios.get(`/buses/public/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching bus public:', error);
    throw error;
  }
},
  // ========== DASHBOARD STATS ==========

  /**
   * Get dashboard statistics for buses module
   */
  getDashboardStats: async () => {
    try {
      const { data } = await axios.get('/buses/stats');
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Get upcoming trips for the next N days
   */
  getUpcomingTrips: async (days: number = 7) => {
    try {
      const { data } = await axios.get('/trip-instances/upcoming', { 
        params: { days } 
      });
      return data;
    } catch (error) {
      console.error('Error fetching upcoming trips:', error);
      throw error;
    }
  }
};