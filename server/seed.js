require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Organization, License } = require('./models');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dk_productivity');
  console.log('Connected to MongoDB');

  // Check if super_admin exists
  const existing = await User.findOne({ role: 'super_admin' });
  if (existing) {
    console.log('⚠️  Super admin already exists:', existing.email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // Create super admin (no org)
  const superAdmin = await User.create({
    email: 'superadmin@dk.local',
    passwordHash,
    displayName: 'Super Admin',
    role: 'super_admin',
    isActive: true,
  });

  console.log('✅ Super Admin created:');
  console.log('   Email:    superadmin@dk.local');
  console.log('   Password: Admin@123');
  console.log('   ID:      ', superAdmin._id);

  // Create demo org
  const org = await Organization.create({ name: 'Demo Company', domain: 'demo.local' });
  await License.create({ orgId: org._id, totalLicenses: 10 });

  const adminHash = await bcrypt.hash('Demo@123', 12);
  const admin = await User.create({
    email: 'admin@demo.local',
    passwordHash: adminHash,
    displayName: 'Demo Admin',
    role: 'admin',
    orgId: org._id,
    isActive: true,
  });

  console.log('\n✅ Demo Org created:');
  console.log('   Org:      Demo Company');
  console.log('   Email:    admin@demo.local');
  console.log('   Password: Demo@123');
  console.log('   10 device licenses assigned');

  await mongoose.disconnect();
  console.log('\n🎉 Seeding complete!');
}

seed().catch(err => { console.error(err); process.exit(1); });
