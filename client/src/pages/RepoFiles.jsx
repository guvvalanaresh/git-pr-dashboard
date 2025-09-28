import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Github, ArrowLeft, File, Folder, Code, Image, FileText, Archive } from 'lucide-react';
import axios from 'axios';

const RepoFiles = () => {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    fetchFiles();
  }, [owner, repo, currentPath]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/repos/${owner}/${repo}/contents?path=${currentPath}`;
      
      const response = await axios.get(url, { withCredentials: true });
      setFiles(Array.isArray(response.data) ? response.data : [response.data]);
    } catch (err) {
      setError('Failed to fetch repository files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    if (file.type === 'dir') {
      return <Folder className="w-4 h-4 text-blue-500" />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="w-4 h-4 text-yellow-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-green-500" />;
      case 'md':
      case 'txt':
      case 'json':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <Archive className="w-4 h-4 text-purple-500" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileClick = (file) => {
    if (file.type === 'dir') {
      setCurrentPath(file.path);
    } else {
      // For files, you could open them in a modal or new tab
      window.open(file.html_url, '_blank');
    }
  };

  const handleBackClick = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      setCurrentPath(parentPath);
    } else {
      navigate(`/repo/${owner}/${repo}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="github-text-muted">Loading files...</p>
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
            <Button onClick={fetchFiles} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-github-dark">
      {/* Header */}
      <header className="border-b border-github-border bg-github-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Github className="w-6 h-6 text-primary mr-3" />
            <h1 className="text-lg font-semibold github-text">
              {owner}/{repo} - Files
            </h1>
            {currentPath && (
              <span className="ml-2 text-sm github-text-muted">
                / {currentPath}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold github-text mb-2">Repository Files</h2>
          <p className="github-text-muted">
            Browse the files and folders in this repository
          </p>
        </div>

        {files.length === 0 ? (
          <Card className="github-card">
            <CardContent className="text-center p-8">
              <File className="w-12 h-12 text-github-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold github-text mb-2">No files found</h3>
              <p className="github-text-muted">
                This directory appears to be empty.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <Card 
                key={index}
                className="github-card cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleFileClick(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div>
                        <h3 className="github-text font-medium">
                          {file.name}
                        </h3>
                        {file.type === 'file' && (
                          <p className="text-sm github-text-muted">
                            {formatFileSize(file.size)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm github-text-muted">
                      {file.type === 'dir' ? 'Directory' : 'File'}
                    </div>
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

export default RepoFiles;
