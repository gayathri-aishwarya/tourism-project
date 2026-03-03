'use client'

import { useState } from 'react';
import { FaClock, FaCalendarAlt, FaCalendarWeek, FaCalendarDay } from 'react-icons/fa';
import styles from './ScheduleAlarmPicker.module.css';

interface ScheduleAlarmPickerProps {
  onChange: (scheduleType: string, scheduleMeta: any) => void;
  initialType?: string;
  initialMeta?: any;
}

export default function ScheduleAlarmPicker({ 
  onChange, 
  initialType = 'never',
  initialMeta = null 
}: ScheduleAlarmPickerProps) {
  const [scheduleType, setScheduleType] = useState(initialType);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialMeta?.days || [1, 2, 3, 4, 5] // Mon-Fri default
  );
  const [selectedDates, setSelectedDates] = useState<number[]>(
    initialMeta?.dates || [1, 15] // 1st and 15th default
  );
  const [customDates, setCustomDates] = useState<string>('');

  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const handleTypeChange = (type: string) => {
    setScheduleType(type);
    
    let meta = null;
    if (type === 'weekly') {
      meta = { days: selectedDays };
    } else if (type === 'monthly') {
      meta = { dates: selectedDates };
    }
    
    onChange(type, meta);
  };

  const toggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    
    setSelectedDays(newDays);
    onChange(scheduleType, { days: newDays });
  };

  const toggleDate = (date: number) => {
    const newDates = selectedDates.includes(date)
      ? selectedDates.filter(d => d !== date)
      : [...selectedDates, date].sort((a, b) => a - b);
    
    setSelectedDates(newDates);
    onChange(scheduleType, { dates: newDates });
  };

  const handleCustomDates = (input: string) => {
    setCustomDates(input);
    // Parse comma-separated dates
    const dates = input.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 1 && d <= 31);
    if (dates.length > 0) {
      setSelectedDates(dates);
      onChange(scheduleType, { dates });
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        <FaClock className={styles.icon} />
        Schedule Type (Like Setting an Alarm)
      </label>
      
      <div className={styles.typeGrid}>
        <button
          type="button"
          className={`${styles.typeButton} ${scheduleType === 'never' ? styles.active : ''}`}
          onClick={() => handleTypeChange('never')}
        >
          <FaCalendarDay />
          <span>Never</span>
          <small>No auto-generation</small>
        </button>
        
        <button
          type="button"
          className={`${styles.typeButton} ${scheduleType === 'daily' ? styles.active : ''}`}
          onClick={() => handleTypeChange('daily')}
        >
          <FaCalendarAlt />
          <span>Daily</span>
          <small>Every day</small>
        </button>
        
        <button
          type="button"
          className={`${styles.typeButton} ${scheduleType === 'weekly' ? styles.active : ''}`}
          onClick={() => handleTypeChange('weekly')}
        >
          <FaCalendarWeek />
          <span>Weekly</span>
          <small>Select days</small>
        </button>
        
        <button
          type="button"
          className={`${styles.typeButton} ${scheduleType === 'monthly' ? styles.active : ''}`}
          onClick={() => handleTypeChange('monthly')}
        >
          <FaCalendarAlt />
          <span>Monthly</span>
          <small>Select dates</small>
        </button>
      </div>

      {scheduleType === 'weekly' && (
        <div className={styles.weeklySection}>
          <label>Repeat on:</label>
          <div className={styles.daysGrid}>
            {daysOfWeek.map(day => (
              <button
                key={day.value}
                type="button"
                className={`${styles.dayButton} ${selectedDays.includes(day.value) ? styles.selected : ''}`}
                onClick={() => toggleDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>Like setting an alarm for specific weekdays</p>
        </div>
      )}

      {scheduleType === 'monthly' && (
        <div className={styles.monthlySection}>
          <label>Repeat on dates:</label>
          <div className={styles.datesGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map(date => (
              <button
                key={date}
                type="button"
                className={`${styles.dateButton} ${selectedDates.includes(date) ? styles.selected : ''}`}
                onClick={() => toggleDate(date)}
              >
                {date}
              </button>
            ))}
          </div>
          <div className={styles.customDates}>
            <label>Or enter custom dates (comma-separated):</label>
            <input
              type="text"
              value={customDates}
              onChange={(e) => handleCustomDates(e.target.value)}
              placeholder="e.g., 1, 15, 30"
            />
          </div>
          <p className={styles.hint}>Like setting an alarm for specific dates each month</p>
        </div>
      )}
    </div>
  );
}