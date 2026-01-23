let mongoose;
let isConnected = false;

try {
  mongoose = require('mongoose');
} catch (error) {
  console.warn('⚠️ Mongoose not installed. MongoDB features will be disabled.');
  console.warn('   Install with: npm install mongoose');
  mongoose = null;
}

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trusted_insurance';

async function connectMongoDB() {
  if (!mongoose) {
    console.warn('⚠️ MongoDB connection skipped - mongoose not installed');
    return;
  }

  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    isConnected = false;
    // Don't throw - allow server to continue without MongoDB
  }
}

if (mongoose) {
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.log('⚠️ MongoDB disconnected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB error:', error);
    isConnected = false;
  });
}

module.exports = { connectMongoDB, mongoose };
