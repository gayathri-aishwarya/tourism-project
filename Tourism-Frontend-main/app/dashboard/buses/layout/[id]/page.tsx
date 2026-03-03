'use client'

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import AdminSeatLayout from '@/src/components/DashboardRelated/AdminSeatLayout';
import styles from './page.module.css';

export default function BusLayoutPage() {
  const params = useParams();
  const router = useRouter();
  const [busId, setBusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safely extract the id from params
    if (params && params.id) {
      setBusId(params.id as string);
    }
    setLoading(false);
  }, [params]);

  const handleSaveLayout = async (layout: any) => {
    try {
      // Save layout to backend
      console.log('Saving layout:', layout);
      // Add your API call here
      // await adminBusApi.updateBusLayout(busId, layout);
      
      // Show success message (you might want to add a toast notification)
      alert('Layout saved successfully!');
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Failed to save layout');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p>Loading layout designer...</p>
      </div>
    );
  }

  if (!busId) {
    return (
      <div className={styles.errorContainer}>
        <h2>Invalid Bus ID</h2>
        <p>The bus ID is missing or invalid.</p>
        <button 
          onClick={() => router.push('/dashboard/buses')}
          className={styles.backBtn}
        >
          <FaArrowLeft /> Back to Bus Management
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button 
        onClick={() => router.back()}
        className={styles.backBtn}
      >
        <FaArrowLeft /> Back to Bus Management
      </button>
      
      <AdminSeatLayout 
        busId={busId} 
        onSave={handleSaveLayout}
      />
    </div>
  );
}