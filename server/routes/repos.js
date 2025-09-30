import express from 'express';
import { Octokit } from '@octokit/rest';
import { requireAuth } from './auth.js';

const router = express.Router();

// Middleware to create authenticated Octokit instance
const createOctokit = (req, res, next) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.octokit = new Octokit({
    auth: req.user.accessToken,
  });
  
  next();
};

// Get user repositories
router.get('/', requireAuth, createOctokit, async (req, res) => {
  try {
    const { data: repos } = await req.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    // Filter out forks if needed
    const filteredRepos = repos.filter(repo => !repo.fork);

    res.json(filteredRepos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repositories',
      message: error.message 
    });
  }
});

// Get user statistics
router.get('/stats', requireAuth, createOctokit, async (req, res) => {
  try {
    // Get user info
    const { data: user } = await req.octokit.rest.users.getAuthenticated();
    
    // Get all repositories
    const { data: repos } = await req.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    // Calculate statistics
    const stats = {
      totalRepos: repos.length,
      totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      followers: user.followers,
      following: user.following,
      publicRepos: repos.filter(repo => !repo.private).length,
      privateRepos: repos.filter(repo => repo.private).length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user statistics',
      message: error.message 
    });
  }
});

// Get pull requests for a specific repository (with state filtering)
router.get('/:owner/:repo/pulls', requireAuth, createOctokit, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'all' } = req.query; // Allow filtering by state
    
    if (state === 'all') {
      // Fetch both open and closed pull requests
      const [openPulls, closedPulls] = await Promise.all([
        req.octokit.rest.pulls.list({
          owner,
          repo,
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 50,
        }),
        req.octokit.rest.pulls.list({
          owner,
          repo,
          state: 'closed',
          sort: 'updated',
          direction: 'desc',
          per_page: 50,
        })
      ]);

      // Combine and sort all pull requests
      const allPulls = [...openPulls.data, ...closedPulls.data]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 100); // Limit to 100 most recent

      res.json(allPulls);
    } else {
      // Fetch pull requests for specific state
      const { data: pulls } = await req.octokit.rest.pulls.list({
        owner,
        repo,
        state: state,
        sort: state === 'open' ? 'created' : 'updated',
        direction: 'desc',
        per_page: 100,
      });

      res.json(pulls);
    }
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pull requests',
      message: error.message 
    });
  }
});

// List branches for a repository (to aid PR creation)
router.get('/:owner/:repo/branches', requireAuth, createOctokit, async (req, res) => {
  try {
    const { owner, repo } = req.params;

    const [{ data: repoInfo }, { data: branches }] = await Promise.all([
      req.octokit.rest.repos.get({ owner, repo }),
      req.octokit.rest.repos.listBranches({ owner, repo, per_page: 100 })
    ]);

    res.json({
      default_branch: repoInfo.default_branch,
      branches: branches.map(b => ({ name: b.name, protected: b.protected }))
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches', message: error.message });
  }
});

// Create a pull request
router.post('/:owner/:repo/pulls', requireAuth, createOctokit, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { title, head, base, body, draft = false, maintainer_can_modify = true } = req.body || {};

    if (!title || !head || !base) {
      return res.status(400).json({ error: 'Missing required fields: title, head, base' });
    }

    // Validate that base and head branches exist in the repo
    const [baseOk, headOk] = await Promise.all([
      req.octokit.rest.repos.getBranch({ owner, repo, branch: base }).then(() => true).catch(() => false),
      req.octokit.rest.repos.getBranch({ owner, repo, branch: head }).then(() => true).catch(() => false),
    ]);

    if (!baseOk || !headOk) {
      return res.status(400).json({
        error: 'Invalid branch selection',
        message: `${!baseOk ? 'Base' : ''}${!baseOk && !headOk ? ' and ' : ''}${!headOk ? 'Head' : ''} branch not found in ${owner}/${repo}`,
      });
    }

    if (base === head) {
      return res.status(400).json({ error: 'Base and head cannot be the same branch' });
    }

    const { data: pr } = await req.octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
      draft,
      maintainer_can_modify,
    });

    res.status(201).json(pr);
  } catch (error) {
    console.error('Error creating pull request:', error);
    const status = error?.status || 500;
    res.status(status).json({ 
      error: 'Failed to create pull request',
      message: error.message 
    });
  }
});

// Get repository files/tree
router.get('/:owner/:repo/files', requireAuth, createOctokit, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { path = '', recursive = 'false' } = req.query;
    
    const { data: tree } = await req.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: recursive === 'true',
    });

    // Filter by path if specified
    const filteredTree = path 
      ? tree.tree.filter(item => item.path.startsWith(path))
      : tree.tree;

    res.json(filteredTree);
  } catch (error) {
    console.error('Error fetching repository files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repository files',
      message: error.message 
    });
  }
});

// Get repository contents (files and folders)
router.get('/:owner/:repo/contents', requireAuth, createOctokit, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { path = '' } = req.query;
    
    const { data: contents } = await req.octokit.rest.repos.getContent({
      owner,
      repo,
      path: path,
    });

    res.json(contents);
  } catch (error) {
    console.error('Error fetching repository contents:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repository contents',
      message: error.message 
    });
  }
});

// Get a specific pull request
router.get('/:owner/:repo/pulls/:pull_number', requireAuth, createOctokit, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    
    const { data: pull } = await req.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: parseInt(pull_number),
    });

    res.json(pull);
  } catch (error) {
    console.error('Error fetching pull request:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pull request',
      message: error.message 
    });
  }
});

export default router;
