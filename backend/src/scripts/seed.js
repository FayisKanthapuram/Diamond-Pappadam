import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';
import { GramType } from '../models/GramType.js';
import { QualityType } from '../models/QualityType.js';

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

  const gramNames = ['3g', '4g', '5g', '6g'];
  for (let i = 0; i < gramNames.length; i++) {
    await GramType.findOneAndUpdate(
      { name: gramNames[i] },
      { name: gramNames[i], active: true, sortOrder: i },
      { upsert: true }
    );
  }
  console.log('Gram types:', gramNames.join(', '));

  const qualityNames = ['1st', '2nd', '3rd'];
  for (let i = 0; i < qualityNames.length; i++) {
    await QualityType.findOneAndUpdate(
      { name: qualityNames[i] },
      { name: qualityNames[i], active: true, sortOrder: i },
      { upsert: true }
    );
  }
  console.log('Quality types:', qualityNames.join(', '));

  let salesUser = await User.findOne({ phone: '8888888888' });
  if (salesUser) {
    salesUser.password = 'sales123';
    salesUser.role = 'sales';
    salesUser.active = true;
    await salesUser.save();
    console.log('Sales account updated (password: sales123)');
  } else {
    salesUser = await User.create({
      name: 'Sales Manager',
      phone: '8888888888',
      password: 'sales123',
      role: 'sales',
      active: true,
    });
    console.log('Sales account created');
  }

  console.log('\nSeed complete.');
  console.log(`Admin login phone: ${adminPhone}`);
  console.log('Use ADMIN_PASSWORD from .env for first login, then change password.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
