// Setup Test Users for Phase 3 Testing
// Run with: node scripts/setup-test-users.js

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  process.exit(1)
}

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    accuracy: Number,
    lastUpdated: Date
  },
  isOnline: { type: Boolean, default: false },
  lastSeen: Date,
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

const testUsers = [
  {
    username: 'testuser1',
    email: 'testuser1@example.com',
    password: 'Test123!',
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749], // San Francisco
      accuracy: 10,
      lastUpdated: new Date()
    }
  },
  {
    username: 'testuser2',
    email: 'testuser2@example.com',
    password: 'Test123!',
    location: {
      type: 'Point',
      coordinates: [-122.4180, 37.7739], // ~1.2km from testuser1
      accuracy: 10,
      lastUpdated: new Date()
    }
  }
]

async function setupTestUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Clean up existing test users
    console.log('🧹 Cleaning up existing test users...')
    await User.deleteMany({
      email: { $in: testUsers.map(u => u.email) }
    })
    console.log('✅ Cleanup complete\n')

    // Create test users
    console.log('👥 Creating test users...')
    const createdUsers = []
    
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        isOnline: false
      })
      createdUsers.push(user)
      console.log(`   ✅ Created: ${user.username} (${user.email})`)
    }

    console.log('\n🤝 Making users friends with each other...')
    // Make testuser1 and testuser2 friends
    await User.findByIdAndUpdate(createdUsers[0]._id, {
      $push: { friends: createdUsers[1]._id }
    })
    await User.findByIdAndUpdate(createdUsers[1]._id, {
      $push: { friends: createdUsers[0]._id }
    })
    console.log('   ✅ Friendship established\n')

    console.log('✅ Test users setup complete!\n')
    console.log('📋 Test User Credentials:')
    console.log('═══════════════════════════════════════')
    testUsers.forEach((user, index) => {
      console.log(`\n🔐 User ${index + 1}:`)
      console.log(`   Email:    ${user.email}`)
      console.log(`   Password: ${user.password}`)
      console.log(`   Location: ${user.location.coordinates[1]}, ${user.location.coordinates[0]}`)
    })
    console.log('\n═══════════════════════════════════════')
    console.log('\n📝 Testing Instructions:')
    console.log('1. Open two browser windows')
    console.log('2. Login with testuser1 in window 1')
    console.log('3. Login with testuser2 in window 2 (incognito mode)')
    console.log('4. Navigate to /dashboard/map in both')
    console.log('5. You should see each other\'s markers!\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the setup
setupTestUsers()
