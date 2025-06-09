// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import RecordingSection from './components/RecordingSection';
import ChatSection from './components/ChatSection';
import './App.css';

function App() {
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecordings();
  }, []);

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

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading your AI Life Assistant...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎙️ AI Life Assistant</h1>
        <p>Capture your life, query your memories</p>
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