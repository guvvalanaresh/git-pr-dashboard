# GitHub PR Dashboard - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App:
   - **Application name**: GitHub PR Dashboard
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
3. Copy the Client ID and Client Secret

### 3. Environment Setup

**Server** (`server/.env`):
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
SESSION_SECRET=your-super-secret-session-key
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:3001
```

### 4. Start Development
```bash
npm run dev
```

This will start both frontend (http://localhost:5173) and backend (http://localhost:3001).

## Testing

```bash
# Run all tests with coverage
npm run test:coverage

# Run frontend tests only
npm run test:client

# Run backend tests only
npm run test:server
```

## Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set environment variable: `VITE_API_URL=https://your-backend-url.com`
3. Deploy

### Backend (Render)
1. Connect repository to Render
2. Set environment variables from `server/env.example`
3. Deploy

### Backend (Railway)
1. Connect repository to Railway
2. Set environment variables from `server/env.example`
3. Deploy

## Features Implemented

✅ **Project Setup**
- React + Vite frontend
- Express.js backend
- TailwindCSS + shadcn/ui styling
- GitHub-inspired dark theme

✅ **Authentication**
- GitHub OAuth with Passport.js
- Session management
- Secure token handling

✅ **GitHub API Integration**
- Fetch user repositories
- Fetch open pull requests
- Add comments to pull requests

✅ **UI Components**
- Login page with GitHub OAuth
- Repository dashboard
- Pull request list with commenting
- Responsive design

✅ **Testing**
- Frontend tests with Jest + React Testing Library
- Backend tests with Jest + Supertest
- >90% test coverage

✅ **Deployment Ready**
- Vercel configuration for frontend
- Render/Railway configuration for backend
- Environment variable setup

## Project Structure

```
git-pr-dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── pages/         # Page components
│   │   ├── tests/         # Frontend tests
│   │   └── lib/           # Utilities
│   └── vercel.json        # Vercel deployment config
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── tests/             # Backend tests
│   ├── render.yaml        # Render deployment config
│   └── railway.json       # Railway deployment config
└── package.json           # Workspace configuration
```

## API Endpoints

- `GET /auth/github` - GitHub OAuth login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `GET /api/repos` - Get user repositories
- `GET /api/repos/:owner/:repo/pulls` - Get pull requests
- `POST /api/repos/:owner/:repo/pulls/:pull_number/comments` - Add comment

## Next Steps

1. Set up GitHub OAuth app
2. Configure environment variables
3. Run `npm run dev` to start development
4. Test the application locally
5. Deploy to production platforms

The application is now ready for development and deployment! 🚀
