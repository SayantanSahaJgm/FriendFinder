import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Random Chat Queue Preferences interface
 */
export interface IQueuePreferences {
  chatType: 'text' | 'voice' | 'video';
  language?: string;
  interests?: string[];
  ageRange?: {
    min: number;
    max: number;
  };
}

/**
 * Random Chat Queue document interface
 */
export interface IRandomChatQueue extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  anonymousId: string;
  preferences: IQueuePreferences;
  joinedAt: Date;
  priority: number;
  retryCount: number;
  lastMatchAttempt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  incrementRetry(): Promise<IRandomChatQueue>;
  updateLastMatchAttempt(): Promise<IRandomChatQueue>;
  deactivate(): Promise<IRandomChatQueue>;
}

/**
 * Queue Preferences schema
 */
const QueuePreferencesSchema = new Schema<IQueuePreferences>({
  chatType: {
    type: String,
    enum: ['text', 'voice', 'video'],
    required: true,
    index: true,
  },
  language: {
    type: String,
    default: 'en',
    index: true,
  },
  interests: [{
    type: String,
    index: true,
  }],
  ageRange: {
    min: {
      type: Number,
      min: 13,
      max: 100,
      default: 18,
    },
    max: {
      type: Number,
      min: 13,
      max: 100,
      default: 65,
    },
  },
});

/**
 * Random Chat Queue schema definition
 */
const RandomChatQueueSchema = new Schema<IRandomChatQueue>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One queue entry per user
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  anonymousId: {
    type: String,
    required: true,
  },
  preferences: {
    type: QueuePreferencesSchema,
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  priority: {
    type: Number,
    default: 0,
    index: true,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  lastMatchAttempt: {
    type: Date,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

/**
 * Indexes for performance optimization
 */
RandomChatQueueSchema.index({ isActive: 1, 'preferences.chatType': 1 });
RandomChatQueueSchema.index({ joinedAt: 1, priority: -1 });
RandomChatQueueSchema.index({ 'preferences.language': 1, isActive: 1 });
RandomChatQueueSchema.index({ 'preferences.interests': 1, isActive: 1 });

/**
 * TTL index to auto-remove inactive queue entries after 1 hour
 */
RandomChatQueueSchema.index(
  { updatedAt: 1 },
  { 
    expireAfterSeconds: 60 * 60, // 1 hour
    partialFilterExpression: { isActive: false }
  }
);

/**
 * Instance method: Increment retry count
 */
RandomChatQueueSchema.methods.incrementRetry = async function(): Promise<IRandomChatQueue> {
  this.retryCount += 1;
  this.lastMatchAttempt = new Date();
  
  // Increase priority based on retry count (helps users who wait longer)
  this.priority = Math.min(this.retryCount * 10, 100);
  
  return this.save();
};

/**
 * Instance method: Update last match attempt
 */
RandomChatQueueSchema.methods.updateLastMatchAttempt = async function(): Promise<IRandomChatQueue> {
  this.lastMatchAttempt = new Date();
  return this.save();
};

/**
 * Instance method: Deactivate queue entry
 */
RandomChatQueueSchema.methods.deactivate = async function(): Promise<IRandomChatQueue> {
  this.isActive = false;
  return this.save();
};

/**
 * Static method: Find potential matches
 */
RandomChatQueueSchema.statics.findPotentialMatches = function(
  userId: mongoose.Types.ObjectId,
  preferences: IQueuePreferences,
  excludeUserIds: mongoose.Types.ObjectId[] = []
) {
  const query: any = {
    userId: { $ne: userId, $nin: excludeUserIds },
    isActive: true,
    'preferences.chatType': preferences.chatType,
  };

  // Add language preference if specified
  if (preferences.language) {
    query['preferences.language'] = preferences.language;
  }

  // Add interest matching if specified
  if (preferences.interests && preferences.interests.length > 0) {
    query['preferences.interests'] = { $in: preferences.interests };
  }

  // Add age range matching if specified
  if (preferences.ageRange) {
    query.$and = [
      {
        $or: [
          { 'preferences.ageRange': { $exists: false } },
          {
            'preferences.ageRange.min': { $lte: preferences.ageRange.max },
            'preferences.ageRange.max': { $gte: preferences.ageRange.min },
          },
        ],
      },
    ];
  }

  return this.find(query)
    .sort({ priority: -1, joinedAt: 1 }) // Higher priority and older entries first
    .limit(10);
};

/**
 * Static method: Find next match for user
 */
RandomChatQueueSchema.statics.findNextMatch = async function(
  userId: mongoose.Types.ObjectId,
  preferences: IQueuePreferences
) {
  // First try to find exact matches
  let matches = await (this as any).findPotentialMatches(userId, preferences);

  // If we found multiple matches, pick one at random to avoid always selecting the oldest
  if (matches.length > 1) {
    const idx = Math.floor(Math.random() * matches.length)
    return matches[idx]
  }

  if (matches.length === 0) {
    // If no exact matches, try with relaxed language preference
    const relaxedPreferences = { ...preferences };
    delete (relaxedPreferences as any).language;
    matches = await (this as any).findPotentialMatches(userId, relaxedPreferences);
  }
  if (matches.length === 0) {
    // If still no matches, try with relaxed interest preference
    const veryRelaxedPreferences = { ...preferences };
    delete (veryRelaxedPreferences as any).language;
    delete (veryRelaxedPreferences as any).interests;
    matches = await (this as any).findPotentialMatches(userId, veryRelaxedPreferences);
  }

  // Final fallback: if still no matches, try ANY active user (same chatType) regardless of preferences
  if (matches.length === 0) {
    matches = await this.find({
      userId: { $ne: userId },
      isActive: true,
      'preferences.chatType': preferences.chatType,
    }).limit(10).lean();
  }

  if (matches.length > 1) {
    const idx = Math.floor(Math.random() * matches.length)
    return matches[idx]
  }

  return matches.length > 0 ? matches[0] : null;
};

/**
 * Static method: Get queue statistics
 */
RandomChatQueueSchema.statics.getQueueStats = function() {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$preferences.chatType',
        count: { $sum: 1 },
        avgWaitTime: {
          $avg: {
            $subtract: [new Date(), '$joinedAt']
          }
        }
      }
    }
  ]);
};

/**
 * Static method: Clean up old inactive entries
 */
RandomChatQueueSchema.statics.cleanupOldEntries = function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  return this.deleteMany({
    $or: [
      { isActive: false, updatedAt: { $lt: oneHourAgo } },
      { joinedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // 24 hours old
    ]
  });
};

interface IRandomChatQueueModel extends Model<IRandomChatQueue> {
  findPotentialMatches(userId: mongoose.Types.ObjectId, preferences: IQueuePreferences, excludeUserIds?: mongoose.Types.ObjectId[]): Promise<IRandomChatQueue[]>;
  findNextMatch(userId: mongoose.Types.ObjectId, preferences: IQueuePreferences): Promise<IRandomChatQueue | null>;
  getQueueStats(): Promise<any[]>;
  cleanupOldEntries(): Promise<any>;
}

const RandomChatQueue: IRandomChatQueueModel = (mongoose.models.RandomChatQueue as IRandomChatQueueModel) || 
  mongoose.model<IRandomChatQueue, IRandomChatQueueModel>('RandomChatQueue', RandomChatQueueSchema);

export default RandomChatQueue;