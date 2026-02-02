# Real-Time Chat Application

A production-ready real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO for real-time messaging.

## Features

- 🔐 **User Authentication**: JWT-based authentication with secure password hashing
- 💬 **Real-Time Messaging**: Instant message delivery using Socket.IO
- 👥 **One-on-One Chats**: Private conversations between users
- 👨‍👩‍👧‍👦 **Group Chats**: Create and manage group conversations
- ⌨️ **Typing Indicators**: See when someone is typing
- 🟢 **Online/Offline Status**: Track user presence
- 📱 **Responsive Design**: Beautiful UI built with Tailwind CSS
- 🔒 **Protected Routes**: Secure access to chat features

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **Context API** - State management

## Project Structure

```
chat-application/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Context providers
│   │   ├── services/      # API and socket services
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main app component
│   │   └── index.js       # Entry point
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   ├── server.js         # Server entry point
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
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

3. Create a `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Chats
- `GET /api/chats` - Get all chats for authenticated user (protected)
- `POST /api/chats` - Create or fetch one-on-one chat (protected)
- `POST /api/chats/group` - Create group chat (protected)
- `GET /api/chats/:chatId` - Get single chat (protected)

### Messages
- `GET /api/messages/:chatId` - Get all messages for a chat (protected)
- `POST /api/messages` - Create a new message (protected)

## Socket.IO Events

### Client to Server
- `join-chat` - Join a chat room
- `leave-chat` - Leave a chat room
- `new-message` - Send a new message
- `typing` - Send typing indicator

### Server to Client
- `message-received` - Receive a new message
- `message-sent` - Confirm message sent
- `typing` - Receive typing indicator
- `user-online` - User came online
- `user-offline` - User went offline

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Start Chatting**: Select a chat from the sidebar or create a new one
3. **Send Messages**: Type and send messages in real-time
4. **See Typing**: Watch for typing indicators when someone is typing
5. **Online Status**: See which users are online

## Environment Variables

### Server (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration time
- `CLIENT_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

### Client (.env)
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_SOCKET_URL` - Socket.IO server URL

## Development

### Running Both Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

## Production Build

### Frontend
```bash
cd client
npm run build
```

The build folder will contain the production-ready static files.

### Backend
```bash
cd server
npm start
```

Make sure to set `NODE_ENV=production` in your production environment.

## Security Considerations

- Change `JWT_SECRET` to a strong, random string in production
- Use environment variables for all sensitive data
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Use HTTPS in production
- Implement proper error handling

## Future Enhancements

- [ ] File/image sharing
- [ ] Message reactions
- [ ] Message search
- [ ] Read receipts
- [ ] Push notifications
- [ ] Voice/video calls
- [ ] Message encryption
- [ ] User profiles and avatars
- [ ] Dark mode

## License

This project is open source and available under the MIT License.

## Contributing

Contributions, issues, and feature requests are welcome!

## Support

For support, email your-email@example.com or open an issue in the repository.

---

Built with ❤️ using the MERN stack

