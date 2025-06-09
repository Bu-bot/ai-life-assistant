// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import RecordingSection from './components/RecordingSection';
import ChatSection from './components/ChatSection';
import './App.css';

function App() {
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

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

  // Main app
  return (
    <div className="App">
      <header className="app-header">
        <h1>🎙️ AI Life Assistant</h1>
        <p>Capture your life, query your memories</p>
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </header>
      
      <main className="main-content">
        <div className="content-grid">
          <RecordingSection 
            recordings={recordings}
            onNewRecording={addRecording}
            onDeleteRecording={deleteRecording}
          />
          <ChatSection recordings={recordings} />
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Your personal AI assistant - {recordings.length} memories captured</p>
      </footer>
    </div>
  );
}

export default App;