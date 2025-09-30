import request from 'supertest';
import express from 'express';
import session from 'express-session';
import authRouter, { requireAuth } from '../routes/auth.js';
import passport from 'passport';

// Mock Passport methods
jest.mock('passport', () => ({
  authenticate: jest.fn((strategy, options) => (req, res, next) => next()),
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next())
}));

// Mock req.isAuthenticated()
const mockIsAuthenticated = jest.fn();
const mockUser = {
  id: '123',
  username: 'testuser',
  displayName: 'Test User',
  avatar: 'http://example.com/avatar.png'
};

const app = express();
app.use(express.json());
app.use(
  session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  req.isAuthenticated = mockIsAuthenticated;
  req.user = mockUser;
  next();
});
app.use('/auth', authRouter);

describe('Auth Routes', () => {

  // it('GET /auth/github should call passport.authenticate', async () => {
  //   const res = await request(app).get('/auth/github');
  //   // It should pass through our mock and call next()
  //   expect(res.status).toBe(302); // Next middleware was called
  // });

  it('GET /auth/github/callback should redirect on success', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const res = await request(app).get('/auth/github/callback');
    expect(res.status).toBe(302); // redirect
    expect(res.headers.location).toBe(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`);
  });

  // it('POST /auth/logout should destroy session', async () => {
  //   const res = await request(app).post('/auth/logout');
  //   expect(res.status).toBe(200);
  //   expect(res.body.message).toBe('Logged out successfully');
  // });

  it('GET /auth/me should return user if authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(mockUser.username);
  });

  it('GET /auth/me should return 401 if not authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });

  it('requireAuth middleware should call next if authenticated', () => {
    const req = { isAuthenticated: () => true };
    const res = {};
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('requireAuth middleware should return 401 if not authenticated', () => {
    const req = { isAuthenticated: () => false };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });
});
