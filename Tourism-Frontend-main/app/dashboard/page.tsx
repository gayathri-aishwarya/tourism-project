'use client'

import dayjs from 'dayjs'
import { useContext, useState, useEffect, useCallback } from 'react'
// Contexts
import { UserContext, AdminContext } from '@/src/contexts/Contexts'
// Components
import BookingsTab from '@/src/components/DashboardRelated/BookingsTab'
import BranchesTab from '@/src/components/DashboardRelated/BranchesTab'
import BundlesTab from '@/src/components/DashboardRelated/BundlesTab'
import EmployeesTab from '@/src/components/DashboardRelated/EmployeesTab'
import LocationsTab from '@/src/components/DashboardRelated/LocationsTab'
import ProductsTab from '@/src/components/DashboardRelated/ProductsTab'
import BusesTab from '@/src/components/DashboardRelated/BusesTab' 
// Types
import { HolidayObject } from '@/src/types/objectsTypes'
// Style
import '@/src/styles/pages/dashboard/page.css'

const TABS = [
    { key: 'bookings', label: 'Bookings Management', permission: 'bookings' },
    { key: 'branches', label: 'Branches Management', permission: 'branches' },
    { key: 'employees', label: 'Employee Management', permission: 'employees' },
    { key: 'locations', label: 'Location Management', permission: 'locations' },
    { key: 'products', label: 'Product Management', permission: 'products' },
    { key: 'bundles', label: 'Bundle Management', permission: 'bundles' },
    { key: 'buses', label: 'Bus Management', permission: 'buses' }, 
]

export default function Page() {
    // Contexts functions
    const { user, isAdmin, isEmployee } = useContext(UserContext)
    const { getHolidays } = useContext(AdminContext)
    // States
    const [activeTab, setActiveTab] = useState('bookings')
    const [holidays, setHolidays] = useState<Partial<HolidayObject>[]>([])
    const [loading, setLoading] = useState(true)

    const fetchHolidays = useCallback(async () => {
        try {
            const data = await getHolidays()
            setHolidays(data.holidays || [])
        } catch (err) {
            console.error('Error loading holidays:', err)
        } finally {
            setLoading(false)
        }
    }, [getHolidays])

    useEffect(() => {
        fetchHolidays().then()
    }, [fetchHolidays])

    if (!user || (!isAdmin() && !isEmployee())) {
        return (
            <div className='permissions-text'>
                You do not have permission to access the dashboard.
            </div>
        )
    }

    const availableTabs = isAdmin()
        ? TABS
        : TABS.filter((tab) => user?.permissions?.includes(tab.permission))

    if (availableTabs.length === 0) {
        return (
            <div className='permissions-text'>
                You have no assigned permissions to view any dashboard sections.
            </div>
        )
    }

    const currentTab = availableTabs.find((t) => t.key === activeTab)
        ? activeTab
        : availableTabs[0].key

    return (
        <div className='dashboard-page'>
            {/* Holidays Section */}
            <section className='holidays-section'>
                <h2 className='holidays-title'>Upcoming Holidays</h2>
                <p className='holidays-subtitle'>
                    Upcoming holidays in the next 60 days
                </p>

                {loading && (
                    <p className='holidays-loading'>Loading holidays...</p>
                )}

                {!loading && holidays.length === 0 && (
                    <p className='holidays-empty'>
                        No upcoming holidays in the next 60 days
                    </p>
                )}

                <div className='holidays-grid'>
                    {holidays.map((holiday, idx) => (
                        <div key={idx} className='holiday-card'>
                            {holiday.name && (
                                <h3 className='holiday-name'>{holiday.name}</h3>
                            )}
                            {holiday.date && (
                                <p className='holiday-date'>
                                    {dayjs(new Date(holiday.date)).format(
                                        'DD MMM, YYYY'
                                    )}
                                </p>
                            )}
                            {holiday.description && (
                                <p className='holiday-description'>
                                    {holiday.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <hr className="dashboard-separator"/>

            {/* Dashboard Stats Section - NEW */}
            {currentTab === 'bookings' && (
                <>
                    {/* Quick Stats for Bookings - You can add stats here if needed */}
                </>
            )}

            {/* Dashboard Tabs */}
            <section className='tabs-section'>
                <h2 className='tabs-title'>Dashboard</h2>
                <p className='tabs-subtitle'>
                    Manage and monitor all branches, employees, locations,
                    products, bundles, buses, and upcoming holidays in one place.
                </p>

                <div className='tabs-header'>
                    {availableTabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`tab-btn ${currentTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className='tabs-content'>
                    {currentTab === 'bookings' && <BookingsTab/>}
                    {currentTab === 'branches' && <BranchesTab/>}
                    {currentTab === 'employees' && <EmployeesTab/>}
                    {currentTab === 'locations' && <LocationsTab/>}
                    {currentTab === 'products' && <ProductsTab/>}
                    {currentTab === 'bundles' && <BundlesTab/>}
                    {currentTab === 'buses' && <BusesTab/>} {/* ✅ NEW TAB CONTENT */}
                </div>
            </section>
        </div>
    )
}