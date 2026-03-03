// Tourism-Frontend-main/app/buses/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaBus, 
  FaClock, 
  FaChair, 
  FaShieldAlt, 
  FaMapMarker, 
  FaHeadset,
  FaArrowRight
} from 'react-icons/fa';
import { searchTrips } from '@/src/api/bus-booking.api';
import TripCard from '@/src/components/BustripRelated/TripCard';
import { TripInstance, TripSearchParams } from '@/src/types/busbooking';
import '@/src/styles/pages/buses/page.css';

export default function BusesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [trips, setTrips] = useState<TripInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TripSearchParams>({
    from: searchParams?.get('from') || '',
    to: searchParams?.get('to') || '',
    date: searchParams?.get('date') || new Date().toISOString().split('T')[0],
    bus_type: searchParams?.get('bus_type') || '',
  });

  const fetchTrips = useCallback(async () => {
    if (!filters.from || !filters.to || !filters.date) return;
    
    setLoading(true);
    try {
      const response = await searchTrips(filters);
      if (response.success) {
        setTrips(response.trips || []);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (filters.from && filters.to && filters.date) {
      fetchTrips();
    }
  }, [filters.from, filters.to, filters.date, filters.bus_type, fetchTrips]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.date) params.append('date', filters.date);
    if (filters.bus_type) params.append('bus_type', filters.bus_type);
    
    router.push(`/buses?${params.toString()}`);
    fetchTrips();
  };

  return (
    <div className="buses-page">
      {/* Hero Section */}
      <div className="search-hero">
        <div className="hero-content">
          <h1 className="hero-title">Book Bus Tickets</h1>
          <h2 className="hero-title" style={{ fontSize: '2.5rem', marginTop: '-0.5rem' }}>
            Anytime, Anywhere
          </h2>
          <p className="hero-subtitle">
            Travel across Egypt with comfort. Choose from 1,000+ routes and 100+ operators.
          </p>

          {/* Search Card */}
          <div className="search-card">
            <div className="search-grid">
              <div className="search-field">
                <span className="field-label">FROM</span>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={filters.from}
                  onChange={(e) => setFilters({...filters, from: e.target.value})}
                />
              </div>

              <div className="search-field">
                <span className="field-label">TO</span>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={filters.to}
                  onChange={(e) => setFilters({...filters, to: e.target.value})}
                />
              </div>

              <div className="search-field">
                <span className="field-label">DATE OF JOURNEY</span>
                <input
                  type="date"
                  value={filters.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                />
              </div>

              <div className="search-field">
                <span className="field-label">BUS TYPE</span>
                <select
                  value={filters.bus_type}
                  onChange={(e) => setFilters({...filters, bus_type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="seater">Standard Seater</option>
                  <option value="semi-sleeper">Semi Sleeper</option>
                  <option value="sleeper">Luxury Sleeper</option>
                </select>
              </div>
            </div>

            {/* Features */}
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <FaShieldAlt />
                </div>
                <div className="feature-text">
                  <h4>Safe Travel</h4>
                  <p>Verified operators & sanitized buses</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <FaMapMarker />
                </div>
                <div className="feature-text">
                  <h4>Live Tracking</h4>
                  <p>Track your bus in real-time</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <FaHeadset />
                </div>
                <div className="feature-text">
                  <h4>24/7 Support</h4>
                  <p>Round the clock assistance</p>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="search-btn-container">
              <button className="search-btn" onClick={handleSearch}>
                <FaSearch /> Search Buses
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-section">
            <span className="stats-badge">
              1,000+ Routes • Covering major cities nationwide
            </span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="results-section">
        {filters.from && filters.to ? (
          <>
            <div className="results-header">
              <h2 className="results-title">
                {filters.from} to {filters.to} Buses
              </h2>
              <p className="results-subtitle">
                {new Date(filters.date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Searching for available buses...</p>
              </div>
            ) : trips.length > 0 ? (
              <div className="trips-grid">
                {trips.map((trip) => (
                  <TripCard key={trip._id} trip={trip} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <h3>No buses found</h3>
                <p>Try different dates or routes</p>
                <button className="reset-btn" onClick={() => setFilters({...filters, from: '', to: ''})}>
                  Clear Search
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="search-prompt">
            <h3>Search for buses</h3>
            <p>Enter your journey details to find available buses</p>
          </div>
        )}
      </div>
    </div>
  );
}