'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect, PropsWithChildren, useContext } from 'react'
// Types
import {
    BranchObject,
    PaymentObject,
    BookingObject,
    UserObject,
} from '@/src/types/objectsTypes'
import {
    LoginRequestType,
    LoginResponseType,
    WithGoogleResponseType,
    SignupResponseType,
    SignupRequestType,
    MeResponseType,
    GetEmployeesResponseType,
    CreateEmployeeResponseType,
    CreateEmployeeRequestType,
    UpdateEmployeeRequestType,
    UpdateEmployeeResponseType,
    UpdateEmployeePermissionsRequestType,
    UpdateEmployeePermissionsResponseType,
    GetLocationsResponseType,
    GetLocationsByIdResponseType,
    DeleteProductResponseType,
    BookingObjectRequest,
    CreatePaymentResponseType,
} from '@/src/types/backendTypes'
// Contexts
import {
    AdminContext,
    AreAuthModalsOpenContext,
    UserContext,
} from '../contexts/Contexts'

// Server Endpoint
const server = process.env.NEXT_PUBLIC_BACKEND_URL

const endpoints = { //with API prefix
    me: 'api/auth/me',              
    login: 'api/auth/login',        
    register: 'api/auth/register',   
    withGoogle: 'api/auth/google',   
    employees: 'api/users/employees', 
    users: 'api/users',              
    locations: 'api/locations',      
    products: 'api/products',        
    bundles: 'api/bundles',          
    branches: 'api/branches',        
    holidays: 'api/holidays/upcoming', 
    bookings: 'api/bookings',        
    bookingStatus: 'api/bookings/:id/status',       
    bookingPayment: 'api/bookings/:id/payment-status', 
    payment: 'api/payments/create-intention',

}

export const AreAuthModalsOpenProvider = ({ children }: PropsWithChildren) => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)

    return (
        <AreAuthModalsOpenContext.Provider
            value={{
                isLoginModalOpenState: [isLoginModalOpen, setIsLoginModalOpen],
                isSignUpModalOpenState: [
                    isSignUpModalOpen,
                    setIsSignUpModalOpen,
                ],
            }}
        >
            {children}
        </AreAuthModalsOpenContext.Provider>
    )
}

