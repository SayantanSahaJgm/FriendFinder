# FriendFinder - Real-Time Social Connection App

A MERN stack social application that connects nearby people in real-time. Find friends, chat, and make audio/video calls with people in your vicinity.

## Features

### 🔐 User Authentication
- Secure registration and login with JWT tokens
- Password encryption using bcrypt
- Protected routes and API endpoints

### 📍 Location-Based Discovery
- Google Maps integration for visual location display
- Real-time geospatial queries using MongoDB
- Adjustable distance filters (default 10km radius)
- Find nearby users based on your current location

### 👥 Friend Management
- Send and receive friend requests
- Accept or reject friend requests
- Remove friends from your list
- View online/offline status of friends

### 💬 Real-Time Chat
- Instant messaging using Socket.IO
- Real-time message delivery
- Typing indicators
- Chat history with timestamps
- Mark messages as read

### 📞 Audio/Video Calls
- Random audio/video calls with friends
- WebRTC peer-to-peer connection
- Toggle video and audio during calls
- Accept/reject incoming calls
- Call status indicators

### 🎨 Modern UI
- Built with React and Tailwind CSS
- Responsive design
- Clean and intuitive interface
- Real-time updates

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database with geospatial indexing
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time communication
- **simple-peer** - WebRTC wrapper
- **@react-google-maps/api** - Google Maps integration
- **axios** - HTTP client

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Google Maps API key

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/friendfinder
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

5. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Usage

### Getting Started

1. **Register**: Create a new account with your name, email, and password
2. **Login**: Sign in with your credentials
3. **Enable Location**: Allow browser location access to find nearby users
4. **Explore**: View nearby users on the map and in the list

### Finding Friends

1. Navigate to the "Nearby" tab to see users within your distance radius
2. Click "Add Friend" to send a friend request
3. Go to "Requests" tab to manage incoming and outgoing requests
4. Accept friend requests to add users to your friends list

### Chatting

1. Go to the "Friends" tab
2. Click the chat icon (💬) next to a friend's name
3. Type your message and press "Send"
4. Messages are delivered in real-time via Socket.IO

### Making Calls

1. Go to the "Friends" tab
2. Click the call icon (📞) next to a friend's name
3. Wait for them to accept the call
4. Use controls to toggle video/audio or end the call

### Adjusting Settings

- Update your profile (bio, avatar) through the API
- Change your distance filter to see more or fewer nearby users
- Your location updates automatically

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `PUT /api/users/location` - Update user location (protected)
- `PUT /api/users/profile` - Update user profile (protected)
- `GET /api/users/nearby` - Find nearby users (protected)
- `GET /api/users/:id` - Get user by ID (protected)

### Friends
- `POST /api/friends/request` - Send friend request (protected)
- `GET /api/friends/requests/received` - Get received requests (protected)
- `GET /api/friends/requests/sent` - Get sent requests (protected)
- `PUT /api/friends/request/:requestId/accept` - Accept request (protected)
- `PUT /api/friends/request/:requestId/reject` - Reject request (protected)
- `DELETE /api/friends/:friendId` - Remove friend (protected)

### Messages
- `GET /api/messages/:userId` - Get chat messages (protected)
- `POST /api/messages` - Send message (protected)
- `PUT /api/messages/:userId/read` - Mark messages as read (protected)

## Socket.IO Events

### Client → Server
- `authenticate` - Authenticate socket connection
- `send-message` - Send a chat message
- `typing` - User is typing
- `stop-typing` - User stopped typing
- `call-user` - Initiate a call
- `accept-call` - Accept incoming call
- `reject-call` - Reject incoming call
- `end-call` - End active call

### Server → Client
- `authenticated` - Authentication successful
- `receive-message` - New message received
- `message-sent` - Message sent confirmation
- `user-typing` - Friend is typing
- `user-stop-typing` - Friend stopped typing
- `friend-online` - Friend came online
- `friend-offline` - Friend went offline
- `incoming-call` - Incoming call
- `call-accepted` - Call was accepted
- `call-rejected` - Call was rejected
- `call-ended` - Call ended

## Project Structure

```
FriendFinder-Vscode/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── friendController.js
│   │   │   ├── messageController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── FriendRequest.js
│   │   │   ├── Message.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── friendRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── FriendRequests.jsx
│   │   │   ├── FriendsList.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── NearbyUsers.jsx
│   │   │   └── VideoCall.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── geolocation.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── .env.example
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Development

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Building for Production
```bash
# Build frontend
cd client
npm run build

# The build output will be in client/dist
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- CORS configuration
- Environment variable management
- Input validation

## Future Enhancements

- [ ] Group chat functionality
- [ ] Media sharing (images, files)
- [ ] Push notifications
- [ ] User profiles with photos
- [ ] Friend recommendations
- [ ] Activity feed
- [ ] Search functionality
- [ ] Blocking/reporting users
- [ ] Email verification
- [ ] Password reset
- [ ] OAuth integration (Google, Facebook)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.