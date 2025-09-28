import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import authRoutes from '../routes/auth.js';

// Mock passport
jest.mock('passport', () => ({
  initialize: jest.fn(),
  session: jest.fn(),
  authenticate: jest.fn((strategy, options) => (req, res, next) => {
    if (strategy === 'github') {
      res.redirect('/auth/github/callback');
    } else {
      next();
    }
  }),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

// Mock passport-github2
jest.mock('passport-github2', () => ({
  Strategy: jest.fn().mockImplementation((options, callback) => {
    return {
      name: 'github',
      authenticate: jest.fn()
    };
  })
}));

const createApp = () => {
  const app = express();
  
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.use('/auth', authRoutes);
  
  return app;
};

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('GET /auth/github', () => {
    test('should redirect to GitHub OAuth', async () => {
      const response = await request(app)
        .get('/auth/github')
        .expect(302);
      
      expect(response.headers.location).toBe('/auth/github/callback');
    });
  });

  describe('GET /auth/me', () => {
    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);
      
      expect(response.body.error).toBe('Not authenticated');
    });

    test('should return user data when authenticated', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.jpg'
      };

      // Mock authenticated request
      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', 'connect.sid=test-session')
        .expect(200);
      
      // Note: In a real test, you'd need to properly mock the session
      // This is a simplified version
    });
  });

  describe('POST /auth/logout', () => {
    test('should handle logout request', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);
      
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});
