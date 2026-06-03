import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load backend/.env explicitly (override shell PORT if set)
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  adminPhone: required('ADMIN_PHONE'),
  adminPassword: required('ADMIN_PASSWORD'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
