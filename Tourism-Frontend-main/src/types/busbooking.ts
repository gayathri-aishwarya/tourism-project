// src/types/busbooking.ts - ADD THESE

export interface Bus {
  _id: string;
  vehicle_no: string;
  bus_type: 'seater' | 'sleeper' | 'semi-sleeper';
  total_seats: number;
  seat_layout: string[][] | string[];
}

export interface TripTemplate {
  _id: string;
  bus_id: Bus | string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  ticket_price: number;
  is_active: boolean;
}

export interface TripInstance {
  _id: string;
  trip_template_id: TripTemplate | string;
  travel_date: string;
  booked_seats: string[];
  all_seats: string[];
  available_seats: number;
  status: 'active' | 'cancelled' | 'completed';
  seats?: { [key: string]: SeatAvailability };
}

export interface SeatAvailability {
  number: string;
  isBooked: boolean;
  isAvailable: boolean;
}

export interface BusBookingSeat {
  _id?: string;
  seat_number: string;
  passenger_name: string;
  age: number;
  price_paid?: number;
}

export interface BusBooking {
  _id: string;
  user_id: string;
  trip_instance_id: TripInstance | string;
  phone: string;
  total_fare: number;
  booking_status: 'confirmed' | 'cancelled' | 'completed';
  booking_reference: string;
  seats?: BusBookingSeat[];
  createdAt: string;
}

export interface CreateBusBookingPayload {
  trip_instance_id: string;
  phone: string;
  seats: {
    seat_number: string;
    passenger_name: string;
    age: number;
  }[];
}

export interface TripSearchParams {
  from: string;
  to: string;
  date: string;
  bus_type?: string;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  trips: TripInstance[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}