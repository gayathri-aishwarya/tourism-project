'use client'

import { FiX } from 'react-icons/fi'
import { AdminContext, UserContext } from '@/src/contexts/Contexts'
import { useState, useEffect, useContext, useCallback } from 'react'
// Types
import { BranchObject } from '@/src/types/objectsTypes'
// Style
import '@/src/styles/components/BookingRelated/BookingModal.css'
import { capitalizeWords } from '@/src/utils/Functions'

type BookingModalProps = {
    type: 'hotel' | 'bus' | 'flight' | 'activity' | 'bundle'
    productId: string
    onCloseAction: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onConfirmAction: (data: any) => Promise<void>
    busSeats?: number[]
}

export default function BookingModal({
    type,
    productId,
    onCloseAction,
    onConfirmAction,
    busSeats = [],
}: BookingModalProps) {
    const { getBranches, getProductById, getBundleById } =
        useContext(AdminContext)
    const { user } = useContext(UserContext)

    const [branches, setBranches] = useState<BranchObject[]>([])
    const [branchId, setBranchId] = useState('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>({})
    const [payWithVisa, setPayWithVisa] = useState(false)

    // product data (e.g. hotel rooms) OR bundle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [product, setProduct] = useState<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [bundle, setBundle] = useState<any>(null)

    // error handling
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [backendErrors, setBackendErrors] = useState<string[]>([])

    const fetchBranches = useCallback(async () => {
        try {
            const resp = await getBranches()
            setBranches(resp || [])
        } catch (err) {
            console.error('Failed to fetch branches', err)
        }
    }, [getBranches])

    const fetchProduct = useCallback(async () => {
        try {
            const resp = await getProductById(productId)
            setProduct(resp)
        } catch (err) {
            console.error('Failed to fetch product', err)
        }
    }, [getProductById, productId])

    const fetchBundle = useCallback(async () => {
        try {
            const resp = await getBundleById(productId)
            setBundle(resp)
        } catch (err) {
            console.error('Failed to fetch bundle', err)
        }
    }, [getBundleById, productId])

    useEffect(() => {
        fetchBranches().then()

        if (type === 'bundle') {
            fetchBundle().then()
        } else {
            fetchProduct().then()
        }
    }, [fetchBranches, fetchProduct, fetchBundle, type, productId])

    useEffect(() => {
        if (payWithVisa) {
            setBranchId('')
            return
        }
        const selectedIsOnline = branches
            .find((b) => b._id === branchId)
            ?.name.toLowerCase()
            .includes('online')
        if (selectedIsOnline) setBranchId('')
    }, [payWithVisa, branches, branchId])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: string, value: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFormData((prev: any) => ({ ...prev, [field]: value }))
        // clear error for field when user changes it
        setFieldErrors((prev) => {
            const copy = { ...prev }
            delete copy[field]
            return copy
        })
    }

    // price calculation
    const getPrice = () => {
        if (!product && type !== 'bundle') return 0

        switch (type) {
            case 'bus':
                return product?.details?.price_per_seat
                    ? product.details.price_per_seat * busSeats.length
                    : 0

            case 'hotel':
                if (!formData.room_type || !formData.quantity) return 0
                const roomPrice =
                    product?.details?.prices_per_night?.[formData.room_type] ||
                    0
                return roomPrice * (formData.quantity || 0)

            case 'flight':
                return product?.details?.price_per_ticket
                    ? product.details.price_per_ticket *
                          (formData.tickets_booked || 0)
                    : 0

            case 'activity':
                return product?.details?.price_per_person
                    ? product.details.price_per_person *
                          (formData.number_of_persons || 0)
                    : 0

            case 'bundle':
                return bundle?.price || 0

            default:
                return 0
        }
    }

    const handleConfirm = async () => {
        if (!user?._id) return

        // eslint-disable-next-line prefer-const
        let newErrors: Record<string, string> = {}

        // Branch / Payment validation
        let finalBranchId = branchId
        if (payWithVisa) {
            const onlineBranch = branches.find((b) =>
                b.name.toLowerCase().includes('online')
            )
            if (!onlineBranch) {
                newErrors.branch_id =
                    'No online branch found, cannot book with Visa.'
            } else {
                finalBranchId = onlineBranch._id
            }
        } else if (!finalBranchId) {
            newErrors.branch_id = 'Please select a branch before confirming.'
        }

        // Type-specific validation
        if (type === 'bus') {
            if (busSeats.length === 0) {
                newErrors.seat_numbers = 'Please select at least one seat.'
            }
        }

        if (type === 'hotel') {
            if (!formData.start_date)
                newErrors.start_date = 'Check-in date required.'
            if (!formData.end_date)
                newErrors.end_date = 'Check-out date required.'
            if (!formData.room_type)
                newErrors.room_type = 'Please select a room type.'
            if (!formData.quantity || formData.quantity < 1)
                newErrors.quantity = 'Enter a valid quantity.'
        }

        if (type === 'flight') {
            if (!formData.tickets_booked || formData.tickets_booked < 1)
                newErrors.tickets_booked = 'Enter how many tickets.'
            if (!formData.departure_time)
                newErrors.departure_time = 'Please select a departure time.'
        }

        if (type === 'activity') {
            if (!formData.number_of_persons || formData.number_of_persons < 1)
                newErrors.number_of_persons = 'Enter number of persons.'
        }

        if (type === 'bundle') {
            // no special formData, only bundle_id required
            if (!productId) {
                newErrors.bundle_id = 'Invalid bundle selected.'
            }
        }

        // If client validation failed, set errors & stop
        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors)
            return
        }

        let payload

        if (type === 'bundle') {
            payload = {
                user_id: user._id,
                branch_id: finalBranchId,
                bundle_id: productId, // 👈 send bundle_id
            }
        } else {
            payload = {
                user_id: user._id,
                branch_id: finalBranchId,
                items: [
                    {
                        product_id: productId,
                        details: {
                            ...formData,
                            ...(type === 'bus'
                                ? { seat_numbers: busSeats }
                                : {}),
                        },
                    },
                ],
            }
        }

        try {
            await onConfirmAction(payload).then(async () => {
                onCloseAction()
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const backend = err?.response?.data

            if (backend?.errors) {
                if (Array.isArray(backend.errors)) {
                    setBackendErrors(backend.errors) // global error list
                } else {
                    setFieldErrors(backend.errors) // field-specific errors
                }
            } else if (backend?.message) {
                setBackendErrors([backend.message])
            } else {
                setBackendErrors(['Something went wrong, please try again.'])
            }
        }
    }

    return (
        <div className='booking-modal-overlay'>
            <div className='booking-modal'>
                <div className='booking-modal-header'>
                    <h3 className='booking-modal-title'>
                        Book {capitalizeWords(type)}
                    </h3>
                    <button
                        className='booking-modal-close'
                        onClick={onCloseAction}
                    >
                        <FiX />
                    </button>
                </div>

                <div className='booking-modal-body'>
                    {/* show errors if exist */}
                    {backendErrors.length > 0 && (
                        <div className='booking-error-box'>
                            <ul>
                                {backendErrors.map((error, i) => (
                                    <li key={i} className='booking-error-item'>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Payment Switch */}
                    <div className='booking-form-group'>
                        <label className='booking-form-label'>
                            Payment Method
                        </label>
                        <label className='switch'>
                            <input
                                type='checkbox'
                                checked={payWithVisa}
                                onChange={(e) =>
                                    setPayWithVisa(e.target.checked)
                                }
                            />
                            <span className='slider'></span>
                            <span className='switch-label'>
                                {payWithVisa ? 'Visa' : 'Cash'}
                            </span>
                        </label>
                    </div>

                    {/* Branch select (only for cash) */}
                    {!payWithVisa && (
                        <div className='booking-form-group'>
                            <label className='booking-form-label'>
                                Select Branch
                            </label>
                            <select
                                name='branch_id'
                                className='booking-form-input'
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                required
                            >
                                <option value=''>Select Branch</option>
                                {branches
                                    .filter(
                                        (branch) =>
                                            !branch.name
                                                .toLowerCase()
                                                .includes('online')
                                    )
                                    .map((branch) => (
                                        <option
                                            key={branch._id}
                                            value={branch._id}
                                        >
                                            {branch.name} — {branch.address}
                                        </option>
                                    ))}
                            </select>
                            {fieldErrors.branch_id && (
                                <p className='booking-error'>
                                    {fieldErrors.branch_id}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Render inputs based on type */}
                    {type === 'hotel' && product && (
                        <>
                            <div className='booking-form-group'>
                                <label className='booking-form-label'>
                                    Check-in Date
                                </label>
                                <input
                                    type='datetime-local'
                                    className='booking-form-input'
                                    onChange={(e) =>
                                        handleChange(
                                            'start_date',
                                            new Date(
                                                e.target.value
                                            ).toISOString()
                                        )
                                    }
                                />
                                {fieldErrors.start_date && (
                                    <p className='booking-error'>
                                        {fieldErrors.start_date}
                                    </p>
                                )}
                            </div>
                            <div className='booking-form-group'>
                                <label className='booking-form-label'>
                                    Check-out Date
                                </label>
                                <input
                                    type='datetime-local'
                                    className='booking-form-input'
                                    onChange={(e) =>
                                        handleChange(
                                            'end_date',
                                            new Date(
                                                e.target.value
                                            ).toISOString()
                                        )
                                    }
                                />
                                {fieldErrors.end_date && (
                                    <p className='booking-error'>
                                        {fieldErrors.end_date}
                                    </p>
                                )}
                            </div>
                            <div className='booking-form-group'>
                                <label className='booking-form-label'>
                                    Room Type
                                </label>
                                <select
                                    className='booking-form-input'
                                    onChange={(e) =>
                                        handleChange(
                                            'room_type',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value=''>Select Room</option>
                                    {product.details?.room_types?.map(
                                        (room: string) => (
                                            <option key={room} value={room}>
                                                {room}
                                            </option>
                                        )
                                    )}
                                </select>
                                {fieldErrors.room_type && (
                                    <p className='booking-error'>
                                        {fieldErrors.room_type}
                                    </p>
                                )}
                            </div>
                            <div className='booking-form-group'>
                                <label className='booking-form-label'>
                                    Quantity
                                </label>
                                <input
                                    type='number'
                                    min={1}
                                    className='booking-form-input'
                                    onChange={(e) =>
                                        handleChange(
                                            'quantity',
                                            Number(e.target.value)
                                        )
                                    }
                                />
                                {fieldErrors.quantity && (
                                    <p className='booking-error'>
                                        {fieldErrors.quantity}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {type === 'bus' && (
                        <div className='booking-form-group'>
                            <label className='booking-form-label'>
                                Seat Numbers
                            </label>
                            <div className='booking-form-input read-only'>
                                {busSeats.length > 0
                                    ? busSeats.join(', ')
                                    : 'No seats selected'}
                            </div>
                            {fieldErrors.seat_numbers && (
                                <p className='booking-error'>
                                    {fieldErrors.seat_numbers}
                                </p>
                            )}
                        </div>
                    )}

                    {type === 'flight' && (
                        <>
                            <div className='booking-form-group'>
                                <label className='booking-form-label'>
                                    Tickets Booked
                                </label>
                                <input
                                    type='number'
                                    min={1}
                                    className='booking-form-input'
                                    onChange={(e) =>
                                        handleChange(
                                            'tickets_booked',
                                            Number(e.target.value)
                                        )
                                    }
                                />
                                {fieldErrors.tickets_booked && (
                                    <p className='booking-error'>
                                        {fieldErrors.tickets_booked}
                                    </p>
                                )}
                            </div>
                            <div className='booking-form-group'>
                                <label className='booking-form-label'>
                                    Departure Time
                                </label>
                                <input
                                    type='datetime-local'
                                    className='booking-form-input'
                                    onChange={(e) =>
                                        handleChange(
                                            'departure_time',
                                            e.target.value
                                        )
                                    }
                                />
                                {fieldErrors.departure_time && (
                                    <p className='booking-error'>
                                        {fieldErrors.departure_time}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {type === 'activity' && (
                        <div className='booking-form-group'>
                            <label className='booking-form-label'>
                                Number of Persons
                            </label>
                            <input
                                type='number'
                                min={1}
                                className='booking-form-input'
                                onChange={(e) =>
                                    handleChange(
                                        'number_of_persons',
                                        Number(e.target.value)
                                    )
                                }
                            />
                            {fieldErrors.number_of_persons && (
                                <p className='booking-error'>
                                    {fieldErrors.number_of_persons}
                                </p>
                            )}
                        </div>
                    )}

                    <div className='booking-form-group'>
                        <label className='booking-form-label'>
                            Total Price
                        </label>
                        <div className='booking-form-input read-only'>
                            {getPrice()} EGP
                        </div>
                    </div>
                </div>

                <div className='booking-modal-footer'>
                    <button
                        className='booking-btn booking-btn-primary'
                        onClick={handleConfirm}
                    >
                        Confirm Booking
                    </button>
                    <button
                        className='booking-btn booking-btn-secondary'
                        onClick={onCloseAction}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
