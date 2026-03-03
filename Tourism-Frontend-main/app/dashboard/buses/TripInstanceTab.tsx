'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  FaTimes, FaEye, FaCalendarAlt, FaBus, FaMapMarkerAlt, 
  FaClock, FaFilter, FaSearch, FaChair, FaDollarSign,
  FaUser, FaPhone, FaCheck, FaTimesCircle, FaSpinner,
  FaEdit, FaTrash, FaSave
} from 'react-icons/fa';
import { adminBusApi } from '@/src/api/admin-bus.api';
import styles from './TripInstanceTab.module.css';

// Types
interface Bus {
  _id: string;
  vehicle_no: string;
  bus_type: string;
  total_seats: number;
}

interface TripTemplate {
  _id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  ticket_price: number;
  schedule_type: 'never' | 'daily' | 'weekly' | 'monthly';
  schedule_meta?: string | null;
  is_active?: boolean;
  bus_id: Bus;
}

interface TripInstance {
  _id: string;
  trip_template_id: TripTemplate;
  travel_date: string;
  booked_seats: string[];
  available_seats: number;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

interface BookingSeat {
  seat_number: string;
  passenger_name: string;
  age: number;
  price_paid: number;
}

interface Booking {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  total_fare: number;
  booking_status: string;
  seats?: BookingSeat[];
  created_at: string;
}

interface BookingsResponse {
  success: boolean;
  bookings: Booking[];
}

interface GenerateInstancesData {
  trip_template_id: string;
  start_date: string;
  end_date: string;
}

interface EditInstanceData {
  travel_date: string;
  status: 'active' | 'cancelled' | 'completed';
  available_seats: number;
}

export default function TripInstanceTab() {
  const searchParams = useSearchParams();
  const templateParam = searchParams?.get('template') ?? null;
  
  const [instances, setInstances] = useState<TripInstance[]>([]);
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<TripInstance | null>(null);
  const [instanceBookings, setInstanceBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Edit form state
  const [editForm, setEditForm] = useState<EditInstanceData>({
    travel_date: '',
    status: 'active',
    available_seats: 0
  });
  const [updating, setUpdating] = useState(false);
  
  // Generate form state
  const [generateForm, setGenerateForm] = useState<GenerateInstancesData>({
    trip_template_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<{ created: number; skipped: number } | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    template_id: '',
    status: '',
    from_date: '',
    to_date: '',
    search: ''
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    cancelled: 0,
    completed: 0
  });

  const [filteredInstances, setFilteredInstances] = useState<TripInstance[]>([]);
  const isDataLoaded = useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (templateParam && templates.length > 0) {
      setGenerateForm(prev => ({
        ...prev,
        trip_template_id: templateParam
      }));
      setShowGenerateModal(true);
    }
  }, [templates, templateParam]);

