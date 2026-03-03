'use client'

import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaBus } from 'react-icons/fa';
import ScheduleAlarmPicker from './ScheduleAlarmPicker';
import { adminBusApi } from '@/src/api/admin-bus.api';
import { adminBusApi as adminTripApi } from '@/src/api/admin-bus.api';
import styles from './TripTemplateForm.module.css';

interface TripTemplateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export default function TripTemplateForm({ onSuccess, onCancel, initialData }: TripTemplateFormProps) {
  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState({
    bus_id: initialData?.bus_id?._id || initialData?.bus_id || '',
    from_location: initialData?.from_location || '',
    to_location: initialData?.to_location || '',
    departure_time: initialData?.departure_time || '',
    arrival_time: initialData?.arrival_time || '',
    duration: initialData?.duration || '',
    ticket_price: initialData?.ticket_price || '',
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
  });
  const [scheduleType, setScheduleType] = useState(initialData?.schedule_type || 'never');
  const [scheduleMeta, setScheduleMeta] = useState(initialData?.schedule_meta || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    try {
      const response = await adminBusApi.getBuses();
      setBuses(response.buses || []);
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  };

  // Auto-calculate duration when times change
  useEffect(() => {
    if (formData.departure_time && formData.arrival_time) {
      const dep = new Date(`1970-01-01T${formData.departure_time}`);
      const arr = new Date(`1970-01-01T${formData.arrival_time}`);
      const diff = (arr.getTime() - dep.getTime()) / (1000 * 60); // minutes
      if (diff > 0) {
        setFormData(prev => ({ ...prev, duration: diff.toString() }));
      }
    }
  }, [formData.departure_time, formData.arrival_time]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleScheduleChange = (type: string, meta: any) => {
    setScheduleType(type);
    setScheduleMeta(meta);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        ticket_price: Number(formData.ticket_price),
        duration: formData.duration ? Number(formData.duration) : undefined,
        schedule_type: scheduleType,
        schedule_meta: scheduleMeta ? JSON.stringify(scheduleMeta) : null,
      };

      if (initialData?._id) {
        await adminTripApi.updateTripTemplate(initialData._id, dataToSend);
      } else {
        await adminTripApi.createTripTemplate(dataToSend);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save trip template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{initialData ? 'Edit Trip Template' : 'Create Trip Template'}</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>
            <FaBus /> Select Bus
          </label>
          <select name="bus_id" value={formData.bus_id} onChange={handleChange} required>
            <option value="">Choose a bus</option>
            {buses.map((bus: any) => (
              <option key={bus._id} value={bus._id}>
                {bus.vehicle_no} ({bus.bus_type}) - {bus.total_seats} seats
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaMapMarkerAlt /> From Location
          </label>
          <input
            type="text"
            name="from_location"
            value={formData.from_location}
            onChange={handleChange}
            required
            placeholder="e.g., Cairo"
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaMapMarkerAlt /> To Location
          </label>
          <input
            type="text"
            name="to_location"
            value={formData.to_location}
            onChange={handleChange}
            required
            placeholder="e.g., Alexandria"
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaClock /> Departure Time
          </label>
          <input
            type="time"
            name="departure_time"
            value={formData.departure_time}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaClock /> Arrival Time
          </label>
          <input
            type="time"
            name="arrival_time"
            value={formData.arrival_time}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaClock /> Duration (minutes)
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Auto-calculated"
            readOnly
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaDollarSign /> Ticket Price (EGP)
          </label>
          <input
            type="number"
            name="ticket_price"
            value={formData.ticket_price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Active (Template is enabled)
          </label>
        </div>
      </div>

      <ScheduleAlarmPicker
        onChange={handleScheduleChange}
        initialType={initialData?.schedule_type}
        initialMeta={initialData?.schedule_meta ? JSON.parse(initialData.schedule_meta) : null}
      />

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Saving...' : initialData ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
}