export const UserProvider = ({ children }: PropsWithChildren) => {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [user, setUser] = useState<UserObject | null>(null)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        const getToken =
            localStorage.getItem('token') || sessionStorage.getItem('token')
        if (getToken) {
            setToken(getToken)

            if (token) fetchUser(token).then()
        }
    }, [token])

    useEffect(() => {
        const saveGoogleUser = async () => {
            if (status === 'authenticated' && session?.user) {
                const data = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.name,
                    image: session.user.image,
                }

                try {
                    const res = await axios.post<WithGoogleResponseType>(
                        `${server}/${endpoints.withGoogle}`,
                        data,
                        { headers: { 'Content-Type': 'application/json' } }
                    )

                    const token = res.data.token
                    sessionStorage.setItem('token', token)
                    setUser(res.data.user)
                    setToken(token)
                } catch (err) {
                    console.error('Failed to save Google user:', err)
                }
            }
        }

        saveGoogleUser().then()
    }, [status, session])

    const isAdmin = () => {
        return !!user && user.role === 'master_admin'
    }

    const isEmployee = () => {
        return !!user && user.role === 'employee'
    }

    const isLoggedIn = () => {
        return !!user
    }

    const fetchUser = async (token: string) => {
        try {
            const res = await axios.get<MeResponseType>(
                `${server}/${endpoints.me}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            setUser(res.data.user)
        } catch (err) {
            console.error('Failed to fetch user:', err)
            throw err
        }
    }

    const login = async (data: LoginRequestType, remember = false) => {
        try {
            const res = await axios.post<LoginResponseType>(
                `${server}/${endpoints.login}`,
                data,
                { headers: { 'Content-Type': 'application/json' } }
            )

            const token = res.data.token

            // Save token based on "Remember me"
            if (remember) {
                localStorage.setItem('token', token)
            } else {
                sessionStorage.setItem('token', token)
            }

            setUser(res.data.user)
            setToken(res.data.token)
        } catch (err) {
            console.error('Login failed', err)
            throw err
        }
    }

    const loginGoogle = () => {
        signIn('google', { redirect: false, prompt: 'select_account' }).then()
    }

    const signup = async (data: SignupRequestType) => {
        try {
            await axios.post<SignupResponseType>(
                `${server}/${endpoints.register}`,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            const loginData: LoginRequestType = {
                email: data.email,
                password: data.password,
            }

            await login(loginData)
        } catch (err) {
            console.error('Signup failed:', err)
            throw err
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        setUser(null)
        signOut({ redirect: false, callbackUrl: '/' }).then(() => {
            router.replace('/')
        })
    }

    return (
        <UserContext.Provider
            value={{
                user,
                token,
                isAdmin,
                isEmployee,
                isLoggedIn,
                login,
                loginGoogle,
                signup,
                logout,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}

export const AdminProvider = ({ children }: PropsWithChildren) => {
    const router = useRouter()
    const { user, token } = useContext(UserContext)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [admin, _] = useState<UserObject | null>(user)

    // Users CRUD
    const getUserById = async (id: string): Promise<UserObject | null> => {
        try {
            const res = await axios.get(`${server}/${endpoints.users}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            return res.data
        } catch (err) {
            console.error('Getting user by ID failed:', err)
            return null
        }
    }

    // Employees CRUD
    const getEmployees = async () => {
        try {
            const res = await axios.get<GetEmployeesResponseType>(
                `${server}/${endpoints.employees}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            return res.data
        } catch (err) {
            console.error('Getting employees failed:', err)
            return []
        }
    }

    const createEmployee = async (data: CreateEmployeeRequestType) => {
        try {
            const res = await axios.post<CreateEmployeeResponseType>(
                `${server}/${endpoints.employees}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Creating employee failed:', err)
            throw err
        }
    }

    const updateEmployee = async (
        id: string,
        data: UpdateEmployeeRequestType
    ) => {
        try {
            const res = await axios.put<UpdateEmployeeResponseType>(
                `${server}/${endpoints.employees}/${id}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Updating employee failed:', err)
            throw err
        }
    }

    const updateEmployeePermissions = async (
        id: string,
        permissions: UpdateEmployeePermissionsRequestType
    ) => {
        try {
            const res = await axios.put<UpdateEmployeePermissionsResponseType>(
                `${server}/${endpoints.employees}/${id}/permissions`,
                { permissions },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Updating employee permissions failed:', err)
            throw err
        }
    }

    const deleteEmployee = async (id: string) => {
        try {
            await axios.delete(`${server}/${endpoints.employees}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            return true
        } catch (err) {
            console.error('Deleting employee failed:', err)
            return false
        }
    }

    // Locations CRUD
    const getLocations = async () => {
        try {
            const res = await axios.get<GetLocationsResponseType>(
                `${server}/${endpoints.locations}`
            )

            return res.data.data
        } catch (err) {
            console.error('Getting employees failed:', err)
            return []
        }
    }

    const getLocationById = async (id: string) => {
        try {
            const res = await axios.get<GetLocationsByIdResponseType>(
                `${server}/${endpoints.locations}/${id}`
            )

            return res.data.data
        } catch (err) {
            console.error('Getting employees failed:', err)
            throw err
        }
    }

    const createLocation = async (
        data: Record<string, unknown>,
        file?: File
    ) => {
        try {
            const formData = new FormData()

            Object.entries(data).forEach(([key, value]) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formData.append(key, value as any)
            })

            if (file) {
                formData.append('heroImage', file)
            }

            const res = await axios.post(
                `${server}/${endpoints.locations}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Creating location failed:', err)
            throw err
        }
    }

    const updateLocation = async (
        id: string,
        data: Record<string, unknown>,
        file?: File
    ) => {
        try {
            const formData = new FormData()

            Object.entries(data).forEach(([key, value]) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formData.append(key, value as any)
            })

            if (file) {
                formData.append('heroImage', file)
            }

            const res = await axios.put(
                `${server}/${endpoints.locations}/${id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Updating location failed:', err)
            throw err
        }
    }

    const deleteLocation = async (id: string) => {
        try {
            await axios.delete(`${server}/${endpoints.locations}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            return true
        } catch (err) {
            console.error('Deleting location failed:', err)
            return false
        }
    }

    // Products CRUD
    const createProduct = async (
        data: Record<string, unknown>,
        file?: File
    ) => {
        try {
            const formData = new FormData()

            Object.entries(data).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value))
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formData.append(key, value as any)
                }
            })

            if (file) {
                formData.append('img', file)
            }

            const res = await axios.post(
                `${server}/${endpoints.products}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Creating product failed:', err)
            throw err
        }
    }

    const getProducts = async (filters?: {
        search?: string;
        limit?: number;
        location_id?: string;
        type?: string;
    }) => {
        try {
            const params = new URLSearchParams()
            
            // Add all filter parameters
            if (filters?.search) params.append('search', filters.search)
            if (filters?.limit) params.append('limit', String(filters.limit))
            if (filters?.location_id) params.append('location_id', filters.location_id)
            if (filters?.type) params.append('type', filters.type)
            
            console.log('🔍 Fetching products with filters:', filters)
            console.log('🔗 API URL:', `${server}/${endpoints.products}?${params.toString()}`)
            
            const res = await axios.get(
                `${server}/${endpoints.products}?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            
            console.log('✅ Products fetched:', res.data.items?.length, 'items')
            return res.data
        } catch (err) {
            console.error('❌ Getting products failed:', err)
            // Return empty structure to prevent errors
            return { items: [], total: 0, page: 1, limit: 20 }
        }
    }

    const getProductById = async (id: string) => {
        try {
            const res = await axios.get(
                `${server}/${endpoints.products}/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Getting product by ID failed:', err)
            throw err
        }
    }

    const updateProduct = async (
        id: string,
        data: Record<string, unknown>,
        file?: File
    ) => {
        try {
            const formData = new FormData()

            Object.entries(data).forEach(([key, value]) => {
                if (key === 'details' && typeof value === 'object') {
                    formData.append('details', JSON.stringify(value))
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formData.append(key, value as any)
                }
            })

            if (file) {
                formData.append('img', file)
            }

            const res = await axios.put(
                `${server}/${endpoints.products}/${id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Updating product failed:', err)
            throw err
        }
    }

    const deleteProduct = async (id: string) => {
        try {
            const res = await axios.delete<DeleteProductResponseType>(
                `${server}/${endpoints.products}/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Deleting product failed:', err)
            throw err
        }
    }

    // Bundles CRUD
    const createBundle = async (data: Record<string, unknown>) => {
        try {
            const res = await axios.post(
                `${server}/${endpoints.bundles}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            return res.data
        } catch (err) {
            console.error('Creating bundle failed:', err)
            throw err
        }
    }

    const getBundles = async () => {
        try {
            const res = await axios.get(`${server}/${endpoints.bundles}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            return res.data
        } catch (err) {
            console.error('Getting bundles failed:', err)
            return []
        }
    }

    const getBundleById = async (id: string) => {
        try {
            const res = await axios.get(
                `${server}/${endpoints.bundles}/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Getting bundle by ID failed:', err)
                throw err
            }
        }
    
        const updateBundle = async (id: string, data: Record<string, unknown>) => {
            try {
                const res = await axios.put(
                    `${server}/${endpoints.bundles}/${id}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Updating bundle failed:', err)
                throw err
            }
        }
    
        const deleteBundle = async (id: string) => {
            try {
                const res = await axios.delete(
                    `${server}/${endpoints.bundles}/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Deleting bundle failed:', err)
                throw err
            }
        }
    
        // Branches CRUD
        const createBranch = async (data: Record<string, unknown>) => {
            try {
                const res = await axios.post(
                    `${server}/${endpoints.branches}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Creating branch failed:', err)
                throw err
            }
        }
    
        const getBranches = async () => {
            try {
                const res = await axios.get(`${server}/${endpoints.branches}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                return res.data.data
            } catch (err) {
                console.error('Getting branches failed:', err)
                return []
            }
        }
    
        const getBranchById = async (id: string): Promise<BranchObject | null> => {
            try {
                const res = await axios.get(
                    `${server}/${endpoints.branches}/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
    
                return res.data
            } catch (err) {
                console.error('Getting branch by ID failed:', err)
                return null
            }
        }
    
        const updateBranch = async (id: string, data: Record<string, unknown>) => {
            try {
                const res = await axios.put(
                    `${server}/${endpoints.branches}/${id}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Updating branch failed:', err)
                throw err
            }
        }
    
        const deleteBranch = async (id: string) => {
            try {
                const res = await axios.delete(
                    `${server}/${endpoints.bundles}/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Deleting branch failed:', err)
                throw err
            }
        }
    
        // Get Latest Holidays
        const getHolidays = async () => {
            try {
                const res = await axios.get(`${server}/${endpoints.holidays}`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                return res.data
            } catch (err) {
                console.error('Getting holidays failed:', err)
                return []
            }
        }
    
        // Booking for all objects (Products not Bundle)
        const createBooking = async (data: BookingObjectRequest) => {
            try {
                const res = await axios.post(
                    `${server}/${endpoints.bookings}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
    
                const booking = res.data
    
                // check if branch is "online"
                const branches = await getBranches()
                const branch = branches.find(
                    (b: BranchObject) => b._id === data.branch_id
                )
                const isOnline = branch?.name?.toLowerCase().includes('online')
    
                if (isOnline) {
                    const paymentRes: CreatePaymentResponseType | null =
                        await createPayment({
                            bookingId: booking._id,
                            userId: booking.user_id,
                            currency: 'EGP',
                        })
    
                    if (paymentRes && paymentRes.success) {
                        const clientSecret = paymentRes.data.clientSecret
                        const publicKey = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY
    
                        if (!publicKey) {
                            return
                        }
    
                        // Redirect to Paymob unified checkout
    
                        router.push(
                            `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`
                        )
                    }
                }
    
                return booking
            } catch (err) {
                console.error('Creating booking failed:', err)
                throw err
            }
        }
    
        const getBookings = async (): Promise<BookingObject[]> => {
            try {
                const res = await axios.get(`${server}/${endpoints.bookings}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
    
                return res.data.bookings
            } catch (err) {
                console.error('Getting bookings failed:', err)
                return []
            }
        }
    
        const getBookingsByUser = async (id: string): Promise<BookingObject[]> => {
            try {
                const res = await axios.get(
                    `${server}/${endpoints.bookings}/my-bookings/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error(`Getting bookings for user ${id} failed:`, err)
                return []
            }
        }
    
        const updateBookingStatus = async (
            id: string,
            status: BookingObject['status']
        ) => {
            try {
                const url = `${server}/${endpoints.bookingStatus.replace(':id', id)}`
                const res = await axios.put(
                    url,
                    { status },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Updating booking status failed:', err)
                throw err
            }
        }
    
        const updatePaymentStatus = async (
            id: string,
            paymentStatus: BookingObject['paymentStatus']
        ) => {
            try {
                const url = `${server}/${endpoints.bookingPayment.replace(':id', id)}`
                const res = await axios.put(
                    url,
                    { paymentStatus },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Updating booking payment status failed:', err)
                throw err
            }
        }
    
        // Payments CRUD
        const createPayment = async (
            data: PaymentObject
        ): Promise<CreatePaymentResponseType | null> => {
            try {
                const res = await axios.post(
                    `${server}/${endpoints.payment}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                return res.data
            } catch (err) {
                console.error('Creating payment failed:', err)
                throw err
            }
        }
    
        return (
            <AdminContext.Provider
                value={{
                    admin,
                    // Users CRUD
                    getUserById,
                    // Employees CRUD
                    getEmployees,
                    createEmployee,
                    updateEmployee,
                    updateEmployeePermissions,
                    deleteEmployee,
                    // Locations CRUD
                    getLocations,
                    getLocationById,
                    createLocation,
                    updateLocation,
                    deleteLocation,
                    // Products CRUD
                    createProduct,
                    getProducts,
                    getProductById,
                    updateProduct,
                    deleteProduct,
                    // Bundles CRUD
                    createBundle,
                    getBundles,
                    getBundleById,
                    updateBundle,
                    deleteBundle,
                    // Branches CRUD
                    createBranch,
                    getBranches,
                    getBranchById,
                    updateBranch,
                    deleteBranch,
                    // Get Holidays
                    getHolidays,
                    // Bookings CRUD
                    createBooking,
                    getBookings,
                    getBookingsByUser,
                    updateBookingStatus,
                    updatePaymentStatus,
                    // Payments CRUD
                    createPayment,
                }}
            >
                {children}
            </AdminContext.Provider>
        )
    }