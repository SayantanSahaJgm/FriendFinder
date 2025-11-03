# Database Optimization Guide

## MongoDB Indexing Strategy

### User Collection Indexes

```javascript
// Primary indexes for user lookups
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ _id: 1 })

// Location-based queries (for nearby friend finder)
db.users.createIndex({ "location.coordinates": "2dsphere" })

// Search and filtering
db.users.createIndex({ username: "text", name: "text", bio: "text" })
db.users.createIndex({ interests: 1 })
db.users.createIndex({ age: 1 })

// Authentication and status
db.users.createIndex({ verificationToken: 1 }, { sparse: true })
db.users.createIndex({ resetPasswordToken: 1 }, { sparse: true })
db.users.createIndex({ isVerified: 1 })
db.users.createIndex({ lastActive: -1 })

// Composite indexes for common queries
db.users.createIndex({ isVerified: 1, lastActive: -1 })
db.users.createIndex({ interests: 1, age: 1 })
```

### Friend Requests Collection Indexes

```javascript
// Friend request lookups
db.friendRequests.createIndex({ from: 1, to: 1 }, { unique: true })
db.friendRequests.createIndex({ to: 1, status: 1 })
db.friendRequests.createIndex({ from: 1, status: 1 })
db.friendRequests.createIndex({ status: 1, createdAt: -1 })

// Composite index for pending requests
db.friendRequests.createIndex({ to: 1, status: 1, createdAt: -1 })
```

### Messages Collection Indexes

```javascript
// Message queries
db.messages.createIndex({ sender: 1, receiver: 1, createdAt: -1 })
db.messages.createIndex({ receiver: 1, read: 1 })
db.messages.createIndex({ conversationId: 1, createdAt: -1 })
db.messages.createIndex({ createdAt: -1 })

// Unread messages
db.messages.createIndex({ receiver: 1, read: 1, createdAt: -1 })

// Full-text search
db.messages.createIndex({ content: "text" })
```

### Notifications Collection Indexes

```javascript
// Notification queries
db.notifications.createIndex({ userId: 1, createdAt: -1 })
db.notifications.createIndex({ userId: 1, read: 1 })
db.notifications.createIndex({ userId: 1, type: 1, createdAt: -1 })

// Cleanup old notifications
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }) // 30 days
```

### Location History Collection Indexes

```javascript
// Location tracking
db.locationHistory.createIndex({ userId: 1, timestamp: -1 })
db.locationHistory.createIndex({ "location.coordinates": "2dsphere" })
db.locationHistory.createIndex({ userId: 1, timestamp: -1, "location.coordinates": "2dsphere" })

// Cleanup old locations
db.locationHistory.createIndex({ timestamp: 1 }, { expireAfterSeconds: 604800 }) // 7 days
```

## Query Optimization Patterns

### 1. Use Projection to Limit Fields

```javascript
// ❌ BAD: Fetches all fields
const users = await User.find({ interests: "coding" });

// ✅ GOOD: Only fetches needed fields
const users = await User.find({ interests: "coding" })
  .select('name email profilePicture age')
  .lean(); // Use lean() for read-only queries
```

### 2. Limit Results with Pagination

```javascript
// ✅ GOOD: Paginated results
const page = 1;
const limit = 20;
const users = await User.find({ isVerified: true })
  .sort({ lastActive: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .select('name profilePicture')
  .lean();
```

### 3. Use Aggregation Pipeline for Complex Queries

```javascript
// ✅ GOOD: Efficient aggregation
const stats = await User.aggregate([
  { $match: { isVerified: true } },
  { $group: {
      _id: "$interests",
      count: { $sum: 1 },
      avgAge: { $avg: "$age" }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);
```

### 4. Use $in for Multiple ID Lookups

```javascript
// ✅ GOOD: Single query for multiple IDs
const friendIds = ["id1", "id2", "id3"];
const friends = await User.find({ _id: { $in: friendIds } })
  .select('name profilePicture')
  .lean();
```

### 5. Avoid N+1 Queries with Population

```javascript
// ❌ BAD: N+1 query problem
const messages = await Message.find({ receiver: userId });
for (const msg of messages) {
  msg.sender = await User.findById(msg.sender); // N queries!
}

// ✅ GOOD: Use populate
const messages = await Message.find({ receiver: userId })
  .populate('sender', 'name profilePicture')
  .lean();
```

### 6. Use Geospatial Queries Efficiently

