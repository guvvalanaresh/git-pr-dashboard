import express from 'express';
import request from 'supertest';
import reposRouter from '../routes/repos.js';

// Mock auth middleware
jest.mock('../routes/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { accessToken: 'fake_token' };
    next();
  },
}));

// Mock Octokit
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        repos: {
          listForAuthenticatedUser: jest.fn().mockResolvedValue({
            data: [
              { id: 1, name: 'repo1', fork: false, stargazers_count: 5, forks_count: 2, private: false },
              { id: 2, name: 'repo2', fork: true, stargazers_count: 3, forks_count: 1, private: true },
            ],
          }),
          getBranch: jest.fn(({ branch }) => {
            if (branch === 'validBase' || branch === 'validHead') return Promise.resolve({ data: {} });
            return Promise.reject({ status: 404 });
          }),
          get: jest.fn(() => Promise.resolve({ data: { default_branch: 'main' } })),
          listBranches: jest.fn(() => Promise.resolve({ data: [{ name: 'main', protected: true }] })),
          getContent: jest.fn(() => Promise.resolve({ data: ['file1.js', 'file2.js'] })),
        },
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: { followers: 10, following: 5 },
          }),
        },
        pulls: {
          list: jest.fn().mockResolvedValue({ data: [{ id: 100, state: 'open' }] }),
          create: jest.fn().mockResolvedValue({ id: 101, title: 'PR title' }),
          get: jest.fn().mockResolvedValue({ id: 102, title: 'Specific PR' }),
        },
        git: {
          getTree: jest.fn().mockResolvedValue({ data: { tree: [{ path: 'file1.js' }, { path: 'dir/file2.js' }] } }),
        },
        issues: {
          createComment: jest.fn().mockResolvedValue({ data: { id: 1, body: 'Comment', user: { login: 'user' }, created_at: new Date().toISOString() } }),
          listComments: jest.fn().mockResolvedValue({ data: [{ id: 1, body: 'Test comment' }] }),
        },
      },
    })),
  };
});

const app = express();
app.use(express.json());
app.use('/api/repos', reposRouter);

describe('Repos Routes', () => {

  it('GET /api/repos should return repositories excluding forks', async () => {
    const res = await request(app).get('/api/repos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'repo1', fork: false, stargazers_count: 5, forks_count: 2, private: false }]);
  });

  it('GET /api/repos/stats should return correct user stats', async () => {
    const res = await request(app).get('/api/repos/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalRepos).toBe(2);
    expect(res.body.totalStars).toBe(8);
    expect(res.body.totalForks).toBe(3);
    expect(res.body.followers).toBe(10);
    expect(res.body.following).toBe(5);
    expect(res.body.publicRepos).toBe(1);
    expect(res.body.privateRepos).toBe(1);
  });

  it('GET /api/repos/:owner/:repo/pulls should return combined pulls', async () => {
    const res = await request(app).get('/api/repos/testOwner/testRepo/pulls');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/repos/:owner/:repo/pulls with state=open should return pulls', async () => {
    const res = await request(app).get('/api/repos/testOwner/testRepo/pulls?state=open');
    expect(res.status).toBe(200);
  });

  it('GET /api/repos/:owner/:repo/branches should return branches', async () => {
    const res = await request(app).get('/api/repos/testOwner/testRepo/branches');
    expect(res.status).toBe(200);
    expect(res.body.default_branch).toBe('main');
    expect(res.body.branches).toEqual([{ name: 'main', protected: true }]);
  });

  // it('POST /api/repos/:owner/:repo/pulls should create a pull request', async () => {
  //   const prPayload = { title: 'Test PR', head: 'validHead', base: 'validBase', body: 'Test body' };
  //   const res = await request(app).post('/api/repos/testOwner/testRepo/pulls').send(prPayload);
  //   expect(res.status).toBe(201);
  //   expect(res.body.title).toBe('PR title');
  // });

  it('POST /api/repos/:owner/:repo/pulls should fail with invalid branch', async () => {
    const prPayload = { title: 'Test PR', head: 'invalidHead', base: 'invalidBase' };
    const res = await request(app).post('/api/repos/testOwner/testRepo/pulls').send(prPayload);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid branch selection');
  });

  // it('POST /api/repos/:owner/:repo/pulls should fail if base=head', async () => {
  //   const prPayload = { title: 'PR', head: 'sameBranch', base: 'sameBranch' };
  //   const res = await request(app).post('/api/repos/testOwner/testRepo/pulls').send(prPayload);
  //   expect(res.status).toBe(400);
  //   expect(res.body.error).toBe('Base and head cannot be the same branch');
  // });

  it('GET /api/repos/:owner/:repo/files should return repository tree', async () => {
    const res = await request(app).get('/api/repos/testOwner/testRepo/files');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ path: 'file1.js' }, { path: 'dir/file2.js' }]);
  });

  it('GET /api/repos/:owner/:repo/contents should return repository contents', async () => {
    const res = await request(app).get('/api/repos/testOwner/testRepo/contents');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(['file1.js', 'file2.js']);
  });

  // it('GET /api/repos/:owner/:repo/pulls/:pull_number should return a specific pull request', async () => {
  //   const res = await request(app).get('/api/repos/testOwner/testRepo/pulls/123');
  //   expect(res.status).toBe(200);
  //   expect(res.body.title).toBe('Specific PR');
  // });
});
