// test-website-lead.js
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourism_db')
  .then(() => console.log('✅ MongoDB connected for testing'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import the model
const WebsiteLead = require('./src/models/websiteLead');

async function testCreateLead() {
  try {
    const testLead = new WebsiteLead({
      name: 'Test User',
      email: 'test@example.com',
      phone: '01234567890',
      discount_amount: 45,
      discount_code: 'FAY-TEST-1234',
      consent_given: true,
      terms_accepted: true,
      marketing_consent: false
    });

    const saved = await testLead.save();
    console.log('✅ Lead created successfully:', {
      id: saved._id,
      discount_amount: saved.discount_amount,
      discount_code: saved.discount_code,
      discount_expiry: saved.discount_expiry,
      created_at: saved.created_at
    });

    // Test validation method
    console.log('✅ Discount is valid:', saved.isDiscountValid());

    // Clean up
    await WebsiteLead.deleteOne({ _id: saved._id });
    console.log('✅ Test lead cleaned up');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Full error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testCreateLead();