```javascript
// ✅ GOOD: Nearby users with limit
const nearbyUsers = await User.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [lng, lat]
      },
      $maxDistance: 5000 // 5km
    }
  }
})
.limit(50)
.select('name location profilePicture')
.lean();
```

### 7. Cache Frequent Queries

```javascript
// Example with Redis
const cacheKey = `nearby_users:${userId}:${lat}:${lng}`;
let cachedData = await redis.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

const nearbyUsers = await User.find({ /* query */ });
await redis.setex(cacheKey, 300, JSON.stringify(nearbyUsers)); // Cache for 5 min

return nearbyUsers;
```

## Performance Monitoring

### 1. Enable Slow Query Logging

```javascript
// In MongoDB config
db.setProfilingLevel(1, { slowms: 100 }); // Log queries > 100ms

// View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10);
```

### 2. Analyze Query Performance

```javascript
// Use explain() to analyze queries
const explain = await User.find({ interests: "coding" })
  .explain("executionStats");

console.log(explain.executionStats.totalDocsExamined); // Should be close to nReturned
```

### 3. Monitor Index Usage

```javascript
// Check index statistics
db.users.aggregate([{ $indexStats: {} }]);

// Find unused indexes
db.users.aggregate([
  { $indexStats: {} },
  { $match: { "accesses.ops": { $lt: 10 } } }
]);
```

## Database Connection Optimization

### 1. Connection Pooling

```javascript
// In mongoose config
mongoose.connect(mongoUri, {
  maxPoolSize: 10, // Max concurrent connections
  minPoolSize: 5,  // Min connections to maintain
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 2. Use Lean Queries for Read-Only Data

```javascript
// ✅ GOOD: 5x faster for read-only
const users = await User.find().lean();
```

### 3. Batch Operations

```javascript
// ✅ GOOD: Batch inserts
await User.insertMany(users, { ordered: false });

// ✅ GOOD: Batch updates
await User.bulkWrite([
  { updateOne: { filter: { _id: id1 }, update: { $set: { online: true } } } },
  { updateOne: { filter: { _id: id2 }, update: { $set: { online: true } } } },
]);
```

## Data Model Optimization

### 1. Embedding vs Referencing

```javascript
// ✅ GOOD: Embed small, bounded data
const userSchema = new Schema({
  name: String,
  settings: { // Embedded
    notifications: Boolean,
    theme: String,
    privacy: String
  }
});

// ✅ GOOD: Reference large, unbounded data
const messageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User' }, // Referenced
  content: String
});
```

### 2. Denormalization for Read Performance

```javascript
// ✅ GOOD: Store frequently accessed data
const messageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User' },
  senderName: String, // Denormalized for quick access
  senderAvatar: String, // Denormalized for quick access
  content: String
});
```

## Cleanup and Maintenance

### 1. Regular Index Maintenance

```bash
# Rebuild indexes periodically
db.users.reIndex()
```

### 2. Archive Old Data

```javascript
// Archive messages older than 1 year
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

await Message.updateMany(
  { createdAt: { $lt: oneYearAgo } },
  { $set: { archived: true } }
);

// Move to archive collection
const oldMessages = await Message.find({ archived: true });
await ArchivedMessage.insertMany(oldMessages);
await Message.deleteMany({ archived: true });
```

### 3. Implement TTL for Temporary Data

```javascript
// Auto-delete expired data
const sessionSchema = new Schema({
  userId: Schema.Types.ObjectId,
  token: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours
});
```

## Checklist

- [ ] All collections have appropriate indexes
- [ ] Queries use projection to limit fields
- [ ] Pagination implemented for list queries
- [ ] Geospatial queries use 2dsphere index
- [ ] N+1 queries eliminated with populate
- [ ] Slow queries logged and monitored
- [ ] Connection pooling configured
- [ ] Lean() used for read-only queries
- [ ] Frequently accessed data denormalized
- [ ] TTL indexes for temporary data
- [ ] Regular index maintenance scheduled
- [ ] Old data archived periodically

## Expected Performance Improvements

After implementing these optimizations:

- **Query response time**: 50-90% reduction
- **Database load**: 40-60% reduction
- **Memory usage**: 30-50% reduction
- **Throughput**: 2-3x increase
- **Cache hit ratio**: 80%+ for frequent queries

## Monitoring Tools

- MongoDB Atlas Performance Advisor
- MongoDB Compass for query analysis
- New Relic for application monitoring
- Datadog for infrastructure monitoring
- Custom logging with Winston/Pino
