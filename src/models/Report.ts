import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReport extends Document {
  reportedBy: mongoose.Types.ObjectId;
  reportType: 'user' | 'post';
  reportedUser?: mongoose.Types.ObjectId;
  reportedPost?: mongoose.Types.ObjectId;
  category: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['user', 'post'],
      required: true,
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function (this: IReport) {
        return this.reportType === 'user';
      },
    },
    reportedPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: function (this: IReport) {
        return this.reportType === 'post';
      },
    },
    category: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'fake', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ReportSchema.index({ reportedBy: 1, createdAt: -1 });
ReportSchema.index({ reportedUser: 1, status: 1 });
ReportSchema.index({ reportedPost: 1, status: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;
