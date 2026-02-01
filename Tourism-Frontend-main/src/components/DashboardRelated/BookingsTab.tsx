'use client'

import { useState, useEffect, useContext, useCallback } from 'react'
import dayjs from 'dayjs'
import { FiEdit2 } from 'react-icons/fi'
// Context
import { AdminContext } from '@/src/contexts/Contexts'
// Types
import { BookingObject } from '@/src/types/objectsTypes'
// Styles
import '@/src/styles/components/DashboardRelated/TableAndForm.css'

type Draft = Pick<BookingObject, '_id' | 'status' | 'paymentStatus'>

type BookingFormProps = {
    title: string
    draft: Draft
    setDraft: (d: Draft) => void
    onCancel: () => void
    onSave: (final: Draft) => void
}

type BookingWithNames = BookingObject & {
    userName?: string
    branchName?: string
}

function BookingForm({
    title,
    draft,
    setDraft,
    onCancel,
    onSave,
}: BookingFormProps) {
    const handleChange = (field: keyof Draft, val: string) => {
        setDraft({ ...draft, [field]: val })
    }

    const handleSaveClick = () => {
        if (!draft._id) return
        onSave(draft)
    }

    return (
        <div className='drawer'>
            <div className='drawer-header'>
                <h3 className='drawer-title'>{title}</h3>
                <button className='secondary-btn' onClick={onCancel}>
                    Close
                </button>
            </div>

            <div className='drawer-body'>
                <div className='form-grid'>
                    <div className='form-row'>
                        <label className='form-label'>Status</label>
                        <select
                            className='form-input'
                            value={draft.status}
                            onChange={(e) =>
                                handleChange('status', e.target.value)
                            }
                        >
                            <option value='pending'>Pending</option>
                            <option value='confirmed'>Confirmed</option>
                            <option value='paid'>Paid</option>
                            <option value='cancelled'>Cancelled</option>
                        </select>
                    </div>

                    <div className='form-row'>
                        <label className='form-label'>Payment Status</label>
                        <select
                            className='form-input'
                            value={draft.paymentStatus}
                            onChange={(e) =>
                                handleChange('paymentStatus', e.target.value)
                            }
                        >
                            <option value='pending'>Pending</option>
                            <option value='paid'>Paid</option>
                            <option value='failed'>Failed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className='drawer-footer'>
                <button className='primary-btn' onClick={handleSaveClick}>
                    Save Changes
                </button>
                <button className='secondary-btn' onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default function BookingsTab() {
    const {
        getBookings,
        getUserById,
        getBranchById,
        updateBookingStatus,
        updatePaymentStatus,
    } = useContext(AdminContext)

    const [bookings, setBookings] = useState<BookingWithNames[]>([])
    const [editing, setEditing] = useState<null | Draft>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [sortKey, setSortKey] = useState<
        'status' | 'paymentStatus' | 'createdAt' | 'updatedAt'
    >('createdAt')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

    const fetchBookings = useCallback(async () => {
        const data = await getBookings()
        if (!data) {
            setBookings([])
            return
        }

        const enriched = await Promise.all(
            data.map(async (b) => {
                let userName = b.user_id
                let branchName = b.branch_id

                try {
                    const user = await getUserById(b.user_id)
                    if (user) {
                        userName = user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName
                    }
                } catch (e) {
                    console.error('Failed to fetch user name', e)
                }

                try {
                    const branch = await getBranchById(b.branch_id)
                    if (branch) branchName = branch.name
                } catch (e) {
                    console.error('Failed to fetch branch name', e)
                }

                return { ...b, userName, branchName }
            })
        )

        setBookings(enriched)
    }, [getBookings, getUserById, getBranchById])

    useEffect(() => {
        fetchBookings().then()
    }, [fetchBookings])

    const openEdit = (booking: BookingObject) => {
        setEditing({
            _id: booking._id,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
        })
    }

    const handleUpdate = async (draft: Draft) => {
        if (!draft._id) return

        const original = bookings.find((b) => b._id === draft._id)
        if (!original) return

        // call only what changed
        if (draft.status !== original.status) {
            await updateBookingStatus(draft._id, draft.status)
        }
        if (draft.paymentStatus !== original.paymentStatus) {
            await updatePaymentStatus(draft._id, draft.paymentStatus)
        }

        setEditing(null)
        fetchBookings().then()
    }

    function toggleSort(key: typeof sortKey) {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    function renderSortIcon(key: typeof sortKey) {
        if (sortKey !== key) return <span className='sort-icon'>⇅</span>
        return sortDir === 'asc' ? (
            <span className='sort-icon'>↑</span>
        ) : (
            <span className='sort-icon'>↓</span>
        )
    }

    const displayedBookings = bookings
        .filter((b) => {
            if (!searchTerm.trim()) return true
            const s = searchTerm.toLowerCase()
            return (
                b.user_id.toLowerCase().includes(s) ||
                b.branch_id.toLowerCase().includes(s) ||
                b.status.toLowerCase().includes(s) ||
                b.paymentStatus.toLowerCase().includes(s)
            )
        })
        .sort((a, b) => {
            let valA: number | string = ''
            let valB: number | string = ''
            if (sortKey === 'status') {
                valA = a.status
                valB = b.status
            } else if (sortKey === 'paymentStatus') {
                valA = a.paymentStatus
                valB = b.paymentStatus
            } else if (sortKey === 'createdAt') {
                valA = new Date(a.createdAt || '').getTime()
                valB = new Date(b.createdAt || '').getTime()
            } else if (sortKey === 'updatedAt') {
                valA = new Date(a.updatedAt || '').getTime()
                valB = new Date(b.updatedAt || '').getTime()
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1
            if (valA > valB) return sortDir === 'asc' ? 1 : -1
            return 0
        })

    return (
        <div className='table-wrapper'>
            <div className='search-bar'>
                <input
                    type='text'
                    placeholder='Search by user, branch, status...'
                    className='search-input'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className='header-bar'>
                <h2 className='page-title'>Bookings</h2>
            </div>

            <div className='table-container'>
                <table className='data-table'>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Branch</th>
                            <th
                                onClick={() => toggleSort('status')}
                                className='sortable'
                            >
                                Status {renderSortIcon('status')}
                            </th>
                            <th
                                onClick={() => toggleSort('paymentStatus')}
                                className='sortable'
                            >
                                Payment {renderSortIcon('paymentStatus')}
                            </th>
                            <th>Total Price</th>
                            <th
                                onClick={() => toggleSort('createdAt')}
                                className='sortable'
                            >
                                Created {renderSortIcon('createdAt')}
                            </th>
                            <th
                                onClick={() => toggleSort('updatedAt')}
                                className='sortable'
                            >
                                Updated {renderSortIcon('updatedAt')}
                            </th>
                            <th className='text-right'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedBookings.map((b) => (
                            <tr key={b._id}>
                                <td className='truncate'>{b.userName}</td>
                                <td className='truncate'>{b.branchName}</td>
                                <td>
                                    <span
                                        className={`status-chip status-${b.status}`}
                                    >
                                        {b.status}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={`status-chip payment-${b.paymentStatus}`}
                                    >
                                        {b.paymentStatus}
                                    </span>
                                </td>
                                <td>{b.total_price} EGP</td>
                                <td>
                                    {b.createdAt
                                        ? dayjs(b.createdAt).format(
                                              'DD MMM YYYY, hh:mm A'
                                          )
                                        : ''}
                                </td>
                                <td>
                                    {b.updatedAt
                                        ? dayjs(b.updatedAt).format(
                                              'DD MMM YYYY, hh:mm A'
                                          )
                                        : ''}
                                </td>
                                <td>
                                    <div className='action-icons justify-end'>
                                        <FiEdit2 onClick={() => openEdit(b)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editing && (
                <BookingForm
                    title='Edit Booking'
                    draft={editing}
                    setDraft={setEditing}
                    onCancel={() => setEditing(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    )
}
