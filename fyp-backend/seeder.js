require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const mongoUri = process.env.MONGO_URI;
const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@riphah.edu.pk';
const adminPassword = process.env.SEED_ADMIN_PASS || 'Admin@123';

(async () => {
  try {
    if (!mongoUri) throw new Error("MONGO_URI not set in .env");
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding');

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log('Admin already exists. Exiting.');
      process.exit();
    }

    const hashed = await bcrypt.hash(adminPassword, 10);

  const admin = new User({
  email: adminEmail,
  password: hashed,
  role: 'admin',
  first_logic: true,
  first_login: true,
  mustChangePassword: true
});


    await admin.save();
    console.log('✅ Admin seeded:', adminEmail);
    console.log('Now run your server and login with this admin to get a token.');
    process.exit();
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
})();
