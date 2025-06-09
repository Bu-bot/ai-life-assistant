// frontend/src/components/RecordingSection.js
import React, { useState, useRef } from 'react';

const RecordingSection = ({ recordings, onNewRecording }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Ready to record');
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
  setStatus(`iOS Debug: ${error.name} - ${error.message}`);
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
      
      <div className="recordings-list">
        <h3>Recent Recordings ({recordings.length})</h3>
        
        {recordings.length > 0 ? (
          recordings.slice(0, 10).map((recording) => (
            <div key={recording.id} className="recording-item">
              <div className="recording-time">
                {formatTimestamp(recording.timestamp)}
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
            <p>Press the record button above to start capturing your thoughts and memories!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingSection;