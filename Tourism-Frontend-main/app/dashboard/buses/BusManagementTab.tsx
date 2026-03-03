'use client'

import { useState, useEffect } from 'react';
import { 
  FaPlus, FaBus, FaTimes, FaEdit, FaTrash,FaChair, FaSave, 
  FaTimesCircle, FaCouch, FaBan, FaUser, FaRestroom
} from 'react-icons/fa';
import { adminBusApi } from '@/src/api/admin-bus.api';
import styles from './BusManagementTab.module.css';

// Bus type interface
interface Bus {
  _id: string;
  vehicle_no: string;
  bus_type: 'seater' | 'sleeper' | 'semi-sleeper';
  total_seats: number;
  seat_layout: string[][] | string[];
  created_at: string;
  updated_at: string;
}

// Seat type counts interface
interface SeatCounts {
  regular: number;
  blocked: number;
  driver: number;
  wc: number;
}

// Form data interface
interface BusFormData {
  vehicle_no: string;
  bus_type: 'seater' | 'sleeper' | 'semi-sleeper';
  total_seats: number;
}

type ModalMode = 'add' | 'edit' | 'delete' | null;

export default function BusManagementTab() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [seatCounts, setSeatCounts] = useState<Map<string, SeatCounts>>(new Map());
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState<BusFormData>({
    vehicle_no: '',
    bus_type: 'seater',
    total_seats: 40
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load buses on component mount
  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const response = await adminBusApi.getBuses();
      console.log('Buses loaded:', response);
      const busesData = response.buses || [];
      setBuses(busesData);
      
      // Calculate seat counts for each bus
      calculateSeatCounts(busesData);
    } catch (error: any) {
      console.error('Error loading buses:', error);
      showError(error.response?.data?.message || 'Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  const calculateSeatCounts = (busesData: Bus[]) => {
    const countsMap = new Map<string, SeatCounts>();
    
    busesData.forEach(bus => {
      const counts: SeatCounts = {
        regular: 0,
        blocked: 0,
        driver: 0,
        wc: 0
      };
      
      if (bus.seat_layout && Array.isArray(bus.seat_layout)) {
        // Flatten the 2D array and count seat types
        const allSeats = bus.seat_layout.flat();
        
        allSeats.forEach(seat => {
          if (typeof seat === 'string') {
            if (seat.includes(':')) {
              const [_, type] = seat.split(':');
              if (type === 'blocked') counts.blocked++;
              else if (type === 'driver') counts.driver++;
              else if (type === 'wc') counts.wc++;
              else counts.regular++;
            } else if (seat) {
              // Regular seat (just seat number)
              counts.regular++;
            }
          }
        });
      } else {
        // If no seat layout, assume all are regular seats
        counts.regular = bus.total_seats || 0;
      }
      
      countsMap.set(bus._id, counts);
    });
    
    setSeatCounts(countsMap);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ========== CREATE ==========
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_seats' ? parseInt(value) || 0 : value
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.vehicle_no.trim()) {
        throw new Error('Vehicle number is required');
      }
      if (formData.total_seats < 1 || formData.total_seats > 60) {
        throw new Error('Total seats must be between 1 and 60');
      }

      console.log('Creating bus with data:', formData);
      await adminBusApi.createBus(formData);
      
      // Reset form and close modal
      resetForm();
      setModalMode(null);
      
      // Reload buses list
      await loadBuses();
      showSuccess('Bus added successfully!');
    } catch (err: any) {
      console.error('Error creating bus:', err);
      showError(err.response?.data?.message || err.message || 'Failed to create bus');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== UPDATE ==========
  const handleEditClick = (bus: Bus) => {
    console.log('Editing bus:', bus);
    setSelectedBus(bus);
    setFormData({
      vehicle_no: bus.vehicle_no,
      bus_type: bus.bus_type,
      total_seats: bus.total_seats
    });
    setModalMode('edit');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;
    
    setError('');
    setSubmitting(true);

    try {
      // Validate form - only validate vehicle_no
      if (!formData.vehicle_no.trim()) {
        throw new Error('Vehicle number is required');
      }

      console.log('Updating bus with vehicle_no:', selectedBus.vehicle_no);
      console.log('Update data:', {
        bus_type: formData.bus_type
      });
      
      // IMPORTANT: Only update bus_type, NOT total_seats
      await adminBusApi.updateBus(selectedBus.vehicle_no, {
        bus_type: formData.bus_type
      });
      
      // Reset and close modal
      resetForm();
      setModalMode(null);
      
      // Reload buses list
      await loadBuses();
      showSuccess('Bus updated successfully!');
    } catch (err: any) {
      console.error('Error updating bus:', err);
      showError(err.response?.data?.message || err.message || 'Failed to update bus');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== DELETE ==========
  const handleDeleteClick = (bus: Bus) => {
    console.log('Deleting bus:', bus);
    setSelectedBus(bus);
    setModalMode('delete');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBus) return;
    
    setSubmitting(true);
    setError('');

    try {
      console.log('Deleting bus with vehicle_no:', selectedBus.vehicle_no);
      
      await adminBusApi.deleteBus(selectedBus.vehicle_no);
      
      setModalMode(null);
      setSelectedBus(null);
      await loadBuses();
      showSuccess('Bus deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting bus:', err);
      showError(err.response?.data?.message || err.message || 'Failed to delete bus');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_no: '',
      bus_type: 'seater',
      total_seats: 40
    });
    setSelectedBus(null);
    setError('');
  };

  const closeModal = () => {
    setModalMode(null);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getBusTypeIcon = (type: string) => {
    switch (type) {
      case 'sleeper': return '🛏️';
      case 'semi-sleeper': return '💺';
      default: return '🪑';
    }
  };

  const getBusTypeColor = (type: string) => {
    switch (type) {
      case 'sleeper': return '#8b5cf6';
      case 'semi-sleeper': return '#f97316';
      default: return '#10b981';
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading buses...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Success/Error Messages */}
      {successMessage && (
        <div className={styles.successMessage}>
          <FaSave /> {successMessage}
        </div>
      )}
      {error && (
        <div className={styles.errorMessage}>
          <FaTimesCircle /> {error}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h2>Bus Fleet Management</h2>
          <p className={styles.subtitle}>Manage your bus inventory and configurations</p>
        </div>
        <button 
          className={styles.addBtn} 
          onClick={() => setModalMode('add')}
        >
          <FaPlus /> Add New Bus
        </button>
      </div>

      {buses.length === 0 ? (
        <div className={styles.empty}>
          <FaBus className={styles.emptyIcon} />
          <h3>No Buses Added Yet</h3>
          <p>Get started by adding your first bus to the fleet</p>
          <button 
            className={styles.emptyBtn}
            onClick={() => setModalMode('add')}
          >
            <FaPlus /> Add Your First Bus
          </button>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className={styles.statsSummary}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{buses.length}</span>
              <span className={styles.statLabel}>Total Buses</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {buses.filter(b => b.bus_type === 'sleeper').length}
              </span>
              <span className={styles.statLabel}>Sleeper</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {buses.filter(b => b.bus_type === 'semi-sleeper').length}
              </span>
              <span className={styles.statLabel}>Semi Sleeper</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {buses.filter(b => b.bus_type === 'seater').length}
              </span>
              <span className={styles.statLabel}>Seater</span>
            </div>
          </div>

          {/* Buses Grid */}
          <div className={styles.grid}>
            {buses.map((bus) => {
              const counts = seatCounts.get(bus._id) || {
                regular: bus.total_seats || 0,
                blocked: 0,
                driver: 0,
                wc: 0
              };
              
              return (
                <div key={bus._id} className={styles.card}>
                  <div className={styles.cardHeader} style={{ background: `linear-gradient(135deg, ${getBusTypeColor(bus.bus_type)} 0%, #4b5563 100%)` }}>
                    <div className={styles.busType}>
                      <span>{getBusTypeIcon(bus.bus_type)}</span>
                      <span>{bus.bus_type}</span>
                    </div>
                    <div className={styles.cardActions}>
                      {/* Layout Button */}
                      <button 
                        className={styles.layoutBtn}
                        onClick={() => window.location.href = `/dashboard/buses/layout/${bus._id}`}
                        title="Design seat layout"
                      >
                        <FaCouch />
                      </button>
                      {/* Edit Button */}
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleEditClick(bus)}
                        title="Edit bus"
                      >
                        <FaEdit />
                      </button>
                      {/* Delete Button */}
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteClick(bus)}
                        title="Delete bus"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <h3>{bus.vehicle_no}</h3>
                    
                    {/* Seat Type Breakdown */}
                    <div className={styles.seatBreakdown}>
                      <div className={styles.seatTypeItem}>
                        <FaChair className={styles.regularIcon} />
                        <span>Passenger: <strong>{counts.regular}</strong></span>
                      </div>
                      <div className={styles.seatTypeItem}>
                        <FaBan className={styles.blockedIcon} />
                        <span>Blocked: <strong>{counts.blocked}</strong></span>
                      </div>
                      <div className={styles.seatTypeItem}>
                        <FaUser className={styles.driverIcon} />
                        <span>Driver: <strong>{counts.driver}</strong></span>
                      </div>
                      <div className={styles.seatTypeItem}>
                        <FaRestroom className={styles.wcIcon} />
                        <span>WC: <strong>{counts.wc}</strong></span>
                      </div>
                    </div>
                    
                    <div className={styles.totalSeats}>
                      <span>Total Capacity:</span>
                      <span className={styles.totalSeatsValue}>{bus.total_seats}</span>
                    </div>
                    
                    <div className={styles.dateInfo}>
                      <small>Added: {formatDate(bus.created_at)}</small>
                    </div>
                    <div className={styles.idInfo}>
                      <small>ID: {bus._id?.slice(-6) || 'N/A'}</small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ADD/EDIT MODAL */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modalMode === 'add' ? 'Add New Bus' : 'Edit Bus'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={modalMode === 'add' ? handleAddSubmit : handleEditSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="vehicle_no">Vehicle Number *</label>
                <input
                  type="text"
                  id="vehicle_no"
                  name="vehicle_no"
                  value={formData.vehicle_no}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC-1234"
                  required
                  disabled={modalMode === 'edit'}
                />
                {modalMode === 'edit' && (
                  <small className={styles.helpText}>Vehicle number cannot be changed</small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bus_type">Bus Type *</label>
                <select
                  id="bus_type"
                  name="bus_type"
                  value={formData.bus_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="seater">Seater</option>
                  <option value="semi-sleeper">Semi Sleeper</option>
                  <option value="sleeper">Sleeper</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="total_seats">Total Seats *</label>
                <input
                  type="number"
                  id="total_seats"
                  name="total_seats"
                  value={formData.total_seats}
                  onChange={handleInputChange}
                  min="1"
                  max="60"
                  required
                  disabled={modalMode === 'edit'}
                  className={modalMode === 'edit' ? styles.readOnlyField : ''}
                />
                {modalMode === 'edit' && (
                  <small className={styles.helpText}>
                    Seats can only be changed in the seat layout designer
                  </small>
                )}
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (modalMode === 'add' ? 'Add Bus' : 'Update Bus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modalMode === 'delete' && selectedBus && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Delete Bus</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.deleteContent}>
              <FaTrash className={styles.deleteIcon} />
              <p>Are you sure you want to delete bus <strong>{selectedBus.vehicle_no}</strong>?</p>
              <p className={styles.deleteWarning}>This action cannot be undone.</p>
              {selectedBus.total_seats > 0 && (
                <p className={styles.deleteInfo}>
                  This bus has {selectedBus.total_seats} seats configured.
                </p>
              )}
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelBtn}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Bus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}