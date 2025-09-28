import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import commentRoutes from '../routes/comments.js';
import { requireAuth } from '../routes/auth.js';

// Mock Octokit
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      issues: {
        createComment: jest.fn(),
        listComments: jest.fn(),
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
  
  app.use('/api/repos', commentRoutes);
  
  return app;
};

describe('Comment Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('POST /api/repos/:owner/:repo/pulls/:pull_number/comments', () => {
    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/repos/testuser/test-repo/pulls/1/comments')
        .send({ body: 'Test comment' })
        .expect(401);
      
      expect(response.body.error).toBe('Authentication required');
    });

    test('should return 400 when comment body is missing', async () => {
      const mockUser = {
        id: '123',
        accessToken: 'mock-token'
      };

      // Mock authenticated request
      const response = await request(app)
        .post('/api/repos/testuser/test-repo/pulls/1/comments')
        .send({})
        .set('Cookie', 'connect.sid=test-session')
        .expect(400);
      
      expect(response.body.error).toBe('Comment body is required');
    });

    test('should create comment when authenticated', async () => {
      const mockUser = {
        id: '123',
        accessToken: 'mock-token'
      };

      const mockComment = {
        id: 1,
        body: 'Test comment',
        user: { login: 'testuser' },
        created_at: '2023-01-01T00:00:00Z'
      };

      // Mock the Octokit instance
      const { Octokit } = require('@octokit/rest');
      const mockOctokit = {
        rest: {
          issues: {
            createComment: jest.fn().mockResolvedValue({ data: mockComment })
          }
        }
      };
      Octokit.mockImplementation(() => mockOctokit);

      // Mock authenticated request
      const response = await request(app)
        .post('/api/repos/testuser/test-repo/pulls/1/comments')
        .send({ body: 'Test comment' })
        .set('Cookie', 'connect.sid=test-session')
        .expect(200);
      
      expect(response.body.message).toBe('Comment added successfully');
      expect(response.body.comment).toEqual({
        id: mockComment.id,
        body: mockComment.body,
        user: mockComment.user,
        created_at: mockComment.created_at
      });
    });

    test('should handle permission denied error', async () => {
      const mockUser = {
        id: '123',
        accessToken: 'mock-token'
      };

      // Mock the Octokit instance
      const { Octokit } = require('@octokit/rest');
      const mockOctokit = {
        rest: {
          issues: {
            createComment: jest.fn().mockRejectedValue({ status: 403 })
          }
        }
      };
      Octokit.mockImplementation(() => mockOctokit);

      // Mock authenticated request
      const response = await request(app)
        .post('/api/repos/testuser/test-repo/pulls/1/comments')
        .send({ body: 'Test comment' })
        .set('Cookie', 'connect.sid=test-session')
        .expect(403);
      
      expect(response.body.error).toBe('Permission denied');
    });
  });

  describe('GET /api/repos/:owner/:repo/pulls/:pull_number/comments', () => {
    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/repos/testuser/test-repo/pulls/1/comments')
        .expect(401);
      
      expect(response.body.error).toBe('Authentication required');
    });

    test('should fetch comments when authenticated', async () => {
      const mockUser = {
        id: '123',
        accessToken: 'mock-token'
      };

      const mockComments = [
        {
          id: 1,
          body: 'Test comment',
          user: { login: 'testuser' },
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      // Mock the Octokit instance
      const { Octokit } = require('@octokit/rest');
      const mockOctokit = {
        rest: {
          issues: {
            listComments: jest.fn().mockResolvedValue({ data: mockComments })
          }
        }
      };
      Octokit.mockImplementation(() => mockOctokit);

      // Mock authenticated request
      const response = await request(app)
        .get('/api/repos/testuser/test-repo/pulls/1/comments')
        .set('Cookie', 'connect.sid=test-session')
        .expect(200);
      
      expect(response.body).toEqual(mockComments);
    });
  });
});
