// Tourism-Frontend-main/app/dashboard/buses/BusesTab.tsx

'use client'

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { 
    FaBus, FaCalendarAlt, FaClock, FaEye, 
    FaPlus, FaArrowUp, FaArrowDown 
} from 'react-icons/fa';
import { adminBusApi } from '@/src/api/admin-bus.api';
import { UserContext } from '@/src/contexts/Contexts';
import '@/src/styles/components/DashboardRelated/BusesTab.css';

interface DashboardStats {
    totalBuses: number;
    activeTemplates: number;
    upcomingTrips: number;
    totalBookings: number;
    revenue: number;
    occupancyRate: number;
}

interface UpcomingTrip {
    _id: string;
    from_location: string;
    to_location: string;
    travel_date: string;
    departure_time: string;
    available_seats: number;
    total_seats: number;
    bus_vehicle: string;
}

export default function BusesTab() {
    const router = useRouter();
    const { user } = useContext(UserContext);
    
    const [stats, setStats] = useState<DashboardStats>({
        totalBuses: 0,
        activeTemplates: 0,
        upcomingTrips: 0,
        totalBookings: 0,
        revenue: 0,
        occupancyRate: 0
    });
    const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch buses
            const busesRes = await adminBusApi.getBuses();
            
            // Fetch templates
            const templatesRes = await adminBusApi.getTripTemplates();
            const activeTemplates = templatesRes.templates?.filter((t: any) => t.is_active) || [];
            
            // Fetch upcoming instances (next 7 days)
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            const instancesRes = await adminBusApi.getTripInstances({
                from_date: today.toISOString().split('T')[0],
                to_date: nextWeek.toISOString().split('T')[0],
                status: 'active'
            });

            // Process upcoming trips
            const trips: UpcomingTrip[] = (instancesRes.instances || []).map((instance: any) => ({
                _id: instance._id,
                from_location: instance.trip_template_id?.from_location || 'N/A',
                to_location: instance.trip_template_id?.to_location || 'N/A',
                travel_date: instance.travel_date,
                departure_time: instance.trip_template_id?.departure_time || '00:00',
                available_seats: instance.available_seats,
                total_seats: instance.trip_template_id?.bus_id?.total_seats || 0,
                bus_vehicle: instance.trip_template_id?.bus_id?.vehicle_no || 'N/A'
            }));

            setUpcomingTrips(trips);

            // ✅ FIXED: Added proper typing for reduce accumulator
            const totalSeats = trips.reduce((acc: number, trip: UpcomingTrip) => acc + trip.total_seats, 0);
            const bookedSeats = trips.reduce((acc: number, trip: UpcomingTrip) => 
                acc + (trip.total_seats - trip.available_seats), 0);
            const occupancyRate = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

            setStats({
                totalBuses: busesRes.buses?.length || 0,
                activeTemplates: activeTemplates.length,
                upcomingTrips: trips.length,
                totalBookings: 0,
                revenue: 0,
                occupancyRate: Math.round(occupancyRate)
            });

        } catch (error) {
            console.error('Error loading bus dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (d.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (d.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return d.toLocaleDateString('en-US', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
            });
        }
    };

    const formatTime = (time: string) => {
        return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const navigateToBuses = () => {
        router.push('/dashboard/buses');
    };

    const navigateToTemplates = () => {
        router.push('/dashboard/buses?tab=templates');
    };

    const navigateToInstances = () => {
        router.push('/dashboard/buses?tab=instances');
    };

    if (loading) {
        return (
            <div className="buses-tab-loading">
                <div className="loading-spinner"></div>
                <p>Loading bus dashboard...</p>
            </div>
        );
    }

    return (
        <div className="buses-tab">
            {/* Stats Grid */}
            <div className="buses-stats-grid">
                <div className="buses-stat-card" onClick={navigateToBuses}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <FaBus />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalBuses}</span>
                        <span className="stat-label">Total Buses</span>
                    </div>
                    <span className="stat-link">
                        <FaEye /> Manage
                    </span>
                </div>

                <div className="buses-stat-card" onClick={navigateToTemplates}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <FaClock />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.activeTemplates}</span>
                        <span className="stat-label">Active Routes</span>
                    </div>
                    <span className="stat-link">
                        <FaEye /> Manage
                    </span>
                </div>

                <div className="buses-stat-card" onClick={navigateToInstances}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                        <FaCalendarAlt />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.upcomingTrips}</span>
                        <span className="stat-label">Upcoming Trips</span>
                    </div>
                    <span className="stat-link">
                        <FaEye /> View
                    </span>
                </div>

                <div className="buses-stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
                        <FaClock />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.occupancyRate}%</span>
                        <span className="stat-label">Occupancy Rate</span>
                    </div>
                    <div className="stat-trend">
                        {stats.occupancyRate > 70 ? (
                            <FaArrowUp style={{ color: '#10b981' }} />
                        ) : (
                            <FaArrowDown style={{ color: '#ef4444' }} />
                        )}
                    </div>
                </div>
            </div>

            {/* Upcoming Trips Section */}
            <div className="buses-upcoming-section">
                <div className="section-header">
                    <h3>Upcoming Trips</h3>
                    <p>Next 7 days</p>
                    <button className="view-all-btn" onClick={navigateToInstances}>
                        View All →
                    </button>
                </div>

                {upcomingTrips.length === 0 ? (
                    <div className="buses-empty-state">
                        <FaCalendarAlt className="empty-icon" />
                        <h4>No upcoming trips</h4>
                        <p>Generate trips from your templates to see them here</p>
                        <button className="primary-btn" onClick={navigateToTemplates}>
                            Go to Trip Templates
                        </button>
                    </div>
                ) : (
                    <div className="buses-trips-grid">
                        {upcomingTrips.slice(0, 3).map((trip) => (
                            <div key={trip._id} className="buses-trip-card">
                                <div className="trip-header">
                                    <span className="trip-date">{formatDate(trip.travel_date)}</span>
                                    <span className="trip-time">{formatTime(trip.departure_time)}</span>
                                </div>
                                <div className="trip-route">
                                    <span className="route-from">{trip.from_location}</span>
                                    <span className="route-arrow">→</span>
                                    <span className="route-to">{trip.to_location}</span>
                                </div>
                                <div className="trip-bus">
                                    <FaBus /> {trip.bus_vehicle}
                                </div>
                                <div className="trip-seats">
                                    <div className="seat-info">
                                        <span className="available-seats">{trip.available_seats}</span>
                                        <span className="total-seats">/{trip.total_seats} seats</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: `${((trip.total_seats - trip.available_seats) / trip.total_seats) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <button 
                                    className="trip-link"
                                    onClick={() => router.push(`/dashboard/buses/instances/${trip._id}`)}
                                >
                                    View Details →
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="buses-quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-grid">
                    <button className="action-card" onClick={() => router.push('/dashboard/buses?action=add')}>
                        <FaBus className="action-icon" />
                        <span>Add New Bus</span>
                    </button>
                    <button className="action-card" onClick={() => router.push('/dashboard/buses?tab=templates&action=create')}>
                        <FaClock className="action-icon" />
                        <span>Create Route</span>
                    </button>
                    <button className="action-card" onClick={() => router.push('/dashboard/buses?tab=templates')}>
                        <FaCalendarAlt className="action-icon" />
                        <span>Generate Trips</span>
                    </button>
                    <button className="action-card" onClick={() => router.push('/dashboard/buses')}>
                        <FaEye className="action-icon" />
                        <span>Full Management</span>
                    </button>
                </div>
            </div>
        </div>
    );
}