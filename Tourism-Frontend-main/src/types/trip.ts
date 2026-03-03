export interface TripInstance {
  _id: string
  travel_date: string
  available_seats: number
  status: 'active' | 'cancelled'

  trip_template_id: {
    from_location: string
    to_location: string
    departure_time: string
    arrival_time: string
    ticket_price: number
  }
}
