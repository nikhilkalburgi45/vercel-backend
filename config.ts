import { config } from 'dotenv';

// Only load .env file in development
if (process.env.NODE_ENV !== 'production') {
  config();
}

export const MONGODB_URI = process.env.MONGODB_URI;

// Log environment status but don't exit
if (!MONGODB_URI) {
  console.warn('Warning: MONGODB_URI is not defined in environment variables');
} 