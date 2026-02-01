'use client'

import dayjs from 'dayjs'
import { useState, useEffect, useContext, useCallback } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'
// Context
import { AdminContext } from '@/src/contexts/Contexts'
// Types
import { BranchObject, UserObject } from '@/src/types/objectsTypes'
// Styles
import '@/src/styles/components/DashboardRelated/TableAndForm.css'

const PERMISSION_OPTIONS = [
    'bookings',
    'branches',
    'employees',
    'locations',
    'products',
    'bundles',
]

type Draft = Partial<UserObject> & {
    confirmPassword?: string
}

type EmployeeFormProps = {
    title: string
    draft: Draft
    setDraft: (d: Draft) => void
    onCancel: () => void
    onSave: (final: UserObject) => void
    isEditing?: boolean
    branches: { _id: string; name: string }[]
}

function EmployeeForm({
    title,
    draft,
    setDraft,
    onCancel,
    onSave,
    isEditing = false,
    branches,
}: EmployeeFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: keyof Draft, val: any) => {
        setDraft({ ...draft, [field]: val })
    }

    const handleSaveClick = () => {
        if (!draft.firstName || !draft.lastName || !draft.email) return

        if (!isEditing) {
            if (draft.password !== draft.confirmPassword) {
                alert('Passwords do not match!')
                return
            }
        }

        const finalUser: UserObject = {
            ...(draft._id ? { _id: draft._id } : {}),
            firstName: draft.firstName!,
            lastName: draft.lastName!,
            phone: draft.phone || '',
            email: draft.email!,
            password: draft.password,
            role: 'employee',
            permissions: draft.permissions || [],
            branch_id: draft.branch_id || undefined,
        } as UserObject

        onSave(finalUser)
    }

    return (
        <div className='drawer'>
            <div className='drawer-header'>
                <h3 className='drawer-title'>{title}</h3>
                <button className='secondary-btn' onClick={onCancel}>
                    Cancel
                </button>
            </div>

            <div className='drawer-body'>
                <div className='form-grid'>
                    {/* Only show these fields when creating */}
                    {!isEditing && (
                        <>
                            <div className='form-row'>
                                <label className='form-label'>First Name</label>
                                <input
                                    className='form-input'
                                    value={draft.firstName ?? ''}
                                    onChange={(e) =>
                                        handleChange(
                                            'firstName',
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                            <div className='form-row'>
                                <label className='form-label'>Last Name</label>
                                <input
                                    className='form-input'
                                    value={draft.lastName ?? ''}
                                    onChange={(e) =>
                                        handleChange('lastName', e.target.value)
                                    }
                                />
                            </div>
                            <div className='form-row'>
                                <label className='form-label'>Phone</label>
                                <input
                                    className='form-input'
                                    value={draft.phone ?? ''}
                                    onChange={(e) =>
                                        handleChange('phone', e.target.value)
                                    }
                                />
                            </div>
                            <div className='form-row'>
                                <label className='form-label'>Email</label>
                                <input
                                    className='form-input'
                                    value={draft.email ?? ''}
                                    onChange={(e) =>
                                        handleChange('email', e.target.value)
                                    }
                                />
                            </div>

                            <div className='form-row password-field'>
                                <label className='form-label'>Password</label>
                                <div className='password-wrapper'>
                                    <input
                                        className='form-input'
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={draft.password ?? ''}
                                        onChange={(e) =>
                                            handleChange(
                                                'password',
                                                e.target.value
                                            )
                                        }
                                    />
                                    <span
                                        className='password-toggle'
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        role='button'
                                    >
                                        {showPassword ? (
                                            <FiEyeOff />
                                        ) : (
                                            <FiEye />
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className='form-row password-field'>
                                <label className='form-label'>
                                    Confirm Password
                                </label>
                                <div className='password-wrapper'>
                                    <input
                                        className='form-input'
                                        type={
                                            showConfirmPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={draft.confirmPassword ?? ''}
                                        onChange={(e) =>
                                            handleChange(
                                                'confirmPassword',
                                                e.target.value
                                            )
                                        }
                                    />
                                    <span
                                        className='password-toggle'
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        role='button'
                                    >
                                        {showConfirmPassword ? (
                                            <FiEyeOff />
                                        ) : (
                                            <FiEye />
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className='form-row'>
                                <label className='form-label'>Role</label>
                                <select
                                    className='form-select'
                                    value={draft.role ?? 'employee'}
                                    onChange={(e) =>
                                        handleChange('role', e.target.value)
                                    }
                                >
                                    <option value='employee'>Employee</option>
                                </select>
                            </div>

                            <div className='form-row'>
                                <label className='form-label'>Branch</label>
                                <select
                                    className='form-select'
                                    value={draft.branch_id ?? ''}
                                    onChange={(e) =>
                                        handleChange(
                                            'branch_id',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value=''>Select Branch</option>
                                    {branches.map((b) => (
                                        <option key={b._id} value={b._id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Always show permissions */}
                    <div className='form-row'>
                        <label className='form-label'>Permissions</label>
                        <select
                            multiple
                            className='form-select'
                            value={draft.permissions ?? []}
                            onChange={(e) =>
                                handleChange(
                                    'permissions',
                                    Array.from(
                                        e.target.selectedOptions,
                                        (opt) => opt.value
                                    )
                                )
                            }
                        >
                            {PERMISSION_OPTIONS.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='drawer-footer'>
                <button className='primary-btn' onClick={handleSaveClick}>
                    {isEditing ? 'Save Changes' : 'Create Employee'}
                </button>
                <button className='secondary-btn' onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default function EmployeesTab() {
    const {
        getEmployees,
        createEmployee,
        updateEmployeePermissions,
        deleteEmployee,
        getBranches,
    } = useContext(AdminContext)

    const [employees, setEmployees] = useState<UserObject[]>([])
    const [creating, setCreating] = useState(false)
    const [editing, setEditing] = useState<null | UserObject>(null)
    const [draft, setDraft] = useState<Draft>({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        permissions: [],
        branch_id: '',
    })
    const [branches, setBranches] = useState<BranchObject[]>([])

    const [searchTerm, setSearchTerm] = useState('')
    const [sortKey, setSortKey] = useState<'name' | 'createdAt' | 'updatedAt'>(
        'name'
    )
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    const fetchEmployees = useCallback(async () => {
        const [users, branchList] = await Promise.all([
            getEmployees(),
            getBranches(),
        ])
        setEmployees(users || [])
        setBranches(branchList || [])
    }, [getEmployees, getBranches])

    useEffect(() => {
        fetchEmployees().then()
    }, [fetchEmployees])

    const openCreate = () => {
        setDraft({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'employee',
            permissions: [],
        })
        setCreating(true)
    }

    const handleCreate = async (user: UserObject) => {
        await createEmployee(user)
        setCreating(false)
        fetchEmployees().then()
    }

    const openEdit = (user: UserObject) => {
        setDraft({ ...user })
        setEditing(user)
    }

    const handleUpdate = async (user: UserObject) => {
        await updateEmployeePermissions(user._id, user.permissions)
        setEditing(null)
        fetchEmployees().then()
    }

    const handleDelete = async (id: string) => {
        await deleteEmployee(id)
        fetchEmployees().then()
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

    const displayedEmployees = employees
        .filter((e) => {
            if (!searchTerm.trim()) return true
            const s = searchTerm.toLowerCase()
            return (
                e.firstName?.toLowerCase().includes(s) ||
                e.lastName?.toLowerCase().includes(s) ||
                e.email?.toLowerCase().includes(s) ||
                e.phone?.toLowerCase().includes(s) ||
                e.role?.toLowerCase().includes(s)
            )
        })
        .sort((a, b) => {
            let valA: string | number = ''
            let valB: string | number = ''
            if (sortKey === 'name') {
                valA = `${a.firstName} ${a.lastName}`.toLowerCase()
                valB = `${b.firstName} ${b.lastName}`.toLowerCase()
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
                    placeholder='Search by name, email, phone, role...'
                    className='search-input'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className='header-bar'>
                <h2 className='page-title'>Employees</h2>
                <button className='primary-btn' onClick={openCreate}>
                    <FiPlus className='mr-1' /> Add Employee
                </button>
            </div>

            <div className='table-container'>
                <table className='data-table'>
                    <thead>
                        <tr>
                            <th
                                onClick={() => toggleSort('name')}
                                className='sortable'
                            >
                                Name {renderSortIcon('name')}
                            </th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Branch</th>
                            <th>Permissions</th>
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
                        {displayedEmployees.map((e) => (
                            <tr key={e._id}>
                                <td className='truncate'>
                                    {e.firstName} {e.lastName}
                                </td>
                                <td className='truncate'>{e.email}</td>
                                <td className='truncate'>{e.phone}</td>
                                <td className='truncate'>{e.role}</td>
                                <td className='truncate'>
                                    {branches.find((b) => b._id === e.branch_id)
                                        ?.name || '—'}
                                </td>
                                <td className='truncate'>
                                    {Array.isArray(e.permissions)
                                        ? e.permissions.join(', ')
                                        : ''}
                                </td>
                                <td>
                                    {e.createdAt
                                        ? dayjs(e.createdAt).format(
                                              'DD MMM YYYY, hh:mm A'
                                          )
                                        : ''}
                                </td>
                                <td>
                                    {e.updatedAt
                                        ? dayjs(e.updatedAt).format(
                                              'DD MMM YYYY, hh:mm A'
                                          )
                                        : ''}
                                </td>
                                <td>
                                    <div className='action-icons justify-end'>
                                        <FiEdit2 onClick={() => openEdit(e)} />
                                        <FiTrash2
                                            className='text-red-500'
                                            onClick={() => handleDelete(e._id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {creating && (
                <EmployeeForm
                    title='Create Employee'
                    draft={draft}
                    setDraft={setDraft}
                    onCancel={() => setCreating(false)}
                    onSave={handleCreate}
                    branches={branches}
                />
            )}

            {editing && (
                <EmployeeForm
                    title='Edit Employee Permissions'
                    draft={draft}
                    setDraft={setDraft}
                    onCancel={() => setEditing(null)}
                    onSave={handleUpdate}
                    branches={branches}
                    isEditing
                />
            )}
        </div>
    )
}
