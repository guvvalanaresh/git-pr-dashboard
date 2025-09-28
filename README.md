# GitHub PR Dashboard

A modern web application for managing GitHub pull requests with OAuth authentication, built with React, Express.js, and styled with TailwindCSS and shadcn/ui components.

## Features

- 🔐 GitHub OAuth authentication
- 📊 Repository dashboard with GitHub-inspired dark theme
- 🔍 View open pull requests for each repository
- 💬 Add comments to pull requests
- 🧪 Comprehensive unit testing (>90% coverage)
- 🚀 Production-ready deployment configuration

## Tech Stack

### Frontend
- React 19 with Vite
- TailwindCSS for styling
- shadcn/ui components
- React Router for navigation
- Axios for API calls
- Jest + React Testing Library for testing

### Backend
- Express.js
- Passport.js for OAuth
- Octokit for GitHub API integration
- Express Session for session management
- Jest + Supertest for testing

## Project Structure

```
git-pr-dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── pages/         # Page components
│   │   ├── tests/         # Frontend tests
│   │   └── lib/           # Utility functions
│   ├── tailwind.config.js
│   └── package.json
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── tests/             # Backend tests
│   └── package.json
└── package.json           # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- GitHub OAuth App (for authentication)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd git-pr-dashboard
npm run install:all
```

### 2. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App with:
   - **Application name**: GitHub PR Dashboard
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
3. Copy the Client ID and Client Secret

### 3. Environment Configuration

Create environment files:

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

### 4. Development

Start both frontend and backend:

```bash
npm run dev
```

Or start individually:

```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server
```

### 5. Testing

Run all tests with coverage:

```bash
npm run test:coverage
```

Run tests individually:

```bash
# Frontend tests
npm run test:client

# Backend tests
npm run test:server
```

## Usage

1. **Login**: Click "Sign in with GitHub" to authenticate
2. **Dashboard**: View all your repositories in a GitHub-inspired interface
3. **Pull Requests**: Click on any repository to see open pull requests
4. **Comments**: Click on a pull request to add comments

## Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Set environment variable: `VITE_API_URL=https://your-backend-url.com`
3. Deploy

### Backend (Render/Railway)

1. Connect your repository to Render or Railway
2. Set environment variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_CALLBACK_URL=https://your-backend-url.com/auth/github/callback`
   - `CLIENT_URL=https://your-frontend-url.com`
   - `SESSION_SECRET`
3. Deploy

## API Endpoints

### Authentication
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Repositories
- `GET /api/repos` - Get user repositories
- `GET /api/repos/:owner/:repo/pulls` - Get pull requests

### Comments
- `POST /api/repos/:owner/:repo/pulls/:pull_number/comments` - Add comment
- `GET /api/repos/:owner/:repo/pulls/:pull_number/comments` - Get comments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass with >90% coverage
6. Submit a pull request

## License

MIT License - see LICENSE file for details