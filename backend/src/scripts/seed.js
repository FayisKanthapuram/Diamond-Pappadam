import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';

dotenv.config();

async function seed() {
  const uri = process.env.MONGODB_URI;
  const adminPhone = process.env.ADMIN_PHONE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!uri || !adminPhone || !adminPassword) {
    console.error('Set MONGODB_URI, ADMIN_PHONE, and ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  let admin = await User.findOne({ role: 'admin' });

  if (admin) {
    if (admin.phone !== adminPhone) {
      console.log('Updating admin phone to match ADMIN_PHONE env');
      admin.phone = adminPhone;
    }
    admin.password = adminPassword;
    admin.mustChangePassword = true;
    admin.active = true;
    await admin.save();
    console.log('Admin account updated (password reset from env, mustChangePassword=true)');
  } else {
    admin = await User.create({
      name: 'Owner',
      phone: adminPhone,
      password: adminPassword,
      role: 'admin',
      active: true,
      mustChangePassword: true,
    });
    console.log('Admin account created');
  }

  await Settings.findOneAndUpdate(
    { key: 'rates' },
    { dryMachineRate: 12, nonMachineRate: 10 },
    { upsert: true, new: true }
  );
  console.log('Settings: Dry Machine ₹12/kg, Non-Machine ₹10/kg');

  console.log('\nSeed complete.');
  console.log(`Admin login phone: ${adminPhone}`);
  console.log('Use ADMIN_PASSWORD from .env for first login, then change password.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
