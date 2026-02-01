'use client'

import dayjs from 'dayjs'
import { useState, useEffect, useContext, useCallback } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
// Context
import { AdminContext } from '@/src/contexts/Contexts'
// Components
import UploadImageField from '@/src/components/OtherRelated/UploadImageField'
// Utils
import { capitalizeWords } from '@/src/utils/Functions'
// Types
import { ProductObject, LocationObject } from '@/src/types/objectsTypes'
// Styles
import '@/src/styles/components/DashboardRelated/TableAndForm.css'

type SimpleFieldType = 'string' | 'number' | 'boolean' | 'date'

type FieldType =
    | SimpleFieldType
    | { type: 'enum'; options: string[] }
    | { type: 'list'; subtype: SimpleFieldType }
    | { type: 'object' }
    | { type: 'enum-list'; options: string[] }

const PRODUCT_TYPES = ['bus', 'hotel', 'flight', 'activity'] as const

type ProductType = (typeof PRODUCT_TYPES)[number]

const FIELD_TYPES: Record<ProductType, Record<string, FieldType>> = {
    bus: {
        img: 'string',
        departure_time: 'date',
        arrival_time: 'date',
        from_location: 'string',
        to_location: 'string',
        price_per_seat: 'number',
        bus_model: 'string',
        wifi_available: 'boolean',
        available_times: { type: 'list', subtype: 'date' },
        bus_seats: 'string',
    },
    hotel: {
        img: 'string',
        room_types: {
            type: 'enum-list',
            options: ['Single', 'Double', 'Triple'],
        },
        prices_per_night: { type: 'object' },
        rating: 'number',
        pros: { type: 'list', subtype: 'string' },
        cons: { type: 'list', subtype: 'string' },
        policy: 'string',
        for_children: 'boolean',
        available_rooms: { type: 'object' },
        amenities_per_type: { type: 'object' },
        reviews: { type: 'object' },
    },
    flight: {
        img: 'string',
        airline: 'string',
        flight_number: 'string',
        departure_airport: 'string',
        arrival_airport: 'string',
        departure_time: 'date',
        arrival_time: 'date',
        price_per_ticket: 'number',
        flight_type: 'string',
        available_tickets: 'number',
    },
    activity: {
        img: 'string',
        duration_hours: 'number',
        start_time: 'date',
        price_per_person: 'number',
        max_size: 'number',
        includes: { type: 'list', subtype: 'string' },
        difficulty_level: {
            type: 'enum',
            options: ['Easy', 'Moderate', 'Hard'],
        },
    },
}

const PRODUCT_KEYS: Record<ProductType, string[]> = Object.fromEntries(
    Object.entries(FIELD_TYPES).map(([t, fields]) => [t, Object.keys(fields)])
) as Record<ProductType, string[]>

function labelling(key: string) {
    return capitalizeWords(key.replace(/_/g, ' '))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDateForControl(v: any) {
    if (!v) return ''
    const d = dayjs(v)
    return d.isValid() ? d.format('YYYY-MM-DDTHH:mm') : ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeValue(fieldType: FieldType, value: any): any {
    if (fieldType === 'number') {
        if (value === '' || value === null || value === undefined) return null
        const num = Number(value)
        return Number.isFinite(num) ? num : null
    }
    if (fieldType === 'boolean') return Boolean(value)
    if (fieldType === 'date') {
        if (!value) return null
        const d = value instanceof Date ? value : new Date(value)
        return isNaN(d.getTime()) ? null : d
    }
    if (fieldType === 'string') {
        // Only convert if primitive, not array/object
        if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
        ) {
            return String(value)
        }
        return value // keep arrays/objects as-is
    }

    // lists (keep as array)
    if (typeof fieldType === 'object' && fieldType.type === 'list') {
        return Array.isArray(value)
            ? value.map((item) => normalizeValue(fieldType.subtype, item))
            : []
    }

    // enums
    if (typeof fieldType === 'object' && fieldType.type === 'enum') {
        return String(value ?? '')
    }

    // enum-list
    if (typeof fieldType === 'object' && fieldType.type === 'enum-list') {
        return Array.isArray(value)
            ? value.filter((v) => fieldType.options.includes(v))
            : []
    }

    // Special case: reviews, available_rooms, amenities_per_type
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return value
    }

    return value
}

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

