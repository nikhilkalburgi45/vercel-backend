import mongoose from 'mongoose';
import { MONGODB_URI } from './config';

console.log('Environment variables:', {
  MONGODB_URI: MONGODB_URI ? 'Connection string exists' : 'No connection string found',
  NODE_ENV: process.env.NODE_ENV
});

export async function connectDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string (first 20 chars):', MONGODB_URI?.substring(0, 20) + '...');
    console.log('Current connection state:', mongoose.connection.readyState);
    
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB');
      return;
    }

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    console.error('Error details:', {
      name: error?.name || 'Unknown',
      message: error?.message || 'No error message',
      code: error?.code || 'No error code'
    });
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('Already disconnected from MongoDB');
      return;
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
} 