const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const BusBooking = require('../models/busbooking');

const createBusPaymentIntent = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'egp',
      metadata: {
        bookingId: bookingId,
        userId: req.user.id
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating bus payment intent:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const confirmBusBooking = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const booking = await BusBooking.findByIdAndUpdate(
        bookingId,
        { 
          payment_status: 'paid',
          booking_status: 'confirmed'
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Payment confirmed and booking updated',
        booking
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }
  } catch (error) {
    console.error('Error confirming bus booking:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const handleBusPaymentWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // ✅ FIX: req.body is now a Buffer (raw), convert to string
    const payload = req.body.toString();
    
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.log(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata?.bookingId;
      
      if (bookingId) {
        await BusBooking.findByIdAndUpdate(bookingId, {
          payment_status: 'paid',
          booking_status: 'confirmed'
        });
        console.log(`✅ PaymentIntent for booking ${bookingId} succeeded - booking confirmed`);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`❌ Payment failed: ${failedPayment.id}`);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  createBusPaymentIntent,
  confirmBusBooking,
  handleBusPaymentWebhook
};