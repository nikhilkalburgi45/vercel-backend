import mongoose from 'mongoose';
import { MONGODB_URI } from './config';

console.log('Environment variables:', {
  MONGODB_URI: MONGODB_URI ? 'Connection string exists' : 'No connection string found',
  NODE_ENV: process.env.NODE_ENV
});

let isConnected = false;

export async function connectDB() {
  try {
    if (isConnected) {
      console.log('Using existing database connection');
      return;
    }

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('Connected to MongoDB successfully');
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    console.error('Error details:', {
      name: error?.name || 'Unknown',
      message: error?.message || 'No error message',
      code: error?.code || 'No error code'
    });
    // Don't exit process in serverless environment
    throw error;
  }
}

export async function disconnectDB() {
  try {
    if (!isConnected) {
      console.log('No active connection to disconnect');
      return;
    }

    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
} 