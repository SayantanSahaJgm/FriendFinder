# FriendFinder Setup Guide

This guide will help you set up and run the FriendFinder application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
- **Git** - [Download](https://git-scm.com/downloads)
- **Google Maps API Key** - [Get one here](https://developers.google.com/maps/documentation/javascript/get-api-key)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/SayantanSahaJgm/FriendFinder-Vscode.git
cd FriendFinder-Vscode
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/friendfinder
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/friendfinder

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Important**: Change `JWT_SECRET` to a strong random string in production!

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 4. Start MongoDB

If using local MongoDB:

```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

If using MongoDB Atlas, ensure your connection string is in the backend `.env` file.

### 5. Start the Application

#### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

The backend will start on http://localhost:5000

#### Terminal 2 - Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on http://localhost:5173

### 6. Open the Application

Navigate to http://localhost:5173 in your web browser.

## First Steps

1. **Register an Account**: Create a new account with your name, email, and password
2. **Login**: Use your credentials to log in
3. **Set Location**: 
   - Click on the "Settings" tab
   - Click "Use Current Location" to automatically get your location
   - Or manually enter latitude and longitude
   - Click "Update Location"
4. **Find Nearby Users**: 
   - Go to the "Nearby Users" tab
   - Adjust the distance filter (1-50km) in Settings if needed
   - Click "Refresh" to find users in your area
5. **Connect with Friends**:
   - Send friend requests to nearby users
   - Accept friend requests in the notification area
   - Start chatting with your friends!

## Features Guide

### Location-Based Discovery
- Update your location in Settings
- Adjust the search radius from 1km to 50km
- Find users within your specified distance
- View locations on the interactive map

### Friend System
- Send friend requests to nearby users
- Accept or reject incoming friend requests
- View your friends list
- See online/offline status

### Real-Time Chat
- Click on a friend to open the chat window
- Send instant messages
- See typing indicators
- Messages are saved in the database

### Video/Audio Calls
- Start a video or audio call with any friend
- Accept incoming calls
- WebRTC ensures peer-to-peer communication
- End calls gracefully

### Map View
- See your location on Google Maps
- View nearby users on the map
- Visual representation of friend distribution

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify the MongoDB connection string in `.env`
- Ensure port 5000 is not already in use

### Frontend won't start
- Check if all dependencies are installed (`npm install`)
- Verify the API URLs in `.env` match the backend
- Ensure port 5173 is not already in use

### Google Maps not showing
- Verify your Google Maps API key is correct
- Enable the Maps JavaScript API in Google Cloud Console
- Check browser console for API errors

### Location not working
- Allow location access in your browser
- Ensure you're using HTTPS or localhost (required for geolocation)
- Manually enter coordinates if automatic detection fails

### WebRTC calls not working
- Allow camera/microphone access in your browser
- Check firewall settings
- Ensure both users are online
- Try refreshing the page

## Production Deployment

For production deployment, consider:

1. **Environment Variables**:
   - Use strong JWT secrets
   - Use production MongoDB instance
   - Update CORS settings

2. **Security**:
   - Enable HTTPS
   - Configure proper CORS origins
   - Set up rate limiting (already implemented)
   - Use environment-specific configurations

3. **Performance**:
   - Build frontend for production (`npm run build`)
   - Use a process manager like PM2 for Node.js
   - Enable gzip compression
   - Set up a reverse proxy (nginx/Apache)

4. **Database**:
   - Use MongoDB Atlas or a managed database
   - Set up database backups
   - Configure database indexes (already implemented)

## Getting Help

If you encounter issues:

1. Check the console logs (both browser and terminal)
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check the [Issues](https://github.com/SayantanSahaJgm/FriendFinder-Vscode/issues) page
5. Create a new issue with detailed information

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
