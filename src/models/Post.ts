import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';

export interface IMedia {
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  publicId?: string;
}

export interface IPost extends Document {
  author?: mongoose.Types.ObjectId | null;
  text?: string | null;
  media?: IMedia[];
  isStory?: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  url: { type: String, required: true },
  filename: { type: String },
  size: { type: Number },
  mimeType: { type: String },
  publicId: { type: String },
});

const PostSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
  text: { type: String },
  media: { type: [MediaSchema], default: [] },
  isStory: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, default: null, index: true },
}, {
  timestamps: true,
});

// Index for feed
PostSchema.index({ createdAt: -1 });
// TTL index: remove documents when expiresAt passes
PostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

interface IPostModel extends Model<IPost> {
  // Add statics if needed later
}

const Post = (mongoose.models.Post as IPostModel) || mongoose.model<IPost, IPostModel>('Post', PostSchema);

export default Post;
