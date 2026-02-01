'use client'

import dayjs from 'dayjs'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useState, useEffect, useContext, useCallback } from 'react'
// Context
import { AdminContext } from '@/src/contexts/Contexts'
// Components
import UploadImageField from '@/src/components/OtherRelated/UploadImageField'
// Types
import { LocationObject } from '@/src/types/objectsTypes'
// Styles
import '@/src/styles/components/DashboardRelated/TableAndForm.css'

type Draft = Partial<LocationObject> & {
    name: string
    description: string
    heroImageFile?: File
}

type LocationFormProps = {
    title: string
    draft: Draft
    setDraft: (l: Draft) => void
    onCancel: () => void
    onSave: (finalLocation: LocationObject) => void
    isEditing?: boolean
}

function LocationForm({
    title,
    draft,
    setDraft,
    onCancel,
    onSave,
    isEditing = false,
}: LocationFormProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: keyof Draft, val: any) => {
        setDraft({ ...draft, [field]: val })
    }

    const handleSaveClick = () => {
        if (!draft.name || !draft.description) return

        const finalLocation: LocationObject = {
            ...(draft._id ? { _id: draft._id } : {}),
            name: draft.name,
            description: draft.description,
        } as LocationObject

        onSave(finalLocation)
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
                        <label className='form-label'>Description</label>
                        <textarea
                            className='form-textarea'
                            value={draft.description ?? ''}
                            onChange={(e) =>
                                handleChange('description', e.target.value)
                            }
                        />
                    </div>

                    <div className='form-row'>
                        <UploadImageField
                            fieldType='heroImage'
                            onFileSelect={(file) =>
                                handleChange('heroImageFile', file)
                            }
                            initialPreview={draft.heroImage}
                        />
                    </div>
                </div>
            </div>

            <div className='drawer-footer'>
                <button className='primary-btn' onClick={handleSaveClick}>
                    {isEditing ? 'Save Changes' : 'Create Location'}
                </button>
                <button className='secondary-btn' onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default function LocationsTab() {
    const { getLocations, createLocation, updateLocation, deleteLocation } =
        useContext(AdminContext)

    const [locations, setLocations] = useState<LocationObject[]>([])
    const [creating, setCreating] = useState(false)
    const [editing, setEditing] = useState<null | LocationObject>(null)
    const [draft, setDraft] = useState<Draft>({
        name: '',
        description: '',
        heroImage: '',
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [sortKey, setSortKey] = useState<'name' | 'createdAt' | 'updatedAt'>(
        'name'
    )
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    const fetchLocations = useCallback(async () => {
        const data = await getLocations()
        setLocations(data || [])
    }, [getLocations])

    useEffect(() => {
        fetchLocations().then()
    }, [fetchLocations])

    const openCreate = () => {
        setDraft({ name: '', description: '', heroImage: '' })
        setCreating(true)
    }

    const handleCreate = async (location: LocationObject) => {
        await createLocation(
            {
                name: location.name,
                description: location.description,
            },
            draft.heroImageFile
        )
        setCreating(false)
        fetchLocations().then()
    }

    const openEdit = (loc: LocationObject) => {
        setDraft({ ...loc })
        setEditing(loc)
    }

    const handleUpdate = async (location: LocationObject) => {
        await updateLocation(
            location._id,
            {
                name: location.name,
                description: location.description,
            },
            draft.heroImageFile
        )
        setEditing(null)
        fetchLocations().then()
    }

    const handleDelete = async (id: string) => {
        await deleteLocation(id)
        fetchLocations().then()
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

    const displayedLocations = locations
        .filter((l) => {
            if (!searchTerm.trim()) return true
            const s = searchTerm.toLowerCase()
            return (
                l.name.toLowerCase().includes(s) ||
                l.description.toLowerCase().includes(s)
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
                    placeholder='Search by name or description...'
                    className='search-input'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className='header-bar'>
                <h2 className='page-title'>Locations</h2>
                <button className='primary-btn' onClick={openCreate}>
                    <FiPlus className='mr-1' /> Add Location
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
                            <th>Description</th>
                            <th>Hero Image</th>
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
                        {displayedLocations.map((l) => (
                            <tr key={l._id}>
                                <td className='truncate'>{l.name}</td>
                                <td className='truncate'>{l.description}</td>
                                <td className='truncate'>{l.heroImage}</td>
                                <td>
                                    {l.createdAt
                                        ? dayjs(l.createdAt).format(
                                              'DD MMM YYYY, hh:mm A'
                                          )
                                        : ''}
                                </td>
                                <td>
                                    {l.updatedAt
                                        ? dayjs(l.updatedAt).format(
                                              'DD MMM YYYY, hh:mm A'
                                          )
                                        : ''}
                                </td>
                                <td>
                                    <div className='action-icons justify-end'>
                                        <FiEdit2 onClick={() => openEdit(l)} />
                                        <FiTrash2
                                            className='text-red-500'
                                            onClick={() => handleDelete(l._id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {creating && (
                <LocationForm
                    title='Create Location'
                    draft={draft}
                    setDraft={setDraft}
                    onCancel={() => setCreating(false)}
                    onSave={handleCreate}
                />
            )}

            {editing && (
                <LocationForm
                    title='Edit Location'
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
