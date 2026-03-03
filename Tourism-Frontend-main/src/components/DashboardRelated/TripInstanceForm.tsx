'use client'

import { useState } from 'react';
import { FaCalendarAlt, FaBus, FaMapMarkerAlt } from 'react-icons/fa';
import { adminBusApi } from '@/src/api/admin-bus.api';
import styles from './TripInstanceForm.module.css';

interface TripInstanceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  template?: any;
}

export default function TripInstanceForm({ onSuccess, onCancel, template }: TripInstanceFormProps) {
  const [formData, setFormData] = useState({
    trip_template_id: template?._id || '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days later
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await adminBusApi.generateInstances({
        trip_template_id: formData.trip_template_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      
      setResult(response.stats);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate instances');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Generate Trip Instances</h2>

      {template && (
        <div className={styles.templateInfo}>
          <h3>
            <FaBus /> {template.bus_id?.vehicle_no}
          </h3>
          <p>
            <FaMapMarkerAlt /> {template.from_location} → {template.to_location}
          </p>
          <p>Schedule: {template.schedule_type}</p>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.success}>
          <h3>✅ Instances Generated!</h3>
          <p>Created: {result.created} new trips</p>
          <p>Skipped: {result.skipped} existing trips</p>
        </div>
      )}

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>
            <FaCalendarAlt /> Start Date
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaCalendarAlt /> End Date
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
            min={formData.start_date}
          />
        </div>
      </div>

      <p className={styles.hint}>
        This will generate trip instances for each day between the selected dates,
        following the schedule pattern (daily/weekly/monthly).
      </p>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Generating...' : 'Generate Instances'}
        </button>
      </div>
    </form>
  );
}