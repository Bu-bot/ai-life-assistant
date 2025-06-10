// frontend/src/components/RecordingSection.js
import React, { useState, useRef } from 'react';

const RecordingSection = ({ recordings, onNewRecording, onDeleteRecording }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Ready to record');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [microphoneSupported, setMicrophoneSupported] = useState(true);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Check if we're on mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Enhanced microphone permission and recording for mobile
  const startRecording = async () => {
    let mimeType = 'audio/wav'; // Declare at function scope
    
    try {
      setStatus('Requesting microphone access...');
      
      // Enhanced constraints for mobile compatibility
      const constraints = {
        audio: {
          echoCancellation: false, // Turn off processing that might degrade quality
          noiseSuppression: false,
          autoGainControl: true,
          // Mobile-specific settings
          channelCount: 1,
          sampleRate: 44100, // Higher quality sample rate
          sampleSize: 16
        }
      };

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Force WAV format for mobile to avoid compression issues
      // Check if WAV is supported first (best quality)
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (!MediaRecorder.isTypeSupported('audio/mp4')) {
            throw new Error('No supported audio format found');
          } else {
            mimeType = 'audio/mp4';
          }
        } else {
          mimeType = 'audio/webm';
        }
      }

      const options = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // Higher bitrate for better quality
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        processRecording(audioBlob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
          });
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setStatus(`Recording error: ${event.error.message}`);
        stopRecording();
      };

      // Start recording
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setStatus('🎤 Recording... tap stop when done');
      
      // Auto-stop after 2 minutes for mobile battery conservation
      setTimeout(() => {
        if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 120000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicrophoneSupported(false);
      
      // More helpful error messages for mobile
      if (error.name === 'NotAllowedError') {
        setStatus('🚫 Microphone permission denied. Please allow microphone access in your browser settings, then refresh and try again.');
      } else if (error.name === 'NotFoundError') {
        setStatus('🎤 No microphone found. Please check your device settings.');
      } else if (error.name === 'NotSupportedError') {
        setStatus('📱 Voice recording not supported on this browser. Using text input instead...');
      } else {
        setStatus(`❌ Microphone error: ${error.message}. Try text input instead →`);
      }
      
      // Auto-switch to text mode after error
      setTimeout(() => {
        setInputMode('text');
        setStatus('Use text input below instead of voice recording');
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus('🔄 Processing recording...');
    }
    
    // Clean up stream immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  };

  const processRecording = async (audioBlob) => {
    try {
      // Check if blob has content
      if (audioBlob.size === 0) {
        throw new Error('Recording is empty');
      }

      console.log(`Recording format: ${mimeType}, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

      const formData = new FormData();
      
      // Use appropriate filename based on mime type
      let filename = 'recording.wav';
      if (audioBlob.type.includes('webm')) {
        filename = 'recording.webm';
      } else if (audioBlob.type.includes('mp4')) {
        filename = 'recording.mp4';
      }
      
      formData.append('audio', audioBlob, filename);

      const response = await fetch('https://ai-life-assistant-api-production.up.railway.app/api/recordings', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newRecording = await response.json();
        onNewRecording(newRecording);
        setStatus('✅ Recording saved successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recording');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      setStatus(`❌ Processing Error: ${error.message}`);
      
      // Suggest text input if recording fails
      setTimeout(() => {
        setStatus('Try using text input instead →');
        setInputMode('text');
      }, 3000);
    }

    setTimeout(() => setStatus('Ready to record'), 5000);
  };

  const submitTextInput = async () => {
    if (!textInput.trim()) return;

    setIsSubmitting(true);
    setStatus('💾 Saving text...');

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
        setStatus('✅ Text saved successfully!');
        setTimeout(() => setStatus('Ready to record'), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save text');
      }
    } catch (error) {
      console.error('Error saving text:', error);
      setStatus(`❌ Error: ${error.message}`);
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
    if (e.key === 'Enter' && (e.ctrlKey || e.metaCmd)) {
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
        setStatus('✅ Recording deleted successfully!');
        setTimeout(() => setStatus('Ready to record'), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete recording');
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      setStatus(`❌ Delete error: ${error.message}`);
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

  // Auto-switch to text mode on mobile if voice fails
  React.useEffect(() => {
    if (isMobile() && !microphoneSupported) {
      setInputMode('text');
    }
  }, [microphoneSupported]);

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
          disabled={!microphoneSupported}
        >
          🎤 Voice {!microphoneSupported && '(unavailable)'}
        </button>
        <button 
          className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
        >
          ✏️ Text
        </button>
      </div>

      {/* Mobile-optimized hint */}
      {isMobile() && inputMode === 'voice' && (
        <div className="mobile-hint">
          📱 <strong>Mobile tip:</strong> Grant microphone permission when prompted. If voice recording doesn't work, use text input instead.
        </div>
      )}
      
      {/* Voice Recording Mode */}
      {inputMode === 'voice' && microphoneSupported && (
        <div className="recording-controls">
          <button 
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={status.includes('Processing') || status.includes('Uploading')}
          >
            {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
          </button>
          
          <div className="status">
            {status}
          </div>

          {/* Recording indicator for mobile */}
          {isRecording && (
            <div className="recording-indicator">
              <span className="pulse-dot"></span>
              Recording in progress...
            </div>
          )}
        </div>
      )}

      {/* Text Input Mode */}
      {(inputMode === 'text' || !microphoneSupported) && (
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