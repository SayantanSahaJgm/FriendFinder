# FriendFinder

A MERN stack social application for connecting with nearby people in real-time. Built with modern technologies including React, Node.js, Express, MongoDB, Socket.IO, and WebRTC.

## Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with registration and login
- **Location-Based Discovery**: Find nearby users based on geolocation with adjustable distance filters
- **Google Maps Integration**: Visual representation of user locations on interactive maps
- **Friend System**: Send, accept, and reject friend requests
- **Real-Time Chat**: Instant messaging using Socket.IO
- **Video/Audio Calls**: Peer-to-peer calling using WebRTC
- **Distance Filters**: Customize search radius from 1km to 50km
- **Online Status**: See which friends are currently online

### Tech Stack

#### Frontend
- **React** with Vite for fast development
- **Tailwind CSS** for modern, responsive UI
- **React Router** for navigation
- **Socket.IO Client** for real-time communication
- **Simple Peer** for WebRTC video/audio calls
- **Google Maps API** for location visualization
- **Axios** for API requests

#### Backend
- **Node.js** & **Express** for server
- **MongoDB** with Mongoose for database
- **Socket.IO** for real-time events
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Express Validator** for input validation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Maps API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/SayantanSahaJgm/FriendFinder-Vscode.git
cd FriendFinder-Vscode
```

2. **Setup Backend**
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/friendfinder
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Running the Application

1. **Start MongoDB** (if running locally)
```bash
mongod
```

2. **Start Backend Server**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

3. **Start Frontend Development Server**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

4. **Access the Application**
Open your browser and navigate to `http://localhost:5173`

## Usage Guide

### 1. Registration & Login
- Create a new account with your name, email, and password
- Login with your credentials

### 2. Setup Location
- Go to Settings tab
- Click "Use Current Location" or manually enter coordinates
- Update your location to enable friend discovery

### 3. Find Nearby Users
- Navigate to "Nearby Users" tab
- Adjust the distance filter (1-50 km) in Settings
- Click "Refresh" to find users in your area
- Send friend requests to users you want to connect with

### 4. Manage Friend Requests
- Accept or reject incoming friend requests from the notifications
- View your friends list in the "Friends" tab

### 5. Chat with Friends
- Click on a friend in the Friends list to open chat
- Send real-time messages
- See online/offline status

### 6. Video/Audio Calls
- Start a video or audio call with any friend
- Accept incoming calls from friends
- WebRTC enables peer-to-peer communication

### 7. Map View
- View your location and nearby users on Google Maps
- Visual representation of friend distribution

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Users
- `PUT /api/users/location` - Update user location (protected)
- `PUT /api/users/max-distance` - Update distance filter (protected)
- `GET /api/users/nearby` - Find nearby users (protected)
- `GET /api/users/:userId` - Get user by ID (protected)

### Friends
- `POST /api/friends/request` - Send friend request (protected)
- `GET /api/friends/requests/pending` - Get pending requests (protected)
- `PUT /api/friends/request/:requestId/accept` - Accept request (protected)
- `PUT /api/friends/request/:requestId/reject` - Reject request (protected)
- `GET /api/friends` - Get friends list (protected)

### Messages
- `POST /api/messages` - Send message (protected)
- `GET /api/messages/chat/:userId` - Get chat history (protected)
- `PUT /api/messages/read/:senderId` - Mark messages as read (protected)

## Socket.IO Events

### Client to Server
- `send_message` - Send chat message
- `typing` - User is typing
- `stop_typing` - User stopped typing
- `call_user` - Initiate call
- `answer_call` - Answer incoming call
- `reject_call` - Reject call
- `end_call` - End active call

### Server to Client
- `receive_message` - Receive chat message
- `user_typing` - Friend is typing
- `user_stop_typing` - Friend stopped typing
- `friend_online` - Friend came online
- `friend_offline` - Friend went offline
- `incoming_call` - Receive call
- `call_accepted` - Call was accepted
- `call_rejected` - Call was rejected
- `call_ended` - Call ended

## Project Structure

```
FriendFinder-Vscode/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── FriendRequest.js
│   │   │   └── Message.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── friendController.js
│   │   │   └── messageController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── friends.js
│   │   │   └── messages.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── utils/
│   │   │   └── socket.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── FriendRequests.jsx
│   │   │   ├── FriendsList.jsx
│   │   │   ├── LocationSettings.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── NearbyUsers.jsx
│   │   │   └── VideoCall.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation
- CORS configuration
- Secure WebSocket connections

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Google Maps API for location services
- Socket.IO for real-time communication
- Simple Peer for WebRTC implementation
- MongoDB for database
- React and Vite for frontend development