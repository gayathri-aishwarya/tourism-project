'use client'

import dayjs from 'dayjs'
import { useState, useEffect, useContext, useCallback } from 'react'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
// Context
import { AdminContext } from '@/src/contexts/Contexts'
// Types
import {
    BundleObject,
    PopulatedBundleObject,
    ProductObject,
    LocationObject,
} from '@/src/types/objectsTypes'
// Styles
import '@/src/styles/components/DashboardRelated/TableAndForm.css'

type MaybeId<T extends { _id: string }> = string | T

const toId = <T extends { _id: string }>(
    val: MaybeId<T> | undefined | null
): string => (typeof val === 'string' ? val : (val?._id ?? ''))

function short(id: string) {
    return id?.length > 6 ? id.slice(-6) : id || ''
}

type Draft = Partial<BundleObject> & {
    price: number | string
    product_ids: string[]
    location_id: string
}

type BundleFormProps = {
    title: string
    draft: Draft
    setDraft: (b: Draft) => void
    products: ProductObject[]
    locations: LocationObject[]
    onCancel: () => void
    onSave: (finalBundle: BundleObject) => void
    isEditing?: boolean
}

function BundleForm({
    title,
    draft,
    setDraft,
    products,
    locations,
    onCancel,
    onSave,
    isEditing = false,
}: BundleFormProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: keyof Draft, val: any) => {
        setDraft({ ...draft, [field]: val })
    }

    const handleSaveClick = () => {
        if (
            !draft.name ||
            !draft.description ||
            !draft.price ||
            !draft.location_id
        )
            return

        const finalBundle: BundleObject = {
            ...(draft._id ? { _id: draft._id } : {}),
            name: draft.name!,
            description: draft.description!,
            price: Number(draft.price),
            is_active: draft.is_active ?? true,
            location_id: draft.location_id,
            product_ids: draft.product_ids.filter(Boolean),
        } as BundleObject

        onSave(finalBundle)
    }

    const findProduct = (id?: string) =>
        id ? products.find((p) => p._id === id) || null : null

    const availableProducts = (selected: string[], keepId?: string) => {
        const chosen = new Set(selected)
        return products.filter(
            (p) => !chosen.has(p._id) || p._id === (keepId || '')
        )
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
                        <label className='form-label'>Price</label>
                        <input
                            type='number'
                            className='form-input'
                            value={draft.price ?? ''}
                            onChange={(e) =>
                                handleChange('price', e.target.value)
                            }
                        />
                    </div>

                    <div className='form-row'>
                        <label className='form-label'>Active</label>
                        <label className='switch'>
                            <input
                                type='checkbox'
                                checked={draft.is_active ?? true}
                                onChange={(e) =>
                                    handleChange('is_active', e.target.checked)
                                }
                            />
                            <span className='slider'></span>
                        </label>
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
                                    {loc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='form-row'>
                        <label className='form-label'>Products</label>
                        <div className='flex flex-col gap-2'>
                            {draft.product_ids.map((pid, idx) => (
                                <div
                                    key={idx}
                                    className='flex gap-2 items-center'
                                >
                                    <select
                                        className='form-select flex-1'
                                        value={pid}
                                        onChange={(e) => {
                                            const next = [...draft.product_ids]
                                            next[idx] = e.target.value
                                            setDraft({
                                                ...draft,
                                                product_ids: next,
                                            })
                                        }}
                                    >
                                        <option value=''>Select Product</option>
                                        {pid && !findProduct(pid) && (
                                            <option value={pid}>
                                                {`Unknown (${short(pid)})`}
                                            </option>
                                        )}
                                        {availableProducts(
                                            draft.product_ids,
                                            pid
                                        ).map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <FiTrash2
                                        className='icon-btn text-red-500'
                                        onClick={() => {
                                            const next =
                                                draft.product_ids.filter(
                                                    (_, i) => i !== idx
                                                )
                                            setDraft({
                                                ...draft,
                                                product_ids: next,
                                            })
                                        }}
                                    />
                                </div>
                            ))}
                            <button
                                type='button'
                                className='secondary-btn text-xs'
                                onClick={() =>
                                    setDraft({
                                        ...draft,
                                        product_ids: [...draft.product_ids, ''],
                                    })
                                }
                            >
                                + Add Product
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className='drawer-footer'>
                <button className='primary-btn' onClick={handleSaveClick}>
                    {isEditing ? 'Save Changes' : 'Create Bundle'}
                </button>
                <button className='secondary-btn' onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default function BundlesTab() {
    const {
        getBundles,
        getProducts,
        getLocations,
        createBundle,
        updateBundle,
        deleteBundle,
    } = useContext(AdminContext)

    const [bundles, setBundles] = useState<BundleObject[]>([])
    const [products, setProducts] = useState<ProductObject[]>([])
    const [locations, setLocations] = useState<LocationObject[]>([])

    const [creating, setCreating] = useState(false)
    const [editing, setEditing] = useState<null | BundleObject>(null)
    const [draft, setDraft] = useState<Draft>({
        name: '',
        description: '',
        price: 0,
        location_id: '',
        product_ids: [],
        is_active: true,
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [sortKey, setSortKey] = useState<
        'name' | 'price' | 'location_id' | 'createdAt' | 'updatedAt'
    >('name')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    const normalizeBundles = (
        list: (BundleObject | PopulatedBundleObject)[]
    ): BundleObject[] =>
        (list || []).map((b) => ({
            ...b,
            location_id: toId(b.location_id as MaybeId<LocationObject>),
            product_ids: (b.product_ids || []).map((pid) =>
                toId(pid as MaybeId<ProductObject>)
            ),
        }))

    const fetchData = useCallback(async () => {
        try {
            const [bundleData, productResp, locationData] = await Promise.all([
                getBundles(),
                getProducts(undefined, 10000),
                getLocations(),
            ])
            setBundles(normalizeBundles(bundleData || []))
            setProducts(productResp?.items || [])
            setLocations(locationData || [])
        } catch (err) {
            console.error('Failed to fetch data', err)
        }
    }, [getBundles, getProducts, getLocations])

    useEffect(() => {
        fetchData().then()
    }, [fetchData])

    const openCreate = () => {
        setDraft({
            name: '',
            description: '',
            price: 0,
            location_id: '',
            product_ids: [],
        })
        setCreating(true)
    }

    const handleCreate = async (bundle: BundleObject) => {
        await createBundle({
            name: bundle.name,
            description: bundle.description,
            price: Number(bundle.price),
            is_active: true,
            location_id: bundle.location_id,
            product_ids: bundle.product_ids,
        })
        setCreating(false)
        fetchData().then()
    }

    const openEdit = (b: BundleObject) => {
        setDraft({
            ...b,
            price: b.price,
            product_ids: [...b.product_ids],
            location_id: b.location_id,
            is_active: b.is_active,
        })
        setEditing(b)
    }

    const handleUpdate = async (bundle: BundleObject) => {
        await updateBundle(bundle._id, bundle)
        setEditing(null)
        fetchData().then()
    }

    const handleDelete = async (id: string) => {
        await deleteBundle(id)
        fetchData().then()
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

    const displayedBundles = bundles
        .filter((b) => {
            if (!searchTerm.trim()) return true
            const s = searchTerm.toLowerCase()
            const productNames = b.product_ids
                .map((id) => products.find((p) => p._id === id)?.name || '')
                .join(' ')
                .toLowerCase()
            const locationName =
                locations.find((l) => l._id === b.location_id)?.name || ''
            return (
                b.name.toLowerCase().includes(s) ||
                b.description.toLowerCase().includes(s) ||
                String(b.price).toLowerCase().includes(s) ||
                productNames.includes(s) ||
                locationName.toLowerCase().includes(s)
            )
        })
        .sort((a, b) => {
            let valA: string | number = ''
            let valB: string | number = ''
            if (sortKey === 'name') {
                valA = a.name.toLowerCase()
                valB = b.name.toLowerCase()
            } else if (sortKey === 'price') {
                valA = a.price
                valB = b.price
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

    return (
        <div className='table-wrapper'>
            <div className='search-bar'>
                <input
                    type='text'
                    placeholder='Search by name, description, price, product, or location...'
                    className='search-input'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className='header-bar'>
                <h2 className='page-title'>Bundles</h2>
                <button className='primary-btn' onClick={openCreate}>
                    <FiPlus className='mr-1' /> Add Bundle
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
                            <th
                                onClick={() => toggleSort('price')}
                                className='sortable'
                            >
                                Price {renderSortIcon('price')}
                            </th>
                            <th>Active</th>
                            <th
                                onClick={() => toggleSort('location_id')}
                                className='sortable'
                            >
                                Location {renderSortIcon('location_id')}
                            </th>
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
                        {displayedBundles.map((b) => (
                            <tr key={b._id}>
                                <td className='truncate'>{b.name}</td>
                                <td className='truncate'>{b.description}</td>
                                <td>{b.price}</td>
                                <td>
                                    <span
                                        className={`status-chip ${b.is_active ? 'active' : 'inactive'}`}
                                    >
                                        {b.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    {locations.find(
                                        (l) => l._id === b.location_id
                                    )?.name ||
                                        `Unknown (${short(b.location_id)})`}
                                </td>
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
                <BundleForm
                    title='Create Bundle'
                    draft={draft}
                    setDraft={setDraft}
                    products={products}
                    locations={locations}
                    onCancel={() => setCreating(false)}
                    onSave={handleCreate}
                />
            )}

            {editing && (
                <BundleForm
                    title='Edit Bundle'
                    draft={draft}
                    setDraft={setDraft}
                    products={products}
                    locations={locations}
                    onCancel={() => setEditing(null)}
                    onSave={handleUpdate}
                    isEditing
                />
            )}
        </div>
    )
}