  // Apply filters only when data is loaded and instances exist
  useEffect(() => {
    if (isDataLoaded.current && instances.length > 0) {
      applyFilters();
    } else if (instances.length === 0) {
      setFilteredInstances([]);
    }
  }, [instances, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      isDataLoaded.current = false;
      
      const [instancesRes, templatesRes] = await Promise.all([
        adminBusApi.getTripInstances(),
        adminBusApi.getTripTemplates()
      ]);
      
      const instancesData = instancesRes?.instances || instancesRes?.data?.instances || [];
      const templatesData = templatesRes?.templates || templatesRes?.data?.templates || [];
      
      setInstances(instancesData);
      setTemplates(templatesData);
      
      // Calculate stats
      const active = instancesData.filter((i: any) => i?.status === 'active').length;
      const cancelled = instancesData.filter((i: any) => i?.status === 'cancelled').length;
      const completed = instancesData.filter((i: any) => i?.status === 'completed').length;
      
      setStats({
        total: instancesData.length,
        active,
        cancelled,
        completed
      });

      // Set filtered instances after data is loaded
      setFilteredInstances(instancesData);
      isDataLoaded.current = true;
      
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
      isDataLoaded.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch real bookings from the database
  const loadBookingsForInstance = async (instanceId: string) => {
    try {
      setLoadingBookings(true);
      
      const response = await fetch(`/api/bus-bookings?trip_instance_id=${instanceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
      
      const data: BookingsResponse = await response.json();
      
      if (data.success) {
        setInstanceBookings(data.bookings || []);
      } else {
        setInstanceBookings([]);
        console.error('Failed to load bookings:', data);
      }
      
    } catch (err) {
      console.error('Error loading bookings:', err);
      setInstanceBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const applyFilters = useCallback(() => {
    if (!instances || !Array.isArray(instances) || instances.length === 0) {
      setFilteredInstances([]);
      return;
    }

    try {
      let filtered = [...instances];

      if (filters.template_id && filters.template_id !== '') {
        filtered = filtered.filter(i => i?.trip_template_id?._id === filters.template_id);
      }

      if (filters.status && filters.status !== '') {
        filtered = filtered.filter(i => i?.status === filters.status);
      }

      if (filters.from_date && filters.from_date !== '') {
        filtered = filtered.filter(i => {
          if (!i?.travel_date) return false;
          try {
            return new Date(i.travel_date) >= new Date(filters.from_date);
          } catch {
            return false;
          }
        });
      }
      
      if (filters.to_date && filters.to_date !== '') {
        filtered = filtered.filter(i => {
          if (!i?.travel_date) return false;
          try {
            return new Date(i.travel_date) <= new Date(filters.to_date);
          } catch {
            return false;
          }
        });
      }

      if (filters.search && filters.search.trim() !== '') {
        const searchLower = filters.search.toLowerCase().trim();
        filtered = filtered.filter(i => {
          const fromLocation = (i?.trip_template_id?.from_location || '').toLowerCase();
          const toLocation = (i?.trip_template_id?.to_location || '').toLowerCase();
          const vehicleNo = (i?.trip_template_id?.bus_id?.vehicle_no || '').toLowerCase();
          
          return fromLocation.includes(searchLower) ||
                 toLocation.includes(searchLower) ||
                 vehicleNo.includes(searchLower);
        });
      }

      setFilteredInstances(filtered);
    } catch (err) {
      console.error('Error applying filters:', err);
      setFilteredInstances(instances);
    }
  }, [instances, filters]);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ========== EDIT INSTANCE ==========
  const handleEditClick = (instance: TripInstance) => {
    setSelectedInstance(instance);
    setEditForm({
      travel_date: instance.travel_date.split('T')[0], // Format date for input
      status: instance.status,
      available_seats: instance.available_seats
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'available_seats' ? parseInt(value) || 0 : value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance) return;
    
    setUpdating(true);
    setError('');

    try {
      // Validate
      if (editForm.available_seats < 0) {
        throw new Error('Available seats cannot be negative');
      }

      const updateData: any = {
        status: editForm.status,
        available_seats: editForm.available_seats
      };

      // Only update travel_date if it changed
      if (editForm.travel_date !== selectedInstance.travel_date.split('T')[0]) {
        updateData.travel_date = editForm.travel_date;
      }

      await adminBusApi.updateTripInstance(selectedInstance._id, updateData);
      
      setShowEditModal(false);
      setSelectedInstance(null);
      await loadData();
      showSuccess('Trip instance updated successfully!');
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || 'Failed to update instance');
    } finally {
      setUpdating(false);
    }
  };

  // ========== DELETE INSTANCE ==========
  const handleDeleteClick = (instance: TripInstance) => {
    setSelectedInstance(instance);
    if (confirm(`Are you sure you want to delete this trip on ${formatDate(instance.travel_date)}? This action cannot be undone.`)) {
      handleDeleteConfirm(instance._id);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await adminBusApi.deleteTripInstance(id);
      await loadData();
      showSuccess('Trip instance deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting instance:', err);
      showError(err.response?.data?.message || 'Failed to delete instance. Make sure there are no bookings.');
    }
  };

  // ========== GENERATE INSTANCES ==========
  const handleGenerateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGenerateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');

    try {
      if (!generateForm.trip_template_id) {
        throw new Error('Please select a trip template');
      }
      if (!generateForm.start_date || !generateForm.end_date) {
        throw new Error('Please select start and end dates');
      }
      if (new Date(generateForm.start_date) > new Date(generateForm.end_date)) {
        throw new Error('Start date must be before end date');
      }

      const response = await adminBusApi.generateInstances(generateForm);
      setGenerateResult(response?.stats || { created: 0, skipped: 0 });
      showSuccess(`Generated ${response?.stats?.created || 0} new trips!`);
      
      setTimeout(async () => {
        await loadData();
        setShowGenerateModal(false);
        setGenerateResult(null);
        setGenerateForm({
          trip_template_id: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }, 2000);
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || 'Failed to generate instances');
    } finally {
      setGenerating(false);
    }
  };

  // ========== CANCEL INSTANCE ==========
  const handleCancelInstance = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this trip? This will affect all bookings.')) {
      return;
    }

    try {
      await adminBusApi.cancelTripInstance(id);
      await loadData();
      showSuccess('Trip cancelled successfully');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to cancel trip');
    }
  };

  // ========== VIEW BOOKINGS ==========
  const handleViewBookings = async (instance: TripInstance) => {
    setSelectedInstance(instance);
    setShowBookingModal(true);
    await loadBookingsForInstance(instance._id);
  };

  // ========== UTILITY FUNCTIONS ==========
  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    try {
      return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Time';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className={`${styles.badge} ${styles.active}`}><FaCheck /> Active</span>;
      case 'cancelled':
        return <span className={`${styles.badge} ${styles.cancelled}`}><FaTimesCircle /> Cancelled</span>;
      case 'completed':
        return <span className={`${styles.badge} ${styles.completed}`}>Completed</span>;
      default:
        return <span className={styles.badge}>{status || 'Unknown'}</span>;
    }
  };

  const clearFilters = () => {
    setFilters({
      template_id: '',
      status: '',
      from_date: '',
      to_date: '',
      search: ''
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <FaSpinner className={styles.loadingSpinner} />
        <p>Loading trip instances...</p>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Success/Error Messages */}
      {successMessage && (
        <div className={styles.successMessage}>
          <FaCheck /> {successMessage}
        </div>
      )}
      {error && (
        <div className={styles.errorMessage}>
          <FaTimesCircle /> {error}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h2>Scheduled Trips</h2>
          <p className={styles.subtitle}>Manage and monitor all bus trips</p>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.activeText}`}>{stats.active}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.completedText}`}>{stats.completed}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionBar}>
        <button 
          className={styles.generateBtn}
          onClick={() => setShowGenerateModal(true)}
        >
          <FaCalendarAlt /> Generate Trips
        </button>
        <button 
          onClick={loadData}
          className={styles.refreshBtn}
        >
          <FaSpinner /> Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by route or bus number..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        
        <button 
          className={`${styles.filterBtn} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filters
        </button>
      </div>

      {showFilters && (
        <div className={styles.filters}>
          <select
            value={filters.template_id}
            onChange={(e) => handleFilterChange('template_id', e.target.value)}
          >
            <option value="">All Routes</option>
            {templates.map((t) => (
              <option key={t?._id} value={t?._id}>
                {t?.from_location || 'N/A'} → {t?.to_location || 'N/A'}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => handleFilterChange('from_date', e.target.value)}
            placeholder="From Date"
          />

          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => handleFilterChange('to_date', e.target.value)}
            placeholder="To Date"
          />

          <button onClick={clearFilters} className={styles.clearBtn}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className={styles.summary}>
        <span>Showing {filteredInstances.length} of {instances.length} trips</span>
      </div>

      {filteredInstances.length === 0 ? (
        <div className={styles.empty}>
          <FaCalendarAlt className={styles.emptyIcon} />
          <h3>No Trip Instances Found</h3>
          <p>Try adjusting your filters or generate new trips from templates</p>
          <button 
            className={styles.emptyBtn}
            onClick={() => setShowGenerateModal(true)}
          >
            <FaCalendarAlt /> Generate Trips
          </button>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div>Date</div>
            <div>Route</div>
            <div>Bus</div>
            <div>Time</div>
            <div>Seats</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filteredInstances.map((instance) => {
            const template = instance?.trip_template_id;
            const bus = template?.bus_id;
            const bookedCount = bus?.total_seats ? bus.total_seats - (instance?.available_seats || 0) : 0;
            const occupancyPercentage = bus?.total_seats ? (bookedCount / bus.total_seats) * 100 : 0;

            return (
              <div key={instance?._id} className={styles.tableRow}>
                <div className={styles.date}>
                  <FaCalendarAlt className={styles.dateIcon} />
                  <div>
                    <div className={styles.dateFull}>{formatDate(instance?.travel_date)}</div>
                    <div className={styles.dateRelative}>
                      {instance?.travel_date && new Date(instance.travel_date) > new Date() ? 'Upcoming' : 'Past'}
                    </div>
                  </div>
                </div>

                <div className={styles.route}>
                  <FaMapMarkerAlt className={styles.routeIcon} />
                  <div>
                    <div className={styles.routeCities}>
                      <span>{template?.from_location || 'N/A'}</span>
                      <span className={styles.routeArrow}>→</span>
                      <span>{template?.to_location || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.bus}>
                  <FaBus className={styles.busIcon} />
                  <div>
                    <div className={styles.busNumber}>{bus?.vehicle_no || 'N/A'}</div>
                  </div>
                </div>

                <div className={styles.time}>
                  <FaClock className={styles.timeIcon} />
                  <span>{formatTime(template?.departure_time)}</span>
                </div>

                <div className={styles.seats}>
                  <FaChair className={styles.seatsIcon} />
                  <div className={styles.seatInfo}>
                    <div className={styles.seatNumbers}>
                      <span className={styles.availableSeats}>{instance?.available_seats || 0}</span>
                      <span className={styles.totalSeats}>/{bus?.total_seats || 0}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${occupancyPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div>{getStatusBadge(instance?.status)}</div>

                <div className={styles.actions}>
                  {/* 👁️ View Bookings button */}
                  <button
                    onClick={() => handleViewBookings(instance)}
                    className={styles.viewBtn}
                    title="View passenger details and bookings"
                  >
                    <FaEye />
                  </button>
                  
                  {/* ✏️ Edit button - for all trips */}
                  <button
                    onClick={() => handleEditClick(instance)}
                    className={styles.editBtn}
                    title="Edit trip instance"
                  >
                    <FaEdit />
                  </button>
                  
                  {/* 🗑️ Delete button - for trips with no bookings */}
                  <button
                    onClick={() => handleDeleteClick(instance)}
                    className={styles.deleteBtn}
                    title="Delete trip instance (only if no bookings)"
                  >
                    <FaTrash />
                  </button>
                  
                  {/* ✖ Cancel button - only for active trips */}
                  {instance?.status === 'active' && (
                    <button
                      onClick={() => handleCancelInstance(instance._id)}
                      className={styles.cancelBtn}
                      title="Cancel this trip"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GENERATE INSTANCES MODAL */}
      {showGenerateModal && (
        <div className={styles.modal} onClick={() => setShowGenerateModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Generate Trip Instances</h3>
              <button className={styles.closeBtn} onClick={() => setShowGenerateModal(false)}>
                <FaTimes />
              </button>
            </div>

            {generateResult ? (
              <div className={styles.generateResult}>
                <FaCheck className={styles.successIcon} />
                <h4>Instances Generated Successfully!</h4>
                <p>Created: {generateResult.created} new trips</p>
                <p>Skipped: {generateResult.skipped} existing trips</p>
              </div>
            ) : (
              <form onSubmit={handleGenerateSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="trip_template_id">Select Trip Template *</label>
                  <select
                    id="trip_template_id"
                    name="trip_template_id"
                    value={generateForm.trip_template_id}
                    onChange={handleGenerateChange}
                    required
                  >
                    <option value="">Choose a template</option>
                    {templates.map(t => (
                      <option key={t?._id} value={t?._id}>
                        {t?.from_location || 'N/A'} → {t?.to_location || 'N/A'} ({t?.schedule_type || 'manual'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="start_date">Start Date *</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={generateForm.start_date}
                      onChange={handleGenerateChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="end_date">End Date *</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={generateForm.end_date}
                      onChange={handleGenerateChange}
                      min={generateForm.start_date}
                      required
                    />
                  </div>
                </div>

                <p className={styles.helpText}>
                  This will generate trip instances for each day between the selected dates,
                  following the template's schedule pattern.
                </p>

                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className={styles.cancelBtn}
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={generating}
                  >
                    {generating ? <><FaSpinner className={styles.spinner} /> Generating...</> : 'Generate Instances'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT INSTANCE MODAL */}
      {showEditModal && selectedInstance && (
        <div className={styles.modal} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Trip Instance</h3>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="travel_date">Travel Date *</label>
                <input
                  type="date"
                  id="travel_date"
                  name="travel_date"
                  value={editForm.travel_date}
                  onChange={handleEditChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="available_seats">Available Seats *</label>
                <input
                  type="number"
                  id="available_seats"
                  name="available_seats"
                  value={editForm.available_seats}
                  onChange={handleEditChange}
                  min="0"
                  max={selectedInstance.trip_template_id?.bus_id?.total_seats || 40}
                  required
                />
                <small>Total seats: {selectedInstance.trip_template_id?.bus_id?.total_seats || 40}</small>
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={updating}
                >
                  {updating ? <><FaSpinner className={styles.spinner} /> Updating...</> : <><FaSave /> Update Instance</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKINGS MODAL */}
      {showBookingModal && selectedInstance && (
        <div className={styles.modal} onClick={() => setShowBookingModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Bookings for {formatDate(selectedInstance.travel_date)}</h3>
              <button className={styles.closeBtn} onClick={() => setShowBookingModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.tripInfo}>
              <FaBus /> {selectedInstance.trip_template_id?.from_location || 'N/A'} → {selectedInstance.trip_template_id?.to_location || 'N/A'}
              <span className={styles.tripTime}>
                <FaClock /> {formatTime(selectedInstance.trip_template_id?.departure_time)}
              </span>
            </div>

            {loadingBookings ? (
              <div className={styles.loadingSmall}>
                <FaSpinner className={styles.loadingSpinnerSmall} />
                <p>Loading bookings from database...</p>
              </div>
            ) : instanceBookings.length === 0 ? (
              <div className={styles.noBookings}>
                <FaUser className={styles.noBookingsIcon} />
                <p>No bookings found for this trip</p>
              </div>
            ) : (
              <div className={styles.bookingsList}>
                {instanceBookings.map((booking) => (
                  <div key={booking._id} className={styles.bookingCard}>
                    <div className={styles.bookingHeader}>
                      <div className={styles.userInfo}>
                        <FaUser className={styles.userIcon} />
                        <div>
                          <strong>{booking.user_id?.name || 'N/A'}</strong>
                          <div className={styles.userContact}>
                            <FaPhone /> {booking.user_id?.phone || 'N/A'}
                          </div>
                          <div className={styles.userEmail}>{booking.user_id?.email || 'N/A'}</div>
                        </div>
                      </div>
                      <div className={styles.bookingTotal}>
                        <FaDollarSign className={styles.totalIcon} />
                        <span className={styles.totalAmount}>EGP {booking.total_fare}</span>
                      </div>
                    </div>

                    <div className={styles.seatsList}>
                      <h4>Passenger Details</h4>
                      {booking.seats?.map((seat, idx) => (
                        <div key={idx} className={styles.seatItem}>
                          <span className={styles.seatNumber}>Seat {seat.seat_number}</span>
                          <span className={styles.passengerName}>{seat.passenger_name}</span>
                          <span className={styles.passengerAge}>Age: {seat.age}</span>
                          <span className={styles.seatPrice}>EGP {seat.price_paid}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.bookingFooter}>
                      <span className={styles.bookingDate}>
                        Booked: {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className={`${styles.bookingStatus} ${styles.confirmed}`}>
                        {booking.booking_status || 'Confirmed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}