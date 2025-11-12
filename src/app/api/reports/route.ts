import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Report from '@/models/Report';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { reportType, reportedUserId, reportedPostId, category, description } = body;

    // Validation
    if (!reportType || !category || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (reportType === 'user' && !reportedUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required for user reports' },
        { status: 400 }
      );
    }

    if (reportType === 'post' && !reportedPostId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required for post reports' },
        { status: 400 }
      );
    }

    // Prevent self-reporting
    if (reportType === 'user' && reportedUserId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot report yourself' },
        { status: 400 }
      );
    }

    // Check if user has already reported this item
    const existingReport = await Report.findOne({
      reportedBy: session.user.id,
      reportType,
      ...(reportType === 'user' ? { reportedUser: reportedUserId } : { reportedPost: reportedPostId }),
      status: { $in: ['pending', 'reviewed'] },
    });

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You have already reported this item' },
        { status: 400 }
      );
    }

    // Create report
    const report = await Report.create({
      reportedBy: session.user.id,
      reportType,
      ...(reportType === 'user' ? { reportedUser: reportedUserId } : { reportedPost: reportedPostId }),
      category,
      description,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it.',
      report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user's reports
    const reports = await Report.find({ reportedBy: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('reportedUser', 'name email')
      .populate('reportedPost', 'content');

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
