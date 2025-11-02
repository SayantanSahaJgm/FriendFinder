/**
 * Setup Bluetooth Test Users
 * This script creates test users with Bluetooth IDs for testing the Bluetooth discovery feature
 */

const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Try to load environment variables from .env files manually (without dotenv package)
const envPaths = [
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../.env.render')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`📄 Loading environment from: ${path.basename(envPath)}`);
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
    break;
  }
}

// Define User schema inline to avoid import issues
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  bio: String,
  bluetoothId: String,
  bluetoothIdUpdatedAt: Date,
  lastSeen: Date,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function setupBluetoothTestUsers() {
  try {
    console.log('🔵 Setting up Bluetooth test users...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Generate test Bluetooth IDs
    const generateBluetoothId = () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      return `bt_${timestamp}_${random}`;
    };

    // Find or create test users
    const testUsers = [
      {
        username: 'alice_bluetooth',
        email: 'alice@test.com',
        name: 'Alice Johnson',
        bio: 'Love hiking and photography! 📸',
      },
      {
        username: 'bob_bluetooth',
        email: 'bob@test.com',
        name: 'Bob Smith',
        bio: 'Tech enthusiast and coffee lover ☕',
      },
      {
        username: 'charlie_bluetooth',
        email: 'charlie@test.com',
        name: 'Charlie Davis',
        bio: 'Fitness trainer and nutrition coach 💪',
      },
      {
        username: 'diana_bluetooth',
        email: 'diana@test.com',
        name: 'Diana Martinez',
        bio: 'Book lover and aspiring writer 📚',
      },
    ];

    let updatedCount = 0;
    let createdCount = 0;

    for (const userData of testUsers) {
      let user = await User.findOne({ email: userData.email });

      if (user) {
        // Update existing user with Bluetooth ID
        user.bluetoothId = generateBluetoothId();
        user.bluetoothIdUpdatedAt = new Date();
        user.lastSeen = new Date();
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user: ${user.username} with Bluetooth ID: ${user.bluetoothId}`);
      } else {
        // Create new user with hashed password
        const hashedPassword = await bcrypt.hash('test123', 10);
        user = new User({
          ...userData,
          password: hashedPassword,
          bluetoothId: generateBluetoothId(),
          bluetoothIdUpdatedAt: new Date(),
          lastSeen: new Date(),
        });
        await user.save();
        createdCount++;
        console.log(`✅ Created user: ${user.username} with Bluetooth ID: ${user.bluetoothId}`);
      }
    }

    console.log('\n🎉 Bluetooth test setup complete!');
    console.log(`📊 Created: ${createdCount} users`);
    console.log(`🔄 Updated: ${updatedCount} users`);
    console.log('\n💡 You can now test the Bluetooth discovery feature');
    console.log('   Navigate to /dashboard/bluetooth and enable Bluetooth discovery');

  } catch (error) {
    console.error('❌ Error setting up Bluetooth test users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the setup
setupBluetoothTestUsers();
