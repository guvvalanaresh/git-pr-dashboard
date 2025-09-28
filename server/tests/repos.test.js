import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import repoRoutes from '../routes/repos.js';
import { requireAuth } from '../routes/auth.js';

// Mock Octokit
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        listForAuthenticatedUser: jest.fn(),
      },
      pulls: {
        list: jest.fn(),
        get: jest.fn(),
      },
    },
  })),
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
  
  app.use('/api/repos', repoRoutes);
  
  return app;
};

describe('Repository Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('GET /api/repos', () => {
    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/repos')
        .expect(401);
      
      expect(response.body.error).toBe('Authentication required');
    });

    test('should fetch repositories when authenticated', async () => {
      const mockUser = {
        id: '123',
        accessToken: 'mock-token'
      };

      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          owner: { login: 'testuser' },
          description: 'A test repository',
          language: 'JavaScript',
          stargazers_count: 10,
          watchers_count: 5,
          fork: false
        }
      ];

      // Mock the Octokit instance
      const { Octokit } = require('@octokit/rest');
      const mockOctokit = {
        rest: {
          repos: {
            listForAuthenticatedUser: jest.fn().mockResolvedValue({ data: mockRepos })
          }
        }
      };
      Octokit.mockImplementation(() => mockOctokit);

      // Mock authenticated request
      const response = await request(app)
        .get('/api/repos')
        .set('Cookie', 'connect.sid=test-session')
        .expect(200);
      
      expect(response.body).toEqual(mockRepos);
    });
  });

  describe('GET /api/repos/:owner/:repo/pulls', () => {
    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/repos/testuser/test-repo/pulls')
        .expect(401);
      
      expect(response.body.error).toBe('Authentication required');
    });

    test('should fetch pull requests when authenticated', async () => {
      const mockUser = {
        id: '123',
        accessToken: 'mock-token'
      };

      const mockPulls = [
        {
          id: 1,
          number: 1,
          title: 'Test PR',
          body: 'Test description',
          user: { login: 'testuser' },
          created_at: '2023-01-01T00:00:00Z',
          comments: 0
        }
      ];

      // Mock the Octokit instance
      const { Octokit } = require('@octokit/rest');
      const mockOctokit = {
        rest: {
          pulls: {
            list: jest.fn().mockResolvedValue({ data: mockPulls })
          }
        }
      };
      Octokit.mockImplementation(() => mockOctokit);

      // Mock authenticated request
      const response = await request(app)
        .get('/api/repos/testuser/test-repo/pulls')
        .set('Cookie', 'connect.sid=test-session')
        .expect(200);
      
      expect(response.body).toEqual(mockPulls);
    });
  });
});
