import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { settingType, value } = body;

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Initialize settings object if it doesn't exist
    if (!user.settings) {
      user.settings = {};
    }

    // Handle different types of settings
    switch (settingType) {
      case 'pushNotifications':
        user.settings.pushNotifications = value;
        break;
      
      case 'emailNotifications':
        user.settings.emailNotifications = value;
        break;
      
      case 'friendRequests':
        user.settings.friendRequests = value;
        break;
      
      case 'newMessages':
        user.settings.newMessages = value;
        break;
      
      case 'nearbyFriends':
        user.settings.nearbyFriends = value;
        break;
      
      case 'soundEnabled':
        user.settings.soundEnabled = value;
        break;
      
      case 'vibrationEnabled':
        user.settings.vibrationEnabled = value;
        break;
      
      case 'language':
        user.settings.language = value;
        break;
      
      case 'theme':
        user.settings.theme = value;
        break;
      
      case 'readReceipts':
        user.settings.readReceipts = value;
        break;
      
      case 'twoFactorAuth':
        user.settings.twoFactorAuth = value;
        break;
      
      case 'profileVisibility':
        user.settings.profileVisibility = value;
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid setting type' },
          { status: 400 }
        );
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      settings: user.settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email }).select('settings');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return default settings if not set
    const defaultSettings = {
      pushNotifications: false,
      emailNotifications: false,
      friendRequests: true,
      newMessages: true,
      nearbyFriends: true,
      soundEnabled: true,
      vibrationEnabled: true,
      language: 'English',
      theme: 'light',
      readReceipts: true,
      twoFactorAuth: false,
      profileVisibility: 'friends',
    };

    return NextResponse.json({
      success: true,
      settings: { ...defaultSettings, ...user.settings },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
