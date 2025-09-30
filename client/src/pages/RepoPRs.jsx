import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Github, ArrowLeft, MessageSquare, User, Calendar, GitBranch, CheckCircle, XCircle, GitMerge, Moon, Sun, Plus } from 'lucide-react';
import axios from 'axios';

const RepoPRs = () => {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPR, setSelectedPR] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'closed'
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [newPR, setNewPR] = useState({ title: '', base: 'main', head: '', body: '' });
  const [creatingPR, setCreatingPR] = useState(false);
  const [branches, setBranches] = useState({ default_branch: 'main', branches: [] });

  useEffect(() => {
    fetchPullRequests();
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    const isLight = savedTheme === 'light';
    setIsDarkMode(!isLight);
    document.documentElement.classList.toggle('light', isLight);
    // Fetch branches for PR creation
    (async () => {
      try {
        const resp = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/repos/${owner}/${repo}/branches`, { withCredentials: true });
        setBranches(resp.data);
        setNewPR((prev) => ({ ...prev, base: resp.data.default_branch }));
      } catch (e) {
        console.error('Failed to load branches', e);
      }
    })();
  }, [owner, repo, filter]);

  const fetchPullRequests = async () => {
    try {
      setLoading(true);
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/repos/${owner}/${repo}/pulls?state=${filter}`;
      
      const response = await axios.get(url, { withCredentials: true });
      setPullRequests(response.data);
    } catch (err) {
      setError('Failed to fetch pull requests');
      console.error('Error fetching pull requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (prNumber) => {
    if (!comment.trim()) return;

    try {
      setSubmittingComment(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
        { body: comment },
        { withCredentials: true }
      );
      setComment('');
      setSelectedPR(null);
      // Show success message or refresh data
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPRStatus = (pr) => {
    if (pr.state === 'open') {
      return { status: 'open', icon: GitBranch, color: 'text-green-500', bgColor: 'bg-green-100' };
    } else if (pr.merged_at) {
      return { status: 'merged', icon: GitMerge, color: 'text-purple-500', bgColor: 'bg-purple-100' };
    } else {
      return { status: 'closed', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100' };
    }
  };

  const canComment = (pr) => {
    return pr.state === 'open';
  };

  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    const useLight = !newIsDark;
    localStorage.setItem('theme', useLight ? 'light' : 'dark');
    document.documentElement.classList.toggle('light', useLight);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="github-text-muted">Loading pull requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <Card className="w-full max-w-md github-card">
          <CardContent className="text-center p-6">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchPullRequests} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Github className="w-6 h-6 text-primary mr-3" />
              <h1 className="text-lg font-semibold github-text">
                {owner}/{repo} - Pull Requests
              </h1>
            </div>
            
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-500" />
              )}
            </Button>

          {/* Create PR Button */}
          <Button
            size="sm"
            className="ml-2 github-button"
            onClick={() => setShowCreatePR(true)}
            title="Create Pull Request"
          >
            <Plus className="w-4 h-4 mr-2" />
            New PR
          </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create PR Modal */}
        {showCreatePR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg github-card">
              <CardHeader>
                <CardTitle className="github-text">Create Pull Request</CardTitle>
                <CardDescription className="github-text-muted">Open a PR from a branch to a base branch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm github-text mb-1">Title</label>
                  <input
                    className="w-full github-input"
                    value={newPR.title}
                    onChange={(e) => setNewPR({ ...newPR, title: e.target.value })}
                    placeholder="Add a title"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm github-text mb-1">Base branch</label>
                    <select
                      className="w-full github-input"
                      value={newPR.base}
                      onChange={(e) => setNewPR({ ...newPR, base: e.target.value })}
                    >
                      {(branches.branches || []).map(b => (
                        <option key={b.name} value={b.name}>{b.name}{b.protected ? ' (protected)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm github-text mb-1">Head branch</label>
                    <select
                      className="w-full github-input"
                      value={newPR.head}
                      onChange={(e) => setNewPR({ ...newPR, head: e.target.value })}
                    >
                      <option value="">Select head branch</option>
                      {(branches.branches || []).map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm github-text mb-1">Description</label>
                  <Textarea
                    placeholder="Write a description..."
                    value={newPR.body}
                    onChange={(e) => setNewPR({ ...newPR, body: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreatePR(false)} disabled={creatingPR}>Cancel</Button>
                  <Button className="github-button" onClick={async () => {
                    if (!newPR.title || !newPR.head || !newPR.base) return;
                    try {
                      setCreatingPR(true);
                      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/repos/${owner}/${repo}/pulls`, newPR, { withCredentials: true });
                      setShowCreatePR(false);
                      setNewPR({ title: '', base: 'main', head: '', body: '' });
                      fetchPullRequests();
                    } catch (err) {
                      console.error('Error creating PR:', err);
                      alert('Failed to create pull request');
                    } finally {
                      setCreatingPR(false);
                    }
                  }} disabled={creatingPR}>
                    {creatingPR ? 'Creating...' : 'Create PR'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="mb-8">
          <h2 className="text-2xl font-bold github-text mb-2">Pull Requests</h2>
          <p className="github-text-muted mb-4">
            View and manage pull requests for this repository
          </p>
          
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All PRs
            </Button>
            <Button
              variant={filter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('open')}
            >
              Open
            </Button>
            <Button
              variant={filter === 'closed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('closed')}
            >
              Closed/Merged
            </Button>
          </div>
        </div>

        {pullRequests.length === 0 ? (
          <Card className="github-card">
            <CardContent className="text-center p-8">
              <GitBranch className="w-12 h-12 text-github-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold github-text mb-2">
                No {filter === 'all' ? '' : filter} pull requests
              </h3>
              <p className="github-text-muted">
                {filter === 'all' 
                  ? "This repository doesn't have any pull requests."
                  : `This repository doesn't have any ${filter} pull requests.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pullRequests.map((pr) => {
              const prStatus = getPRStatus(pr);
              const StatusIcon = prStatus.icon;
              const canAddComment = canComment(pr);
              
              return (
                <Card 
                  key={pr.id} 
                  className={`github-card transition-colors ${
                    canAddComment ? 'cursor-pointer hover:border-primary' : 'cursor-default'
                  }`}
                  onClick={() => canAddComment && setSelectedPR(pr)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg github-text">
                            {pr.title}
                          </CardTitle>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${prStatus.bgColor} ${prStatus.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {prStatus.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm github-text-muted">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {pr.user.login}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(pr.created_at)}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {pr.comments} comments
                          </div>
                          {pr.merged_at && (
                            <div className="flex items-center">
                              <GitMerge className="w-4 h-4 mr-1" />
                              Merged {formatDate(pr.merged_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          #{pr.number}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  {pr.body && (
                    <CardContent>
                      <p className="github-text-muted text-sm line-clamp-3">
                        {pr.body}
                      </p>
                    </CardContent>
                  )}
                  {!canAddComment && (
                    <CardContent>
                      <p className="text-sm text-github-muted italic">
                        Comments cannot be added to {prStatus.status} pull requests
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Comment Modal */}
        {selectedPR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl github-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="github-text">
                    Add Comment to PR #{selectedPR.number}
                  </CardTitle>
                  {(() => {
                    const prStatus = getPRStatus(selectedPR);
                    const StatusIcon = prStatus.icon;
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${prStatus.bgColor} ${prStatus.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {prStatus.status}
                      </span>
                    );
                  })()}
                </div>
                <CardDescription className="github-text-muted">
                  {selectedPR.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write your comment here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[120px] github-input"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPR(null);
                      setComment('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleCommentSubmit(selectedPR.number)}
                    disabled={!comment.trim() || submittingComment}
                    className="github-button"
                  >
                    {submittingComment ? 'Submitting...' : 'Submit Comment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default RepoPRs;
