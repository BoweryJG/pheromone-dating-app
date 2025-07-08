# Pheromone Dating App

A science-based dating application that matches users based on pheromone compatibility, creating deeper biological connections beyond traditional dating app superficiality.

## Features

- 🧬 **Scent Profile Creation** - Users create detailed scent profiles with their preferences
- 🧪 **Sample Kit Orders** - Premium users can order scent sample kits for scientific matching
- 💕 **Compatibility Matching** - Advanced algorithm matches users based on pheromone compatibility
- 💬 **Encrypted Messaging** - Secure end-to-end encrypted chat between matches
- 📍 **Location-Based Discovery** - Find compatible matches nearby
- 🔒 **Privacy-First** - All personal data is encrypted and secure

## Tech Stack

- **Frontend**: React, TypeScript, React Scripts
- **Backend**: Node.js, Express, PostgreSQL, Knex.js
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: WebSocket support ready
- **Storage**: AWS S3 for photo uploads
- **Payments**: Stripe integration for subscriptions

## Prerequisites

- Node.js v16+ 
- PostgreSQL 12+
- AWS Account (for photo storage)
- Stripe Account (for payments)

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/pheromone-dating-app.git
cd pheromone-dating-app
```

### 2. Install dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
- Database credentials
- JWT secret (generate a secure random string)
- AWS credentials
- Stripe API keys
- SMTP settings for emails

### 4. Set up the database
```bash
# Create the database
createdb pheromone_dating

# Run migrations
npm run migrate

# (Optional) Seed with test data
npm run seed
```

### 5. Start the development servers
```bash
# Start backend server
npm run dev

# In another terminal, start frontend
npm run client
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/nearby` - Find nearby users
- `GET /api/users/:id` - View user profile
- `DELETE /api/users/profile` - Delete account

### Scent Profiles
- `GET /api/scent/profile` - Get scent profile
- `POST /api/scent/profile` - Create/update scent profile
- `POST /api/scent/sample/order` - Order sample kit (Premium)
- `POST /api/scent/sample/rate` - Rate scent sample
- `GET /api/scent/compatibility/:userId` - Check compatibility

### Matches
- `GET /api/matches` - Get all matches
- `POST /api/matches/like/:userId` - Like someone
- `POST /api/matches/pass/:userId` - Pass on someone
- `DELETE /api/matches/:matchId` - Unmatch
- `GET /api/matches/stats` - Match statistics

### Messages
- `GET /api/messages/match/:matchId` - Get messages
- `POST /api/messages/send` - Send message
- `PUT /api/messages/read/:matchId` - Mark as read
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/unread/count` - Unread count

## Deployment

### Netlify (Frontend)
The frontend is configured for Netlify deployment:
```bash
cd client
npm run build
```
Connect your GitHub repo to Netlify and it will auto-deploy.

### Backend Deployment
Recommended platforms:
- Heroku
- Railway
- Render
- AWS EC2/ECS

Set all environment variables on your hosting platform.

## Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
