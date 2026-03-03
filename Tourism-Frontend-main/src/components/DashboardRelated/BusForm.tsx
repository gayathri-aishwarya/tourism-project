'use client'

import { useState } from 'react';
import { FaBus, FaCouch, FaBed, FaChair } from 'react-icons/fa';
import { adminBusApi } from '@/src/api/admin-bus.api';
import styles from './BusForm.module.css';

interface BusFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export default function BusForm({ onSuccess, onCancel, initialData }: BusFormProps) {
  const [formData, setFormData] = useState({
    vehicle_no: initialData?.vehicle_no || '',
    bus_type: initialData?.bus_type || 'seater',
    total_seats: initialData?.total_seats || 40,
  });
  const [seatLayout, setSeatLayout] = useState(initialData?.seat_layout || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSeatLayout = async () => {
    try {
      const response = await adminBusApi.generateSeatLayout(
        formData.bus_type,
        Number(formData.total_seats)
      );
      setSeatLayout(response.layout);
    } catch (error) {
      console.error('Error generating layout:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        total_seats: Number(formData.total_seats),
        seat_layout: seatLayout
      };

      if (initialData?._id) {
        await adminBusApi.updateBus(initialData._id, dataToSend);
      } else {
        await adminBusApi.createBus(dataToSend);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save bus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{initialData ? 'Edit Bus' : 'Add New Bus'}</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>
            <FaBus /> Vehicle Number
          </label>
          <input
            type="text"
            name="vehicle_no"
            value={formData.vehicle_no}
            onChange={handleChange}
            required
            placeholder="e.g., ABC-1234"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Bus Type</label>
          <select name="bus_type" value={formData.bus_type} onChange={handleChange} required>
            <option value="seater">Seater</option>
            <option value="semi-sleeper">Semi Sleeper</option>
            <option value="sleeper">Sleeper</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Total Seats</label>
          <input
            type="number"
            name="total_seats"
            value={formData.total_seats}
            onChange={handleChange}
            required
            min="1"
            max="60"
          />
        </div>
      </div>

      <div className={styles.layoutSection}>
        <div className={styles.layoutHeader}>
          <h3>Seat Layout</h3>
          <button 
            type="button" 
            onClick={generateSeatLayout}
            className={styles.generateBtn}
          >
            Generate Layout
          </button>
        </div>

        {seatLayout.length > 0 && (
          <div className={styles.layoutPreview}>
            {seatLayout.map((row: string[], rowIndex: number) => (
              <div key={rowIndex} className={styles.row}>
                {row.map((seat: string, colIndex: number) => (
                  <div key={colIndex} className={styles.seat}>
                    {formData.bus_type === 'sleeper' ? <FaBed /> : <FaCouch />}
                    <span>{seat}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <p className={styles.hint}>
          Click "Generate Layout" to automatically create a standard seat arrangement
        </p>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Saving...' : initialData ? 'Update Bus' : 'Add Bus'}
        </button>
      </div>
    </form>
  );
}