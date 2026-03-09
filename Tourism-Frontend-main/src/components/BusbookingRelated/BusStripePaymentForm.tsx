'use client'

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import styles from './BusStripePaymentForm.module.css';

interface BusStripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function BusStripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError
}: BusStripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debug log
  console.log('💳 BusStripePaymentForm mounted with:', {
    clientSecret: clientSecret?.substring(0, 20) + '...',
    amount,
    hasStripe: !!stripe,
    hasElements: !!elements
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('❌ Stripe or Elements not loaded');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      console.error('❌ Payment error:', error);
      setErrorMessage(error.message || 'Payment failed');
      onError(error.message || 'Payment failed');
      setLoading(false);
    } else {
      console.log('✅ Payment succeeded');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.paymentElement}>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className={styles.error}>
          <FaTimes /> {errorMessage}
        </div>
      )}

      <div className={styles.total}>
        <span>Total Amount:</span>
        <span className={styles.amount}>EGP {amount}</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className={styles.payButton}
      >
        {loading ? (
          <>
            <FaSpinner className={styles.spinner} /> Processing...
          </>
        ) : (
          `Pay EGP ${amount}`
        )}
      </button>

      <p className={styles.testMode}>
        🔧 Test Mode - Use card: 4242 4242 4242 4242
      </p>
    </form>
  );
}