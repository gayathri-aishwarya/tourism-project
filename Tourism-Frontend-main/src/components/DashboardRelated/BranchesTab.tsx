'use client'

import dayjs from 'dayjs'
import { useState, useEffect, useContext, useCallback } from 'react'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
// Context
import { AdminContext } from '@/src/contexts/Contexts'
// Types
import { BranchObject } from '@/src/types/objectsTypes'
// Styles
import '@/src/styles/components/DashboardRelated/TableAndForm.css'

type Draft = Partial<BranchObject>

type BranchFormProps = {
    title: string
    draft: Draft
    setDraft: (d: Draft) => void
    onCancel: () => void
    onSave: (final: BranchObject) => void
    isEditing?: boolean
}

function BranchForm({
    title,
    draft,
    setDraft,
    onCancel,
    onSave,
    isEditing = false,
}: BranchFormProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: keyof Draft, val: any) => {
        setDraft({ ...draft, [field]: val })
    }

    const handleSaveClick = () => {
        if (!draft.name || !draft.address || !draft.phone) return

        const finalBranch: BranchObject = {
            ...(draft._id ? { _id: draft._id } : {}),
            name: draft.name!,
            address: draft.address!,
            phone: draft.phone!,
        } as BranchObject

        onSave(finalBranch)
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
                    <div className='form-row'>
                        <label className='form-label'>Name</label>
                        <input
                            className='form-input'
                            value={draft.name ?? ''}
                            onChange={(e) =>
                                handleChange('name', e.target.value)
                            }
                        />
                    </div>
                    <div className='form-row'>
                        <label className='form-label'>Address</label>
                        <input
                            className='form-input'
                            value={draft.address ?? ''}
                            onChange={(e) =>
                                handleChange('address', e.target.value)
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
                </div>
            </div>

            <div className='drawer-footer'>
                <button className='primary-btn' onClick={handleSaveClick}>
                    {isEditing ? 'Save Changes' : 'Create Branch'}
                </button>
                <button className='secondary-btn' onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default function BranchesTab() {
    const { getBranches, createBranch, updateBranch, deleteBranch } =
        useContext(AdminContext)

    const [branches, setBranches] = useState<BranchObject[]>([])
    const [creating, setCreating] = useState(false)
    const [editing, setEditing] = useState<null | BranchObject>(null)
    const [draft, setDraft] = useState<Draft>({
        name: '',
        address: '',
        phone: '',
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [sortKey, setSortKey] = useState<'name' | 'createdAt' | 'updatedAt'>(
        'name'
    )
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    const fetchBranches = useCallback(async () => {
        const data = await getBranches()
        setBranches(data || [])
    }, [getBranches])

    useEffect(() => {
        fetchBranches().then()
    }, [fetchBranches])

    const openCreate = () => {
        setDraft({
            name: '',
            address: '',
            phone: '',
        })
        setCreating(true)
    }

    const handleCreate = async (branch: BranchObject) => {
        await createBranch(branch)
        setCreating(false)
        fetchBranches().then()
    }

    const openEdit = (branch: BranchObject) => {
        setDraft({ ...branch })
        setEditing(branch)
    }

    const handleUpdate = async (branch: BranchObject) => {
        await updateBranch(branch._id, branch)
        setEditing(null)
        fetchBranches().then()
    }

    const handleDelete = async (id: string) => {
        await deleteBranch(id)
        fetchBranches().then()
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

    const displayedBranches = branches
        .filter((b) => {
            if (!searchTerm.trim()) return true
            const s = searchTerm.toLowerCase()
            return (
                b.name.toLowerCase().includes(s) ||
                b.address.toLowerCase().includes(s) ||
                b.phone.toLowerCase().includes(s)
            )
        })
        .sort((a, b) => {
            let valA: string | number = ''
            let valB: string | number = ''
            if (sortKey === 'name') {
                valA = a.name.toLowerCase()
                valB = b.name.toLowerCase()
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
                    placeholder='Search by name, address, phone...'
                    className='search-input'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className='header-bar'>
                <h2 className='page-title'>Branches</h2>
                <button className='primary-btn' onClick={openCreate}>
                    <FiPlus className='mr-1' /> Add Branch
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
                            <th>Address</th>
                            <th>Phone</th>
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
                        {displayedBranches.map((b) => (
                            <tr key={b._id}>
                                <td className='truncate'>{b.name}</td>
                                <td className='truncate'>{b.address}</td>
                                <td className='truncate'>{b.phone}</td>
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
                                        <FiTrash2
                                            className='text-red-500'
                                            onClick={() => handleDelete(b._id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {creating && (
                <BranchForm
                    title='Create Branch'
                    draft={draft}
                    setDraft={setDraft}
                    onCancel={() => setCreating(false)}
                    onSave={handleCreate}
                />
            )}

            {editing && (
                <BranchForm
                    title='Edit Branch'
                    draft={draft}
                    setDraft={setDraft}
                    onCancel={() => setEditing(null)}
                    onSave={handleUpdate}
                    isEditing
                />
            )}
        </div>
    )
}