type Draft = Partial<ProductObject> & {
    type: ProductType | ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: Record<string, any> & { img?: File }
}

type ProductFormProps = {
    title: string
    draft: Draft
    setDraft: (p: Draft) => void
    locations: LocationObject[]
    onCancel: () => void
    onSave: (finalProduct: ProductObject) => void
    isEditing?: boolean
}

function ProductForm({
    title,
    draft,
    setDraft,
    locations,
    onCancel,
    onSave,
    isEditing = false,
}: ProductFormProps) {
    const currentType = draft.type as ProductType | ''
    const availableKeys = currentType ? PRODUCT_KEYS[currentType] : []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: keyof ProductObject, val: any) => {
        setDraft({ ...draft, [field]: val })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDetailChange = (key: string, val: any) => {
        const details = { ...(draft.details || {}), [key]: val }
        setDraft({ ...draft, details })
    }

    const handleRemoveDetail = (key: string) => {
        const details = { ...(draft.details || {}) }
        delete details[key]
        setDraft({ ...draft, details })
    }

    const handleAddDetailKey = (key: string) => {
        if (!key) return
        const fieldType = currentType
            ? FIELD_TYPES[currentType]?.[key]
            : 'string'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let initial: any = ''
        if (fieldType === 'boolean') initial = false
        else if (fieldType === 'number') initial = 0
        else if (fieldType === 'date') initial = ''
        else if (typeof fieldType === 'object' && fieldType.type === 'list')
            initial = []
        else if (typeof fieldType === 'object' && fieldType.type === 'enum')
            initial = ''
        handleDetailChange(key, initial)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderDetailInput = (key: string, value: any) => {
        if (!currentType) return null
        const fieldType = FIELD_TYPES[currentType]?.[key] ?? 'string'

        // img
        if (key === 'img') {
            return (
                <UploadImageField
                    fieldType='img'
                    onFileSelect={(file) =>
                        setDraft({
                            ...draft,
                            details: { ...draft.details, img: file },
                        })
                    }
                    initialPreview={
                        typeof draft.details?.img === 'string'
                            ? draft.details.img
                            : undefined
                    }
                />
            )
        }

        // boolean
        if (fieldType === 'boolean') {
            return (
                <label className='switch'>
                    <input
                        type='checkbox'
                        checked={Boolean(value)}
                        onChange={(e) =>
                            handleDetailChange(key, e.target.checked)
                        }
                    />
                    <span className='slider' />
                    <span className='switch-label'>
                        {Boolean(value) ? 'Yes' : 'No'}
                    </span>
                </label>
            )
        }

        // number
        if (fieldType === 'number') {
            return (
                <input
                    type='number'
                    className='form-input'
                    value={value ?? ''}
                    onChange={(e) =>
                        handleDetailChange(
                            key,
                            e.target.value === '' ? '' : Number(e.target.value)
                        )
                    }
                />
            )
        }

        // date
        if (fieldType === 'date') {
            return (
                <input
                    type='datetime-local'
                    className='form-input'
                    value={formatDateForControl(value)}
                    onChange={(e) => handleDetailChange(key, e.target.value)}
                />
            )
        }

        // enum
        if (typeof fieldType === 'object' && fieldType.type === 'enum') {
            return (
                <select
                    className='form-select'
                    value={value || ''}
                    onChange={(e) => handleDetailChange(key, e.target.value)}
                >
                    <option value=''>Select...</option>
                    {fieldType.options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            )
        }

        // list
        if (typeof fieldType === 'object' && fieldType.type === 'list') {
            const items = Array.isArray(value) ? value : []
            return (
                <div className='list-editor'>
                    {items.map((item, idx) => {
                        const isDate = fieldType.subtype === 'date'
                        const isNumber = fieldType.subtype === 'number'
                        const controlType = isDate
                            ? 'datetime-local'
                            : isNumber
                              ? 'number'
                              : 'text'
                        const controlVal = isDate
                            ? formatDateForControl(item)
                            : (item ?? '')

                        return (
                            <div key={idx} className='list-row'>
                                <input
                                    type={controlType}
                                    className='form-input flex-1'
                                    value={controlVal}
                                    onChange={(e) => {
                                        const next = [...items]
                                        next[idx] = e.target.value
                                        handleDetailChange(key, next)
                                    }}
                                />
                                <button
                                    type='button'
                                    className='list-remove-btn'
                                    onClick={() => {
                                        const next = [...items]
                                        next.splice(idx, 1)
                                        handleDetailChange(key, next)
                                    }}
                                >
                                    <FiX />
                                </button>
                            </div>
                        )
                    })}
                    <button
                        className='secondary-btn text-xs'
                        onClick={() => handleDetailChange(key, [...items, ''])}
                    >
                        + Add Item
                    </button>
                </div>
            )
        }

        // Available Rooms (object with single, double, triple)
        if (key === 'available_rooms') {
            const rooms = value || { single: 0, double: 0, triple: 0 }
            return (
                <div className='flex gap-2'>
                    {['single', 'double', 'triple'].map((k) => (
                        <div
                            key={k}
                            className='flex flex-col gap-2 items-center'
                        >
                            <label className='form-label capitalize'>{k}</label>
                            <input
                                type='number'
                                className='form-input w-10 max-w-max text-center'
                                value={rooms[k] ?? 0}
                                onChange={(e) =>
                                    handleDetailChange(key, {
                                        ...rooms,
                                        [k]: Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                    ))}
                </div>
            )
        }

        // Prices Per Night (object with single, double, triple)
        if (key === 'prices_per_night') {
            const prices = value || { single: 0, double: 0, triple: 0 }
            return (
                <div className='flex gap-2'>
                    {['single', 'double', 'triple'].map((roomType) => (
                        <div
                            key={roomType}
                            className='flex flex-col gap-2 items-center'
                        >
                            <label className='form-label capitalize'>
                                {roomType}
                            </label>
                            <input
                                type='number'
                                className='form-input w-20 text-center'
                                value={prices[roomType] ?? 0}
                                onChange={(e) =>
                                    handleDetailChange(key, {
                                        ...prices,
                                        [roomType]: Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                    ))}
                </div>
            )
        }

        // Amenities Per Type (object with arrays inside)
        if (key === 'amenities_per_type') {
            const amenities = value || { single: [], double: [], triple: [] }
            return (
                <div className='flex flex-col gap-3'>
                    {['single', 'double', 'triple'].map((roomType) => {
                        const items: string[] =
                            (amenities[roomType] as string[]) || []
                        return (
                            <div key={roomType}>
                                <label className='form-label capitalize'>
                                    {roomType}
                                </label>
                                <div className='list-editor'>
                                    {items.map((item, idx) => (
                                        <div key={idx} className='list-row'>
                                            <input
                                                type='text'
                                                className='form-input flex-1'
                                                value={item}
                                                onChange={(e) => {
                                                    const next = [...items]
                                                    next[idx] = e.target.value
                                                    handleDetailChange(key, {
                                                        ...amenities,
                                                        [roomType]: next,
                                                    })
                                                }}
                                            />
                                            <button
                                                type='button'
                                                className='list-remove-btn'
                                                onClick={() => {
                                                    const next = [...items]
                                                    next.splice(idx, 1)
                                                    handleDetailChange(key, {
                                                        ...amenities,
                                                        [roomType]: next,
                                                    })
                                                }}
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        className='secondary-btn text-xs'
                                        onClick={() =>
                                            handleDetailChange(key, {
                                                ...amenities,
                                                [roomType]: [...items, ''],
                                            })
                                        }
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )
        }

        // Reviews (array of objects)
        if (key === 'reviews') {
            const reviews = Array.isArray(value) ? value : []
            return (
                <div className='flex flex-col gap-3'>
                    {reviews.map((rev, idx) => (
                        <div
                            key={idx}
                            className='border p-3 rounded-md flex flex-col gap-2 relative'
                        >
                            <input
                                type='text'
                                className='form-input'
                                placeholder='Name'
                                value={rev.name || ''}
                                onChange={(e) => {
                                    const next = [...reviews]
                                    next[idx] = {
                                        ...next[idx],
                                        name: e.target.value,
                                    }
                                    handleDetailChange(key, next)
                                }}
                            />
                            <input
                                type='number'
                                className='form-input'
                                placeholder='Rating'
                                value={rev.rating || 0}
                                onChange={(e) => {
                                    const next = [...reviews]
                                    next[idx] = {
                                        ...next[idx],
                                        rating: Number(e.target.value),
                                    }
                                    handleDetailChange(key, next)
                                }}
                            />
                            <textarea
                                className='form-textarea'
                                placeholder='Review text'
                                value={rev.text || ''}
                                onChange={(e) => {
                                    const next = [...reviews]
                                    next[idx] = {
                                        ...next[idx],
                                        text: e.target.value,
                                    }
                                    handleDetailChange(key, next)
                                }}
                            />
                            <button
                                type='button'
                                className='absolute top-2 right-2 text-red-500 hover:opacity-80'
                                onClick={() => {
                                    const next = [...reviews]
                                    next.splice(idx, 1)
                                    handleDetailChange(key, next)
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        className='secondary-btn text-xs'
                        onClick={() =>
                            handleDetailChange(key, [
                                ...reviews,
                                { name: '', rating: 0, text: '' },
                            ])
                        }
                    >
                        + Add Review
                    </button>
                </div>
            )
        }

        // Enum List (multi-select)
        if (typeof fieldType === 'object' && fieldType.type === 'enum-list') {
            const selected: string[] = Array.isArray(value) ? value : []
            return (
                <div className='flex flex-col gap-2'>
                    {fieldType.options.map((opt) => {
                        const isChecked = selected.includes(opt)
                        return (
                            <label key={opt} className='switch'>
                                <input
                                    type='checkbox'
                                    className='hidden'
                                    checked={isChecked}
                                    onChange={(e) => {
                                        const next = e.target.checked
                                            ? [...selected, opt]
                                            : selected.filter((v) => v !== opt)
                                        handleDetailChange(key, next)
                                    }}
                                />
                                <span className='slider' />
                                <span className='switch-label'>{opt}</span>
                            </label>
                        )
                    })}
                </div>
            )
        }

        // default string
        return (
            <input
                className='form-input'
                value={value ?? ''}
                onChange={(e) => handleDetailChange(key, e.target.value)}
            />
        )
    }

    const handleSaveClick = () => {
        if (!draft.type || !draft.name || !draft.location_id) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalDetails: Record<string, any> = {}
        const map = FIELD_TYPES[draft.type]

        Object.entries(draft.details || {}).forEach(([k, v]) => {
            if (map && map[k] && k !== 'img') {
                finalDetails[k] = normalizeValue(map[k], v)
            } else if (k !== 'img') {
                finalDetails[k] = v
            }
        })

        const finalProduct: ProductObject = {
            ...(draft._id ? { _id: draft._id } : {}),
            type: draft.type,
            name: draft.name!,
            description: draft.description || '',
            location_id: draft.location_id!,
            is_active: Boolean(draft.is_active),
            details: finalDetails,
        } as ProductObject

        // pass file separately if exists
        onSave(finalProduct)
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
                        <label className='form-label'>Product Type</label>
                        <select
                            className='form-select'
                            value={draft.type}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    type: e.target.value as ProductType,
                                    details: {}, // reset when changing type
                                })
                            }
                        >
                            <option value=''>Select Product Type</option>
                            {PRODUCT_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {capitalizeWords(t)}
                                </option>
                            ))}
                        </select>
                    </div>

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
                        <label className='form-label'>Location</label>
                        <select
                            className='form-select'
                            value={draft.location_id ?? ''}
                            onChange={(e) =>
                                handleChange('location_id', e.target.value)
                            }
                        >
                            <option value=''>Select Location</option>
                            {locations.map((loc) => (
                                <option key={loc._id} value={loc._id}>
                                    {capitalizeWords(loc.name)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='form-row'>
                        <label className='form-label'>Active</label>
                        <label className='switch'>
                            <input
                                type='checkbox'
                                checked={Boolean(draft.is_active)}
                                onChange={(e) =>
                                    handleChange('is_active', e.target.checked)
                                }
                            />
                            <span className='slider' />
                            <span className='switch-label'>
                                {draft.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className='attributes-block'>
                    <div className='attributes-header'>
                        <h4>Attributes</h4>
                        {currentType && (
                            <select
                                className='form-select w-56'
                                value=''
                                onChange={(e) => {
                                    const key = e.target.value
                                    if (!key) return
                                    handleAddDetailKey(key)
                                }}
                            >
                                <option value=''>Add Attribute...</option>
                                {availableKeys
                                    .filter(
                                        (k) =>
                                            !(
                                                draft.details &&
                                                k in draft.details
                                            )
                                    )
                                    .map((k) => (
                                        <option key={k} value={k}>
                                            {labelling(k)}
                                        </option>
                                    ))}
                            </select>
                        )}
                    </div>

                    <div className='attributes-list'>
                        {Object.entries(draft.details || {}).map(
                            ([key, value]) => (
                                <div key={key} className='attr-row'>
                                    <div className='attr-key'>
                                        {labelling(key)}
                                    </div>
                                    <div className='attr-val'>
                                        {renderDetailInput(key, value)}
                                    </div>
                                    <div className='attr-remove'>
                                        <FiTrash2
                                            className='icon-btn text-red-500'
                                            onClick={() =>
                                                handleRemoveDetail(key)
                                            }
                                        />
                                    </div>
                                </div>
                            )
                        )}

                        {!currentType && (
                            <div className='attr-empty'>
                                Select a product type to add attributes.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className='drawer-footer'>
                <button className='primary-btn' onClick={handleSaveClick}>
                    {isEditing ? 'Save Changes' : 'Create Product'}
                </button>
                <button className='secondary-btn' onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default function ProductsTab() {
    const {
        getProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        getLocations,
    } = useContext(AdminContext)

    const [products, setProducts] = useState<ProductObject[]>([])
    const [locations, setLocations] = useState<LocationObject[]>([])

    const [creating, setCreating] = useState(false)
    const [editing, setEditing] = useState<null | ProductObject>(null)
    const [draft, setDraft] = useState<Draft>({
        type: '',
        name: '',
        description: '',
        location_id: '',
        is_active: true,
        details: {},
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [sortKey, setSortKey] = useState<
        keyof ProductObject | 'createdAt' | 'updatedAt'
    >('name')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    // Derived filtered + sorted products
    const displayedProducts = products
        .filter((p) => {
            if (!searchTerm.trim()) return true
            const search = searchTerm.toLowerCase()
            return (
                p.name.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search) ||
                p.type.toLowerCase().includes(search) ||
                Object.values(p.details || {})
                    .join(' ')
                    .toLowerCase()
                    .includes(search)
            )
        })
        .sort((a, b) => {
            let valA: string | number = ''
            let valB: string | number = ''

            if (sortKey === 'name') {
                valA = a.name.toLowerCase()
                valB = b.name.toLowerCase()
            } else if (sortKey === 'type') {
                valA = a.type.toLowerCase()
                valB = b.type.toLowerCase()
            } else if (sortKey === 'location_id') {
                valA = a.location_id.toLowerCase()
                valB = b.location_id.toLowerCase()
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

    const fetchProducts = useCallback(async () => {
        const data = await getProducts()
        setProducts(data.items || [])
    }, [getProducts])

    const fetchLocations = useCallback(async () => {
        const data = await getLocations()
        setLocations(data || [])
    }, [getLocations])

    useEffect(() => {
        fetchProducts().then()
        fetchLocations().then()
    }, [fetchProducts, fetchLocations])

    const openCreate = () => {
        setDraft({
            type: '',
            name: '',
            description: '',
            location_id: '',
            is_active: true,
            details: {},
        })
        setCreating(true)
    }

    const handleCreate = async (product: ProductObject) => {
        await createProduct(product, draft.details.img)
        setCreating(false)
        fetchProducts().then()
    }

    const openEdit = (prod: ProductObject) => {
        const cloned = deepClone(prod)
        setDraft({
            ...cloned,
            type: cloned.type as ProductType,
        })
        setEditing(cloned)
    }

    const handleUpdate = async (product: ProductObject) => {
        await updateProduct(product._id, product, draft.details.img)
        setEditing(null)
        fetchProducts().then()
    }

    const handleDelete = async (id: string) => {
        await deleteProduct(id)
        fetchProducts().then()
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

    return (
        <div className='table-wrapper'>
            <div className='search-bar'>
                {/* Search */}
                <input
                    type='text'
                    placeholder='Search by ID, name, type, or attribute...'
                    className='search-input'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className='header-bar'>
                <h2 className='page-title'>Products</h2>
                <button className='primary-btn' onClick={openCreate}>
                    <FiPlus className='mr-1' /> Add Product
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
                            <th
                                onClick={() => toggleSort('type')}
                                className='sortable'
                            >
                                Type {renderSortIcon('type')}
                            </th>
                            <th
                                onClick={() => toggleSort('location_id')}
                                className='sortable'
                            >
                                Location {renderSortIcon('location_id')}
                            </th>
                            <th>Status</th>
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
                        {displayedProducts.map((p) => (
                            <tr key={p._id}>
                                <td className='truncate'>{p.name}</td>
                                <td>{capitalizeWords(p.type)}</td>
                                <td className='truncate'>
                                    {locations.find(
                                        (l) => l._id === p.location_id
                                    )?.name || ''}
                                </td>
                                <td>
                                    <span
                                        className={`status-chip ${p.is_active ? 'active' : 'inactive'}`}
                                    >
                                        {p.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    {p.createdAt
                                        ? dayjs(p.createdAt).format(
                                              'DD MMM YYYY, hh:mm A'
                                          )
                                        : ''}
                                </td>
                                <td>
                                    {p.updatedAt
                                        ? dayjs(p.updatedAt).format(
                                              'DD MMM YYYY, hh:mm A'
                                          )
                                        : ''}
                                </td>
                                <td>
                                    <div className='action-icons justify-end'>
                                        <FiEdit2 onClick={() => openEdit(p)} />
                                        <FiTrash2
                                            className='text-red-500'
                                            onClick={() => handleDelete(p._id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {creating && (
                <ProductForm
                    title='Create Product'
                    draft={draft}
                    setDraft={setDraft}
                    locations={locations}
                    onCancel={() => setCreating(false)}
                    onSave={handleCreate}
                />
            )}

            {editing && (
                <ProductForm
                    title='Edit Product'
                    draft={draft}
                    setDraft={setDraft}
                    locations={locations}
                    onCancel={() => setEditing(null)}
                    onSave={handleUpdate}
                    isEditing
                />
            )}
        </div>
    )
}
