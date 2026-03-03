'use client'

import { useState, useEffect } from 'react';
import { 
  FaPlus, FaTimes, FaEdit, FaTrash, FaSave, FaTimesCircle,
  FaBus, FaMapMarkerAlt, FaClock, FaDollarSign, FaCalendarAlt,
  FaPowerOff, FaEye, FaCalendarCheck
} from 'react-icons/fa';
import { adminBusApi } from '@/src/api/admin-bus.api';
import styles from './TripTemplateTab.module.css';

// Types
interface Bus {
  _id: string;
  vehicle_no: string;
  bus_type: string;
  total_seats: number;
}

interface TripTemplate {
  _id: string;
  bus_id: Bus | string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  ticket_price: number;
  schedule_type: 'never' | 'daily' | 'weekly' | 'monthly';
  schedule_meta: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TripTemplateFormData {
  bus_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration?: number;
  ticket_price: number;
  schedule_type: 'never' | 'daily' | 'weekly' | 'monthly';
  schedule_meta: any;
  is_active: boolean;
}

type ModalMode = 'add' | 'edit' | 'delete' | 'view' | null;

export default function TripTemplateTab() {
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [formData, setFormData] = useState<TripTemplateFormData>({
    bus_id: '',
    from_location: '',
    to_location: '',
    departure_time: '',
    arrival_time: '',
    ticket_price: 0,
    schedule_type: 'never',
    schedule_meta: null,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesRes, busesRes] = await Promise.all([
        adminBusApi.getTripTemplates(),
        adminBusApi.getBuses()
      ]);
      setTemplates(templatesRes.templates || []);
      setBuses(busesRes.buses || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ========== FORM HANDLING ==========
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'ticket_price' || name === 'duration' ? parseFloat(value) || 0 : value
      }));
    }
  };

  // Auto-calculate duration when times change
  useEffect(() => {
    if (formData.departure_time && formData.arrival_time) {
      const dep = new Date(`1970-01-01T${formData.departure_time}`);
      const arr = new Date(`1970-01-01T${formData.arrival_time}`);
      let diff = (arr.getTime() - dep.getTime()) / (1000 * 60); // minutes
      
      // Handle overnight trips
      if (diff < 0) diff += 24 * 60;
      
      if (diff > 0) {
        setFormData(prev => ({ ...prev, duration: Math.round(diff) }));
      }
    }
  }, [formData.departure_time, formData.arrival_time]);

  // ========== CREATE ==========
const handleAddSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSubmitting(true);

  try {
    // Validate form
    if (!formData.bus_id) throw new Error('Please select a bus');
    if (!formData.from_location.trim()) throw new Error('From location is required');
    if (!formData.to_location.trim()) throw new Error('To location is required');
    if (!formData.departure_time) throw new Error('Departure time is required');
    if (!formData.arrival_time) throw new Error('Arrival time is required');
    if (formData.ticket_price <= 0) throw new Error('Ticket price must be greater than 0');

    // Get the selected bus to get vehicle_no
    const selectedBus = buses.find(b => b._id === formData.bus_id);
    if (!selectedBus) throw new Error('Selected bus not found');

    // Prepare data for backend - using vehicle_no as required by backend
    const dataToSend = {
      vehicle_no: selectedBus.vehicle_no,  // ✅ FIXED: Use vehicle_no, not bus_id
      from_location: formData.from_location,
      to_location: formData.to_location,
      departure_time: formData.departure_time,
      arrival_time: formData.arrival_time,
      ticket_price: Number(formData.ticket_price),
      duration: formData.duration ? Number(formData.duration) : undefined,
      schedule_type: formData.schedule_type,
      schedule_meta: formData.schedule_meta ? JSON.stringify(formData.schedule_meta) : null,
      is_active: formData.is_active
    };

    console.log('📦 Sending to backend:', dataToSend);

    const response = await adminBusApi.createTripTemplate(dataToSend);
    console.log('✅ Response:', response);
    
    resetForm();
    setModalMode(null);
    await loadData();
    showSuccess('Trip template created successfully!');
  } catch (err: any) {
    console.error('❌ Error:', err);
    showError(err.response?.data?.message || err.message || 'Failed to create template');
  } finally {
    setSubmitting(false);
  }
};

  // ========== UPDATE ==========
  const handleEditClick = (template: TripTemplate) => {
    setSelectedTemplate(template);
    
    // Parse schedule_meta if it exists
    let scheduleMeta = null;
    if (template.schedule_meta) {
      try {
        scheduleMeta = JSON.parse(template.schedule_meta);
      } catch {
        scheduleMeta = template.schedule_meta;
      }
    }

    setFormData({
      bus_id: typeof template.bus_id === 'object' ? template.bus_id._id : template.bus_id,
      from_location: template.from_location,
      to_location: template.to_location,
      departure_time: template.departure_time,
      arrival_time: template.arrival_time,
      duration: template.duration,
      ticket_price: template.ticket_price,
      schedule_type: template.schedule_type,
      schedule_meta: scheduleMeta,
      is_active: template.is_active
    });
    setModalMode('edit');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    
    setError('');
    setSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        ticket_price: Number(formData.ticket_price),
        duration: formData.duration ? Number(formData.duration) : undefined,
        schedule_meta: formData.schedule_meta ? JSON.stringify(formData.schedule_meta) : null
      };

      await adminBusApi.updateTripTemplate(selectedTemplate._id, dataToSend);
      
      resetForm();
      setModalMode(null);
      await loadData();
      showSuccess('Trip template updated successfully!');
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || 'Failed to update template');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== DELETE ==========
  const handleDeleteClick = (template: TripTemplate) => {
    setSelectedTemplate(template);
    setModalMode('delete');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;
    
    setSubmitting(true);
    setError('');

    try {
      await adminBusApi.deleteTripTemplate(selectedTemplate._id);
      
      setModalMode(null);
      setSelectedTemplate(null);
      await loadData();
      showSuccess('Trip template deleted successfully!');
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || 'Failed to delete template');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== TOGGLE ACTIVE ==========
  const handleToggleActive = async (template: TripTemplate) => {
    try {
      await adminBusApi.updateTripTemplate(template._id, {
        is_active: !template.is_active
      });
      await loadData();
      showSuccess(`Template ${!template.is_active ? 'activated' : 'deactivated'} successfully!`);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update template status');
    }
  };

  // ========== VIEW DETAILS ==========
  const handleViewClick = (template: TripTemplate) => {
    setSelectedTemplate(template);
    setModalMode('view');
  };

  const resetForm = () => {
    setFormData({
      bus_id: '',
      from_location: '',
      to_location: '',
      departure_time: '',
      arrival_time: '',
      ticket_price: 0,
      schedule_type: 'never',
      schedule_meta: null,
      is_active: true
    });
    setSelectedTemplate(null);
    setError('');
  };

  const closeModal = () => {
    setModalMode(null);
    resetForm();
  };

  // ========== UTILITY FUNCTIONS ==========
  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const formatSchedule = (template: TripTemplate) => {
    if (!template.schedule_type) return 'Manual Only';
    
    switch (template.schedule_type) {
      case 'daily':
        return 'Every Day';
      case 'weekly':
        try {
          const meta = template.schedule_meta ? JSON.parse(template.schedule_meta) : { days: [] };
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return meta.days?.map((d: number) => dayNames[d]).join(', ') || 'Weekly';
        } catch {
          return 'Weekly';
        }
      case 'monthly':
        try {
          const meta = template.schedule_meta ? JSON.parse(template.schedule_meta) : { dates: [] };
          return `Monthly on ${meta.dates?.map((d: number) => `${d}${getOrdinal(d)}`).join(', ') || 'selected dates'}`;
        } catch {
          return 'Monthly';
        }
      default:
        return 'Manual Only';
    }
  };

  const getBusInfo = (template: TripTemplate): Bus | null => {
    if (typeof template.bus_id === 'object') {
      return template.bus_id;
    }
    return buses.find(b => b._id === template.bus_id) || null;
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    if (filter === 'active') return t.is_active === true;
    if (filter === 'inactive') return t.is_active === false;
    return true;
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading trip templates...</p>
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
          <h2>Trip Templates</h2>
          <p className={styles.subtitle}>Create and manage recurring trip schedules</p>
        </div>
        <button 
          className={styles.addBtn} 
          onClick={() => setModalMode('add')}
        >
          <FaPlus /> Create Template
        </button>
      </div>

      {/* Filter Tabs */}
      {templates.length > 0 && (
        <div className={styles.filterBar}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({templates.length})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({templates.filter(t => t.is_active).length})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'inactive' ? styles.active : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive ({templates.filter(t => !t.is_active).length})
          </button>
        </div>
      )}

      {filteredTemplates.length === 0 ? (
        <div className={styles.empty}>
          <FaCalendarAlt className={styles.emptyIcon} />
          <h3>No Trip Templates Found</h3>
          <p>
            {templates.length > 0 
              ? `No ${filter} templates available` 
              : 'Create your first trip template to start scheduling buses'}
          </p>
          <button 
            className={styles.emptyBtn}
            onClick={() => setModalMode('add')}
          >
            <FaPlus /> Create Template
          </button>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div>Route</div>
            <div>Bus</div>
            <div>Schedule</div>
            <div>Time</div>
            <div>Price</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filteredTemplates.map((template) => {
            const bus = getBusInfo(template);
            
            return (
              <div key={template._id} className={styles.tableRow}>
                <div className={styles.route}>
                  <FaMapMarkerAlt className={styles.routeIcon} />
                  <div>
                    <strong>{template.from_location || 'N/A'}</strong>
                    <span className={styles.routeArrow}>→</span>
                    <strong>{template.to_location || 'N/A'}</strong>
                  </div>
                </div>
                
                <div className={styles.bus}>
                  <FaBus className={styles.busIcon} />
                  <div>
                    <div className={styles.busNumber}>{bus?.vehicle_no || 'N/A'}</div>
                    <div className={styles.busType}>{bus?.bus_type || 'Unknown'}</div>
                  </div>
                </div>
                
                <div className={styles.schedule}>
                  <FaCalendarAlt className={styles.scheduleIcon} />
                  <span>{formatSchedule(template)}</span>
                </div>
                
                <div className={styles.time}>
                  <FaClock className={styles.timeIcon} />
                  <div>
                    <div>{formatTime(template.departure_time)}</div>
                    <div className={styles.duration}>
                      {formatDuration(template.duration)}
                    </div>
                  </div>
                </div>
                
                <div className={styles.price}>
                  <FaDollarSign className={styles.priceIcon} />
                  <span className={styles.priceAmount}>EGP {template.ticket_price}</span>
                </div>
                
                <div>
                  <span className={`${styles.status} ${template.is_active ? styles.active : styles.inactive}`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className={styles.actions}>
                  <button
                    onClick={() => handleViewClick(template)}
                    className={styles.viewBtn}
                    title="View details"
                  >
                    <FaEye />
                  </button>
                  
                  <button
                    onClick={() => {
                      window.location.href = `/dashboard/buses?tab=instances&template=${template._id}`;
                    }}
                    className={styles.generateBtn}
                    title="View instances"
                  >
                    <FaCalendarCheck />
                  </button>
                  
                  <button
                    onClick={() => handleEditClick(template)}
                    className={styles.editBtn}
                    title="Edit template"
                  >
                    <FaEdit />
                  </button>
                  
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`${styles.toggleBtn} ${template.is_active ? styles.deactivate : styles.activate}`}
                    title={template.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <FaPowerOff />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteClick(template)}
                    className={styles.deleteBtn}
                    title="Delete template"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modalMode === 'add' ? 'Create Trip Template' : 'Edit Trip Template'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={modalMode === 'add' ? handleAddSubmit : handleEditSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="bus_id">Select Bus *</label>
                  <select
                    id="bus_id"
                    name="bus_id"
                    value={formData.bus_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose a bus</option>
                    {buses.map(bus => (
                      <option key={bus._id} value={bus._id}>
                        {bus.vehicle_no} ({bus.bus_type}) - {bus.total_seats} seats
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="from_location">From Location *</label>
                  <input
                    type="text"
                    id="from_location"
                    name="from_location"
                    value={formData.from_location}
                    onChange={handleInputChange}
                    placeholder="e.g., Cairo"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="to_location">To Location *</label>
                  <input
                    type="text"
                    id="to_location"
                    name="to_location"
                    value={formData.to_location}
                    onChange={handleInputChange}
                    placeholder="e.g., Alexandria"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="departure_time">Departure Time *</label>
                  <input
                    type="time"
                    id="departure_time"
                    name="departure_time"
                    value={formData.departure_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="arrival_time">Arrival Time *</label>
                  <input
                    type="time"
                    id="arrival_time"
                    name="arrival_time"
                    value={formData.arrival_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="duration">Duration (minutes)</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration || ''}
                    onChange={handleInputChange}
                    placeholder="Auto-calculated"
                    readOnly
                    className={styles.readOnly}
                  />
                  <small>Auto-calculated from times</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ticket_price">Ticket Price (EGP) *</label>
                  <input
                    type="number"
                    id="ticket_price"
                    name="ticket_price"
                    value={formData.ticket_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="schedule_type">Schedule Type</label>
                  <select
                    id="schedule_type"
                    name="schedule_type"
                    value={formData.schedule_type}
                    onChange={handleInputChange}
                  >
                    <option value="never">Never (Manual Only)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Active (Template is enabled)
                  </label>
                </div>
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
                  {submitting ? 'Saving...' : (modalMode === 'add' ? 'Create Template' : 'Update Template')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {modalMode === 'view' && selectedTemplate && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Trip Template Details</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.viewContent}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <label>From Location</label>
                  <strong>{selectedTemplate.from_location || 'N/A'}</strong>
                </div>
                
                <div className={styles.detailItem}>
                  <label>To Location</label>
                  <strong>{selectedTemplate.to_location || 'N/A'}</strong>
                </div>
                
                <div className={styles.detailItem}>
                  <label>Departure Time</label>
                  <strong>{formatTime(selectedTemplate.departure_time)}</strong>
                </div>
                
                <div className={styles.detailItem}>
                  <label>Arrival Time</label>
                  <strong>{formatTime(selectedTemplate.arrival_time)}</strong>
                </div>
                
                <div className={styles.detailItem}>
                  <label>Duration</label>
                  <strong>{formatDuration(selectedTemplate.duration)}</strong>
                </div>
                
                <div className={styles.detailItem}>
                  <label>Ticket Price</label>
                  <strong className={styles.detailPrice}>EGP {selectedTemplate.ticket_price}</strong>
                </div>
                
                <div className={styles.detailItem}>
                  <label>Schedule Type</label>
                  <strong>{selectedTemplate.schedule_type || 'N/A'}</strong>
                </div>
                
                <div className={styles.detailItem}>
                  <label>Schedule Details</label>
                  <strong>{formatSchedule(selectedTemplate)}</strong>
                </div>
                
                <div className={styles.detailItem}>
                  <label>Status</label>
                  <span className={`${styles.status} ${selectedTemplate.is_active ? styles.active : styles.inactive}`}>
                    {selectedTemplate.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className={styles.detailItem}>
                  <label>Created</label>
                  <strong>{formatDate(selectedTemplate.created_at)}</strong>
                </div>
              </div>
              
              {getBusInfo(selectedTemplate) && (
                <div className={styles.busDetails}>
                  <h4>Bus Information</h4>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label>Vehicle No</label>
                      <strong>{getBusInfo(selectedTemplate)?.vehicle_no || 'N/A'}</strong>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Bus Type</label>
                      <strong>{getBusInfo(selectedTemplate)?.bus_type || 'N/A'}</strong>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Total Seats</label>
                      <strong>{getBusInfo(selectedTemplate)?.total_seats || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelBtn}
                onClick={closeModal}
              >
                Close
              </button>
              <button 
                type="button" 
                className={styles.editBtn}
                onClick={() => {
                  setModalMode('edit');
                  handleEditClick(selectedTemplate);
                }}
              >
                <FaEdit /> Edit Template
              </button>
            </div>
          </div>
        </div>
      )}


      

      {/* DELETE CONFIRMATION MODAL */}
      {modalMode === 'delete' && selectedTemplate && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Delete Trip Template</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.deleteContent}>
              <FaTrash className={styles.deleteIcon} />
              <p>Are you sure you want to delete this trip template?</p>
              <p className={styles.deleteRoute}>
                <strong>{selectedTemplate.from_location || 'N/A'} → {selectedTemplate.to_location || 'N/A'}</strong>
              </p>
              <p className={styles.deleteWarning}>This will affect all scheduled trips from this template.</p>
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
                {submitting ? 'Deleting...' : 'Yes, Delete Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}