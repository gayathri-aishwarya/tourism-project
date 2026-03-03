export type UserObject = {
    _id: string
    firstName: string
    lastName?: string
    profileImage?: string
    phone: string
    email: string
    password?: string
    role: 'customer' | 'master_admin' | 'employee'
    permissions: string[]
    authProvider: 'local' | 'google'
    branch_id?: string
    createdAt?: string
    updatedAt?: string
    __v?: number
}

export type LocationObject = {
    _id: string
    name: string
    description: string
    heroImage: string
    is_active: boolean
    rating: number
    createdAt?: string
    updatedAt?: string
    __v?: number
}

export type ProductObject = {
    _id: string
    type: string
    name: string
    description: string
    location_id: string
    is_active: boolean
    details: { [key: string]: any } // keep flexible
    createdAt?: string
    updatedAt?: string
    __v?: number
}

export type BundleObject = {
    _id: string
    name: string
    description: string
    location_id: string
    product_ids: string[]
    price: number
    is_active: boolean
    createdAt?: string
    updatedAt?: string
    __v?: number
}

export type PopulatedBundleObject = Omit<BundleObject, 'product_ids'> & {
    product_ids: ProductObject[]
}

export type BranchObject = {
    _id: string
    name: string
    address: string
    phone: string
    createdAt?: string
    updatedAt?: string
    __v?: number
}

export type HolidayObject = {
    _id: string
    name: string
    description: string
    date: Date
    type: string[]
}

export type PaymentObject = {
    bookingId: string
    userId: string
    currency: 'EGP' | 'USD'
}

export type BookingObject = {
    _id: string
    user_id: string
    branch_id: string
    status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
    paymentStatus: 'pending' | 'paid' | 'failed'
    items: ProductObject[]
    total_price: number
    history: {
        timestamp: Date
        employee_id: string
        action: string
    }[]
    createdAt?: string
    updatedAt?: string
    __v?: number
}

export type BusObject = Omit<ProductObject, 'type' | 'details'> & {
    type: 'bus'
    details: {
        img: string
        departure_time: Date
        arrival_time: Date
        from_location: string
        to_location: string
        price_per_seat: number
        bus_model: string
        wifi_available: boolean
        available_times: Date[]
        bus_seats: string
    }
}

export type HotelObject = Omit<ProductObject, 'type' | 'details'> & {
    type: 'hotel'
    details: {
        img: string
        room_types: RoomType[]
        rating: number
        pros: string[]
        cons: string[]
        policy: string
        for_children: boolean
        prices_per_night: PricesPerNight
        available_rooms: AvailableRooms
        reviews: ReviewType[]
        amenities_per_type: AmenitiesPerType
    }
}

export type FlightObject = Omit<ProductObject, 'type' | 'details'> & {
    type: 'flight'
    details: {
        img: string
        airline: string
        flight_number: string
        departure_airport: string
        arrival_airport: string
        departure_time: Date
        arrival_time: Date
        price_per_ticket: number
        flight_type: string
        available_tickets: number
    }
}

export type ActivityObject = Omit<ProductObject, 'type' | 'details'> & {
    type: 'activity'
    details: {
        img: string
        duration_hours: number
        start_time: Date
        price_per_person: number
        max_size: number
        includes: string[]
        difficulty_level: 'Easy' | 'Moderate' | 'Hard'
    }
}

// Other Types
export type RoomType = 'Single' | 'Double' | 'Triple'

export type SeatType = {
    id: string
    number: number
    isBooked: boolean
}

export type SeatRowType = {
    left: SeatType[]
    right: SeatType[]
    middle?: SeatType[]
}

export type BusSeatsLayout = {
    rows: SeatRowType[]
}

type SingleDoubleTripleNumbers = {
    single: number
    double: number
    triple: number
}

export type AvailableRooms = SingleDoubleTripleNumbers

export type PricesPerNight = SingleDoubleTripleNumbers

export type AmenitiesPerType = {
    single: string[]
    double: string[]
    triple: string[]
}

export type ReviewType = {
    name: string
    rating: number
    text: string
}


export type TripInstance = {
    _id: string
    bus_id: string
    trip_template_id: string
    trip_template?: BusObject 
    travel_date: Date
    booked_seats: string[]; 
    all_seats: string[]
    createdAt?: string
    updatedAt?: string
}
