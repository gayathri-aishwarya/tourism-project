// Bus Types
export interface AdminBus {
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

// Trip Template Types
export interface TripTemplate {
  _id: string;
  bus_id: string | AdminBus;
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
  bus_id: string;
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

// Schedule Meta Types
export interface WeeklyScheduleMeta {
  days: number[]; // 0-6 (Sunday-Saturday)
}

export interface MonthlyScheduleMeta {
  dates: number[]; // 1-31
}

// Trip Instance Types
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

export interface GenerateInstancesDTO {
  trip_template_id: string;
  start_date: string;
  end_date: string;
}

export interface UpdateTripInstanceDTO {
  status?: 'active' | 'cancelled';
  travel_date?: string;
}