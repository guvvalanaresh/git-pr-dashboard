import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Github, LogOut, GitBranch, Star, Eye, User, Users, GitFork, ChevronDown, Moon, Sun } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [repositories, setRepositories] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    const isLight = savedTheme === 'light';
    setIsDarkMode(!isLight);
    document.documentElement.classList.toggle('light', isLight);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reposResponse, statsResponse, userResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/repos`, {withCredentials: true}),
        axios.get(`${import.meta.env.VITE_API_URL}/api/repos/stats`, {withCredentials: true}),
        axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {withCredentials: true})
      ]);
      
      setRepositories(reposResponse.data);
      setUserStats(statsResponse.data);
      setUserInfo(userResponse.data);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/logout`, {}, {
        withCredentials: true
      });
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/');
    }
  };

  const handleRepoClick = (repo) => {
    navigate(`/repo/${repo.owner.login}/${repo.name}`);
  };

  const handleFilesClick = (repo) => {
    navigate(`/repo/${repo.owner.login}/${repo.name}/files`);
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
          <p className="github-text-muted">Loading repositories...</p>
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
              <Button onClick={fetchData} variant="outline">
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
              <Github className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold github-text">GitHub PR Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-3">
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
              
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2"
              >
                {userInfo?.avatar ? (
                  <img 
                    src={userInfo.avatar} 
                    alt="Profile" 
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
                <span className="github-text">{userInfo?.username || 'User'}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-github-surface border border-github-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-github-border">
                      <p className="text-sm font-medium github-text">{userInfo?.displayName || userInfo?.username}</p>
                      <p className="text-xs github-text-muted">@{userInfo?.username}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm github-text hover:bg-github-dark transition-colors flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold github-text mb-2">
            Welcome, {userInfo?.displayName || userInfo?.username || 'User'}! 👋
          </h2>
          <p className="github-text-muted">
            Manage your repositories and pull requests
          </p>
        </div>

        {/* Statistics Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="github-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <GitBranch className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold github-text">{userStats.totalRepos}</span>
                </div>
                <p className="text-sm github-text-muted">Repositories</p>
              </CardContent>
            </Card>
            
            <Card className="github-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-2xl font-bold github-text">{userStats.totalStars}</span>
                </div>
                <p className="text-sm github-text-muted">Total Stars</p>
              </CardContent>
            </Card>
            
            <Card className="github-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <GitFork className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-2xl font-bold github-text">{userStats.totalForks}</span>
                </div>
                <p className="text-sm github-text-muted">Total Forks</p>
              </CardContent>
            </Card>
            
            <Card className="github-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold github-text">{userStats.followers}</span>
                </div>
                <p className="text-sm github-text-muted">Followers</p>
              </CardContent>
            </Card>
            
            <Card className="github-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <User className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="text-2xl font-bold github-text">{userStats.following}</span>
                </div>
                <p className="text-sm github-text-muted">Following</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-xl font-bold github-text mb-2">Your Repositories</h3>
          <p className="github-text-muted">
            Click on a repository to view its pull requests or files
          </p>
        </div>

        {repositories.length === 0 ? (
          <Card className="github-card">
            <CardContent className="text-center p-8">
              <GitBranch className="w-12 h-12 text-github-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold github-text mb-2">No repositories found</h3>
              <p className="github-text-muted">
                You don't have any repositories or they're not accessible.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <Card 
                key={repo.id} 
                className="github-card hover:border-primary transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg github-text truncate">
                        {repo.name}
                      </CardTitle>
                      <CardDescription className="github-text-muted">
                        {repo.owner.login}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {repo.private && (
                        <span className="text-xs bg-github-muted text-github-text px-2 py-1 rounded">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {repo.description && (
                    <p className="github-text-muted text-sm mb-4 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm github-text-muted mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <GitBranch className="w-4 h-4 mr-1" />
                        {repo.language || 'No language'}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {repo.stargazers_count}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {repo.watchers_count}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1 github-button"
                      onClick={() => handleRepoClick(repo)}
                    >
                      View PRs
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleFilesClick(repo)}
                    >
                      View Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
