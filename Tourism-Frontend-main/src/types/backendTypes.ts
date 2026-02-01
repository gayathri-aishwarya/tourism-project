import {
    LocationObject,
    UserObject,
    ProductObject,
    BundleObject,
    PopulatedBundleObject,
    BranchObject,
    HolidayObject,
} from '@/src/types/objectsTypes'

/* ------- ENDPOINT: POST /auth/register ------- */
export type SignupRequestType = {
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
}

export type SignupResponseType = UserObject & {}

/* ------- ENDPOINT: POST /auth/login ------- */
export type LoginRequestType = {
    email: string
    password: string
}

export type LoginResponseType = {
    user: UserObject
    token: string
}

/* ------- ENDPOINT: POST /auth/login ------- */
export type WithGoogleResponseType = LoginResponseType & {}

/* ------- ENDPOINT: GET /auth/me ------- */
export type MeResponseType = {
    user: UserObject
}

/* ------- ENDPOINT: GET /users/employees ------- */
export type GetEmployeesResponseType = UserObject[]

/* ------- ENDPOINT: POST /users/employees ------- */
export type CreateEmployeeRequestType = Omit<UserObject, '_id' | '__v'>

export type CreateEmployeeResponseType = UserObject | undefined

/* ------- ENDPOINT: PUT /users/employees/:id ------- */
export type UpdateEmployeeRequestType = Partial<UserObject>

export type UpdateEmployeeResponseType = UserObject | undefined

/* ------- ENDPOINT: PUT /users/employees/:id/permissions ------- */
export type UpdateEmployeePermissionsRequestType = string[]

export type UpdateEmployeePermissionsResponseType = UserObject | undefined

/* ------- ENDPOINT: GET /locations ------- */
export type GetLocationsResponseType = {
    success: boolean
    data: LocationObject[]
}

/* ------- ENDPOINT: GET /locations/:id ------- */
export type GetLocationsByIdResponseType = {
    success: boolean
    data: LocationObject | undefined
}

/* ------- ENDPOINT: POST /locations ------- */
export type CreateLocationRequestType = Omit<
    LocationObject,
    '_id' | '__v' | 'heroImage'
>

export type CreateLocationResponseType = LocationObject | undefined

/* ------- ENDPOINT: PUT /locations/:id ------- */
export type UpdateLocationRequestType = Partial<LocationObject>

export type UpdateLocationResponseType = LocationObject | undefined

/* ------- ENDPOINT: POST /products ------- */
export type CreateProductRequestType = Omit<ProductObject, '_id' | '__v'>

export type CreateProductResponseType = ProductObject

/* ------- ENDPOINT: GET /products ------- */
export type GetProductsResponseType = {
    items: ProductObject[]
    total: number
    page: number
    limit: number
}

/* ------- ENDPOINT: GET /products/:id ------- */
export type GetProductByIdResponseType = ProductObject

/* ------- ENDPOINT: PUT /products/:id ------- */
export type UpdateProductRequestType = Partial<CreateProductRequestType>

export type UpdateProductResponseType = ProductObject

/* ------- ENDPOINT: DELETE /products/:id ------- */
export type DeleteProductResponseType = {
    message?: string
    product: ProductObject
}

/* ------- ENDPOINT: POST /bundles ------- */
export type CreateBundleRequestType = Omit<BundleObject, '_id' | '__v'>

export type CreateBundleResponseType = BundleObject

/* ------- ENDPOINT: GET /bundles ------- */
export type GetBundlesResponseType = PopulatedBundleObject[]

/* ------- ENDPOINT: GET /bundles/:id ------- */
export type GetBundleByIdResponseType = PopulatedBundleObject

/* ------- ENDPOINT: PUT /bundles/:id ------- */
export type UpdateBundleRequestType = Partial<CreateBundleRequestType>

export type UpdateBundleResponseType = BundleObject

/* ------- ENDPOINT: DELETE /bundles/:id ------- */
export type DeleteBundleResponseType = {
    message?: string
    bundle: BundleObject
}

/* ------- ENDPOINT: POST /branches ------- */
export type CreateBranchRequestType = Omit<BranchObject, '_id' | '__v'>

export type CreateBranchResponseType = BranchObject

/* ------- ENDPOINT: GET /branches ------- */
export type GetBranchesResponseType = BranchObject[]

/* ------- ENDPOINT: PUT /branches/:id ------- */
export type UpdateBranchRequestType = Partial<CreateBranchRequestType>

export type UpdateBranchResponseType = BranchObject

/* ------- ENDPOINT: DELETE /bundles/:id ------- */
export type DeleteBranchResponseType = {
    message?: string
    branch: BranchObject
}

/* ------- ENDPOINT: GET /holidays/upcoming ------- */
export type GetHolidaysResponseType = {
    message?: string
    holidays: Partial<HolidayObject>[]
}

/* ------- ENDPOINT: POST /bookings ------- */
export type BookingObjectRequest = {
    user_id: string
    branch_id: string
    items: BookingItemRequest[]
}

// Union type for items depending on product
export type BookingItemRequest =
    | ActivityBooking
    | HotelBooking
    | FlightBooking
    | BusBooking

// Activity booking
export type ActivityBooking = {
    product_id: string
    details: {
        number_of_persons: number
    }
}

// Hotel booking
export type HotelBooking = {
    product_id: string
    details: {
        room_type: string
        quantity: number
        start_date: string // ISO string
        end_date: string // ISO string
    }
}

// Flight booking
export type FlightBooking = {
    product_id: string
    details: {
        tickets_booked: number
        departure_time: string // ISO string
    }
}

// Bus booking
export type BusBooking = {
    product_id: string
    details: {
        seat_numbers: number[]
    }
}

/* ------- ENDPOINT: POST /payments ------- */
export type CreatePaymentResponseType = {
    success: boolean
    data: {
        clientSecret: string
    }
}
