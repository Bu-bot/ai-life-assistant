// frontend/src/components/RecordingSection.js
import React, { useState, useRef } from 'react';

const RecordingSection = ({ recordings, onNewRecording, onDeleteRecording }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Ready to record');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        processRecording(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('Recording... speak now!');
      
      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 120000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setStatus(`Microphone error: ${error.message}`);
      // Suggest text input if voice fails
      setTimeout(() => {
        setStatus('Try using text input instead →');
        setInputMode('text');
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus('Processing recording...');
    }
  };

  const processRecording = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('https://ai-life-assistant-api-production.up.railway.app/api/recordings', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newRecording = await response.json();
        onNewRecording(newRecording);
        setStatus('Recording saved successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recording');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      setStatus(`Processing Error: ${error.name} - ${error.message}`);
    }

    setTimeout(() => setStatus('Ready to record'), 3000);
  };

  const submitTextInput = async () => {
    if (!textInput.trim()) return;

    setIsSubmitting(true);
    setStatus('Saving text...');

    try {
      const response = await fetch('https://ai-life-assistant-api-production.up.railway.app/api/recordings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textInput.trim() })
      });

      if (response.ok) {
        const newRecording = await response.json();
        onNewRecording(newRecording);
        setTextInput('');
        setStatus('Text saved successfully!');
        setTimeout(() => setStatus('Ready to record'), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save text');
      }
    } catch (error) {
      console.error('Error saving text:', error);
      setStatus(`Error: ${error.message}`);
      setTimeout(() => setStatus('Ready to record'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    submitTextInput();
  };

  const handleTextKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitTextInput();
    }
  };

  const deleteRecording = async (recordingId) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(recordingId));

    try {
      const response = await fetch(`https://ai-life-assistant-api-production.up.railway.app/api/recordings/${recordingId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onDeleteRecording(recordingId);
        setStatus('Recording deleted successfully!');
        setTimeout(() => setStatus('Ready to record'), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete recording');
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      setStatus(`Delete error: ${error.message}`);
      setTimeout(() => setStatus('Ready to record'), 3000);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="recording-section">
      <h2 className="section-title">
        📹 Quick Capture
      </h2>

      {/* Input Mode Switcher */}
      <div className="input-mode-switcher">
        <button 
          className={`mode-btn ${inputMode === 'voice' ? 'active' : ''}`}
          onClick={() => setInputMode('voice')}
        >
          🎤 Voice
        </button>
        <button 
          className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
        >
          ✏️ Text
        </button>
      </div>
      
      {/* Voice Recording Mode */}
      {inputMode === 'voice' && (
        <div className="recording-controls">
          <button 
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={status.includes('Processing')}
          >
            {isRecording ? '⏹️ Stop' : '🎤 Record'}
          </button>
          
          <div className="status">
            {status}
          </div>
        </div>
      )}

      {/* Text Input Mode */}
      {inputMode === 'text' && (
        <div className="text-input-controls">
          <form onSubmit={handleTextSubmit}>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleTextKeyPress}
              placeholder="Type your thoughts, tasks, or memories here... (Ctrl+Enter to save)"
              className="text-input-area"
              rows="4"
              disabled={isSubmitting}
            />
            
            <div className="text-input-footer">
              <button 
                type="submit" 
                className="text-submit-btn"
                disabled={!textInput.trim() || isSubmitting}
              >
                {isSubmitting ? '💾 Saving...' : '💾 Save Text'}
              </button>
              
              <div className="text-hint">
                💡 Press Ctrl+Enter to save quickly
              </div>
            </div>
          </form>
          
          <div className="status">
            {status}
          </div>
        </div>
      )}
      
      <div className="recordings-list">
        <h3>Recent Recordings ({recordings.length})</h3>
        
        {recordings.length > 0 ? (
          recordings.slice(0, 10).map((recording) => (
            <div key={recording.id} className="recording-item">
              <div className="recording-header">
                <div className="recording-time">
                  {formatTimestamp(recording.timestamp)}
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deleteRecording(recording.id)}
                  disabled={deletingIds.has(recording.id)}
                  title="Delete recording"
                >
                  {deletingIds.has(recording.id) ? '⏳' : '🗑️'}
                </button>
              </div>
              
              <div className="recording-text">
                {recording.text}
              </div>
              
              {recording.entities && Object.keys(recording.entities).length > 0 && (
                <div className="recording-entities">
                  {Object.entries(recording.entities).map(([key, values]) => (
                    values && values.length > 0 && (
                      <span key={key} className={`entity-tag ${key}`}>
                        {key}: {Array.isArray(values) ? values.join(', ') : values}
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-recordings">
            <p>📝 No recordings yet</p>
            <p>Use voice recording or text input to start capturing your thoughts and memories!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingSection;