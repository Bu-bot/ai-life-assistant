// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import MenuBar from './components/MenuBar';
import RecordingSection from './components/RecordingSection';
import ChatSection from './components/ChatSection';
import './App.css';

function App() {
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentPage, setCurrentPage] = useState('home');

  // Check if already authenticated on load
  useEffect(() => {
    const auth = sessionStorage.getItem('ai-assistant-auth');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecordings();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Get password from environment variable
    const SECRET_PASSWORD = process.env.REACT_APP_AUTH_PASSWORD;
    
    if (password === SECRET_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('ai-assistant-auth', 'authenticated');
      setAuthError('');
    } else {
      setAuthError('Invalid password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ai-assistant-auth');
    setPassword('');
    setCurrentPage('home'); // Reset to home page on logout
  };

  const fetchRecordings = async () => {
    try {
      const response = await fetch('https://ai-life-assistant-api-production.up.railway.app/api/recordings');
      const data = await response.json();
      setRecordings(data);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addRecording = (newRecording) => {
    setRecordings(prev => [newRecording, ...prev]);
  };

  const deleteRecording = (recordingId) => {
    setRecordings(prev => prev.filter(recording => recording.id !== recordingId));
  };

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
  };

  // Render different pages based on currentPage
  const renderPageContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="content-grid">
            <RecordingSection 
              recordings={recordings}
              onNewRecording={addRecording}
              onDeleteRecording={deleteRecording}
            />
            <ChatSection recordings={recordings} />
          </div>
        );

      case 'tasks':
        return (
          <div className="page-content">
            <div className="page-header">
              <h2>📋 Task Management</h2>
              <p>Manage your pending and completed tasks</p>
            </div>
            <div className="placeholder-content">
              <div className="feature-placeholder">
                <h3>🚧 Coming Soon</h3>
                <p>Task management interface will be available here</p>
                <ul>
                  <li>View all pending tasks</li>
                  <li>Mark tasks as complete</li>
                  <li>Edit task details</li>
                  <li>Task completion history</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="page-content">
            <div className="page-header">
              <h2>📊 Life Analytics</h2>
              <p>Insights and patterns from your recordings</p>
            </div>
            <div className="placeholder-content">
              <div className="feature-placeholder">
                <h3>🚧 Coming Soon</h3>
                <p>Analytics dashboard will be available here</p>
                <ul>
                  <li>Most mentioned people</li>
                  <li>Recording frequency patterns</li>
                  <li>Task completion rates</li>
                  <li>Life insights over time</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div className="page-content">
            <div className="page-header">
              <h2>💰 Usage & Costs</h2>
              <p>Track your API usage and application costs</p>
            </div>
            <div className="placeholder-content">
              <div className="feature-placeholder">
                <h3>🚧 Coming Soon</h3>
                <p>Usage tracking dashboard will be available here</p>
                <ul>
                  <li>OpenAI API usage and costs</li>
                  <li>Railway hosting costs</li>
                  <li>Supabase database usage</li>
                  <li>Vercel deployment costs</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="page-content">
            <div className="page-header">
              <h2>⚙️ Settings</h2>
              <p>Configure your AI Life Assistant</p>
            </div>
            <div className="placeholder-content">
              <div className="feature-placeholder">
                <h3>🚧 Coming Soon</h3>
                <p>Settings panel will be available here</p>
                <ul>
                  <li>Recording preferences</li>
                  <li>AI response settings</li>
                  <li>Data export options</li>
                  <li>Privacy controls</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return renderPageContent('home');
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="login-container">
          <div className="login-form">
            <h1>🔒 AI Life Assistant</h1>
            <p>Please enter your password to access your personal AI assistant</p>
            
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="password-input"
                autoFocus
              />
              
              {authError && (
                <div className="auth-error">
                  {authError}
                </div>
              )}
              
              <button type="submit" className="login-btn">
                🔓 Access Assistant
              </button>
            </form>
            
            <div className="login-footer">
              <small>Your personal AI assistant - secure and private</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading your AI Life Assistant...</p>
      </div>
    );
  }

  // Main app with menu
  return (
    <div className="App">
      <MenuBar 
        currentPage={currentPage}
        onPageChange={handlePageChange}
        recordingsCount={recordings.length}
      />
      
      <main className="main-content">
        {renderPageContent()}
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <p>Your personal AI assistant - {recordings.length} memories captured</p>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;