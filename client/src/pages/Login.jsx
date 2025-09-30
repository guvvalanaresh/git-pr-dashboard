import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Github, Moon, Sun } from 'lucide-react';

const Login = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    const isLight = savedTheme === 'light';
    setIsDarkMode(!isLight);
    document.documentElement.classList.toggle('light', isLight);
  }, []);

  const handleGitHubLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/github`;
  };

  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    const useLight = !newIsDark;
    localStorage.setItem('theme', useLight ? 'light' : 'dark');
    document.documentElement.classList.toggle('light', useLight);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2"
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-blue-500" />
        )}
      </Button>
      
      <Card className="w-full max-w-md github-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Github data-testid="github-icon" className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold github-text">
            GitHub PR Dashboard
          </CardTitle>
          <CardDescription className="github-text-muted">
            Sign in with GitHub to view your repositories and pull requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGitHubLogin}
            className="w-full github-button"
            size="lg"
          >
            <Github className="w-5 h-5 mr-2" />
            Sign in with GitHub
          </Button>
          <p className="text-xs text-center github-text-muted">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
