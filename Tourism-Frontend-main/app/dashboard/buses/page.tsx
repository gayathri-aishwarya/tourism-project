'use client'

import { useState } from 'react';
import { FaBus, FaCalendarAlt, FaClock, FaPlus, FaEdit, FaTrash, FaPowerOff } from 'react-icons/fa';
import BusManagementTab from '@/app/dashboard/buses/BusManagementTab';
import TripTemplateTab from '@/app/dashboard/buses/TripTemplateTab';
import TripInstanceTab from '@/app/dashboard/buses/TripInstanceTab';
import styles from '@/app/dashboard/buses/page.module.css';

export default function BusesAdminPage() {
  const [activeTab, setActiveTab] = useState<'buses' | 'templates' | 'instances'>('buses');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Bus Management System</h1>
        <p>Manage buses, trip templates, and scheduled trips</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'buses' ? styles.active : ''}`}
          onClick={() => setActiveTab('buses')}
        >
          <FaBus /> Buses
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'templates' ? styles.active : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FaClock /> Trip Templates
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'instances' ? styles.active : ''}`}
          onClick={() => setActiveTab('instances')}
        >
          <FaCalendarAlt /> Trip Instances
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'buses' && <BusManagementTab />}
        {activeTab === 'templates' && <TripTemplateTab />}
        {activeTab === 'instances' && <TripInstanceTab />}
      </div>
    </div>
  );
}