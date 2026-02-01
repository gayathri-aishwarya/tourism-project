import { Dispatch, SetStateAction } from 'react'
// Types
import {
    LoginRequestType,
    SignupRequestType,
    CreateEmployeeRequestType,
    CreateEmployeeResponseType,
    CreateProductRequestType,
    CreateProductResponseType,
    CreateLocationRequestType,
    CreateLocationResponseType,
    GetEmployeesResponseType,
    GetProductsResponseType,
    GetProductByIdResponseType,
    UpdateEmployeePermissionsRequestType,
    UpdateEmployeePermissionsResponseType,
    UpdateEmployeeRequestType,
    UpdateEmployeeResponseType,
    UpdateLocationResponseType,
    UpdateLocationRequestType,
    UpdateProductRequestType,
    UpdateProductResponseType,
    DeleteProductResponseType,
    GetLocationsResponseType,
    GetLocationsByIdResponseType,
    CreateBundleRequestType,
    CreateBundleResponseType,
    GetBundlesResponseType,
    GetBundleByIdResponseType,
    UpdateBundleRequestType,
    UpdateBundleResponseType,
    DeleteBundleResponseType,
    CreateBranchRequestType,
    CreateBranchResponseType,
    GetBranchesResponseType,
    UpdateBranchRequestType,
    UpdateBranchResponseType,
    DeleteBranchResponseType,
    GetHolidaysResponseType,
    BookingObjectRequest,
} from '@/src/types/backendTypes'
import {
    PaymentObject,
    UserObject,
    BookingObject,
    BranchObject,
    ProductObject,
} from '@/src/types/objectsTypes'

/* ---------------- ARE AUTH MODALS OPEN CONTEXT ---------------- */
export type AreAuthModalsOpenContextType = {
    isLoginModalOpenState: [boolean, Dispatch<SetStateAction<boolean>>]
    isSignUpModalOpenState: [boolean, Dispatch<SetStateAction<boolean>>]
}

/* ---------------- USER CONTEXT ---------------- */
export type UserContextType = {
    user: UserObject | null
    token: string | null
    isAdmin: () => boolean
    isEmployee: () => boolean
    isLoggedIn: () => boolean
    login: (data: LoginRequestType, remember?: boolean) => Promise<void>
    loginGoogle: () => void
    signup: (data: SignupRequestType) => Promise<void>
    logout: () => void
}

/* ---------------- ADMIN CONTEXT ---------------- */
export type AdminContextType = {
    admin: UserObject | null

    /* ------- Users CRUD ------- */
    getUserById: (id: string) => Promise<UserObject | null>

    /* ------- Employees CRUD ------- */
    getEmployees: () => Promise<GetEmployeesResponseType>
    createEmployee: (
        data: CreateEmployeeRequestType
    ) => Promise<CreateEmployeeResponseType>
    updateEmployee: (
        id: string,
        data: UpdateEmployeeRequestType
    ) => Promise<UpdateEmployeeResponseType>
    updateEmployeePermissions: (
        id: string,
        permissions: UpdateEmployeePermissionsRequestType
    ) => Promise<UpdateEmployeePermissionsResponseType>
    deleteEmployee: (id: string) => Promise<boolean>

    /* ------- Locations CRUD ------- */
    getLocations: () => Promise<GetLocationsResponseType['data']>
    getLocationById: (
        id: string
    ) => Promise<GetLocationsByIdResponseType['data']>
    createLocation: (
        data: CreateLocationRequestType,
        file?: File
    ) => Promise<CreateLocationResponseType>
    updateLocation: (
        id: string,
        data: UpdateLocationRequestType,
        file?: File
    ) => Promise<UpdateLocationResponseType>
    deleteLocation: (id: string) => Promise<boolean>


    /* ------- Products CRUD ------- */
createProduct: (
    data: CreateProductRequestType,
    file?: File
) => Promise<CreateProductResponseType | undefined>
// ✅ UPDATED: Changed from (search?: string, limit?: number) to accept filters
getProducts: (
    filters?: {
        search?: string
        limit?: number
        location_id?: string
        type?: string
    }
) => Promise<GetProductsResponseType>
getProductById: (
    id: string
) => Promise<GetProductByIdResponseType | undefined>
updateProduct: (
    id: string,
    data: UpdateProductRequestType,
    file?: File
) => Promise<UpdateProductResponseType | undefined>
deleteProduct: (
    id: string
) => Promise<DeleteProductResponseType | undefined>

    /* ------- Bundles CRUD ------- */
    createBundle: (
        data: CreateBundleRequestType
    ) => Promise<CreateBundleResponseType>
    getBundles: () => Promise<GetBundlesResponseType>
    getBundleById: (id: string) => Promise<GetBundleByIdResponseType>
    updateBundle: (
        id: string,
        data: UpdateBundleRequestType
    ) => Promise<UpdateBundleResponseType>
    deleteBundle: (id: string) => Promise<DeleteBundleResponseType>

    /* ------- Branches CRUD ------- */
    createBranch: (
        data: CreateBranchRequestType
    ) => Promise<CreateBranchResponseType>
    getBranches: () => Promise<GetBranchesResponseType>
    getBranchById: (id: string) => Promise<BranchObject | null>
    updateBranch: (
        id: string,
        data: UpdateBranchRequestType
    ) => Promise<UpdateBranchResponseType>
    deleteBranch: (id: string) => Promise<DeleteBranchResponseType>

    /* ------- Get Holidays ------- */
    getHolidays: () => Promise<GetHolidaysResponseType>

    /* ------- Bookings CRUD ------- */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createBooking: (data: BookingObjectRequest) => Promise<any>
    getBookings: () => Promise<BookingObject[]>
    getBookingsByUser: (id: string) => Promise<BookingObject[]>
    updateBookingStatus: (
        id: string,
        status: BookingObject['status']
    ) => Promise<BookingObject>
    updatePaymentStatus: (
        id: string,
        paymentStatus: BookingObject['paymentStatus']
    ) => Promise<BookingObject>
    /* ------- Payments CRUD ------- */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createPayment: (data: PaymentObject) => Promise<any>
}
