// frontend/src/components/RecordingSection.js - Enhanced with Project Selection
import React, { useState, useRef, useEffect } from 'react';
import TaskCompletionModal from './TaskCompletionModal';

const RecordingSection = ({ recordings, onNewRecording, onDeleteRecording }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Ready to record');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [inputMode, setInputMode] = useState('voice');
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [microphoneSupported, setMicrophoneSupported] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [detectedCompletion, setDetectedCompletion] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  
  // Project-related state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const API_BASE = 'https://ai-life-assistant-api-production.up.railway.app';

  // Check if we're on mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  useEffect(() => {
    if (isMobile() && !microphoneSupported) {
      setInputMode('text');
    }
    fetchPendingTasks();
    fetchProjects();
  }, [microphoneSupported]);

  const fetchPendingTasks = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/pending`);
      if (response.ok) {
        const tasks = await response.json();
        setPendingTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects`);
      if (response.ok) {
        const projectData = await response.json();
        setProjects(projectData);
        
        // Set General as default if no project selected
        if (!selectedProject && projectData.length > 0) {
          const generalProject = projectData.find(p => p.name === 'General');
          if (generalProject) {
            setSelectedProject(generalProject);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: `Created from recording interface`,
          color: '#667eea'
        })
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [...prev, newProject]);
        setSelectedProject(newProject);
        setNewProjectName('');
        setShowCreateProject(false);
        setStatus(`✅ Project "${newProject.name}" created!`);
        setTimeout(() => setStatus('Ready to record'), 2000);
      } else {
        const errorData = await response.json();
        setStatus(`❌ Error: ${errorData.error}`);
        setTimeout(() => setStatus('Ready to record'), 3000);
      }
    } catch (error) {
      setStatus('❌ Failed to create project');
      setTimeout(() => setStatus('Ready to record'), 3000);
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Enhanced audio processing to include project
  const processRecording = async (audioBlob, mimeType = 'audio/wav') => {
    try {
      if (audioBlob.size === 0) {
        throw new Error('Recording is empty');
      }

      console.log(`Recording format: ${mimeType}, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      setStatus('📤 Uploading recording...');

      const formData = new FormData();
      
      let filename = 'recording.wav';
      if (audioBlob.type.includes('webm')) {
        filename = 'recording.webm';
      } else if (audioBlob.type.includes('mp4')) {
        filename = 'recording.mp4';
      }
      
      formData.append('audio', audioBlob, filename);
      
      // Add selected project ID if available
      if (selectedProject && selectedProject.id) {
        formData.append('projectId', selectedProject.id.toString());
      }

      const response = await fetch(`${API_BASE}/api/recordings`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newRecording = await response.json();
        onNewRecording(newRecording);
        setStatus('✅ Recording saved successfully!');
        
        // Check for task completion detection
        if (newRecording.taskCompletionDetected && newRecording.taskCompletionDetected.hasCompletion) {
          setDetectedCompletion(newRecording.taskCompletionDetected);
          setShowTaskModal(true);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recording');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      setStatus(`❌ Processing Error: ${error.message}`);
      
      setTimeout(() => {
        setStatus('Try using text input instead →');
        setInputMode('text');
      }, 3000);
    }

    setTimeout(() => setStatus('Ready to record'), 5000);
  };

  // Enhanced text submission to include project
  const submitTextInput = async () => {
    if (!textInput.trim()) return;

    setIsSubmitting(true);
    setStatus('💾 Saving text...');

    try {
      const payload = { text: textInput.trim() };
      
      // Add selected project ID if available
      if (selectedProject && selectedProject.id) {
        payload.projectId = selectedProject.id;
      }

      const response = await fetch(`${API_BASE}/api/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newRecording = await response.json();
        onNewRecording(newRecording);
        setTextInput('');
        setStatus('✅ Text saved successfully!');
        
        if (newRecording.taskCompletionDetected && newRecording.taskCompletionDetected.hasCompletion) {
          setDetectedCompletion(newRecording.taskCompletionDetected);
          setShowTaskModal(true);
        }
        
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

  // [Keep all your existing recording methods - startRecording, stopRecording, etc.]
  const startRecording = async () => {
    let mimeType = 'audio/wav';
    
    try {
      setStatus('Requesting microphone access...');
      
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (!MediaRecorder.isTypeSupported('audio/mp4')) {
          if (!MediaRecorder.isTypeSupported('audio/wav')) {
            throw new Error('No supported audio format found');
          }
        }
      }

      if (isMobile()) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        }
      }

      const options = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
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
        processRecording(audioBlob, mimeType);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
          });
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setStatus('🎤 Recording... tap stop when done');
      
      setTimeout(() => {
        if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 120000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicrophoneSupported(false);
      
      if (error.name === 'NotAllowedError') {
        setStatus('🚫 Microphone permission denied. Please allow microphone access in your browser settings, then refresh and try again.');
      } else if (error.name === 'NotFoundError') {
        setStatus('🎤 No microphone found. Please check your device settings.');
      } else if (error.name === 'NotSupportedError') {
        setStatus('📱 Voice recording not supported on this browser. Using text input instead...');
      } else {
        setStatus(`❌ Microphone error: ${error.message}. Try text input instead →`);
      }
      
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
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const deleteRecording = async (recordingId) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(recordingId));

    try {
      const response = await fetch(`${API_BASE}/api/recordings/${recordingId}`, {
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

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="recording-section">
      <h2 className="section-title">
        📹 Quick Capture
      </h2>

      {/* Project Selector */}
      <div className="project-selector-section">
        <label className="project-label">📁 Project:</label>
        <div className="project-controls">
          <select 
            className="project-select"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const projectId = parseInt(e.target.value);
              const project = projects.find(p => p.id === projectId);
              setSelectedProject(project);
            }}
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.recording_count} recordings)
              </option>
            ))}
          </select>
          
          <button 
            className="new-project-btn"
            onClick={() => setShowCreateProject(true)}
            title="Create new project"
          >
            ➕
          </button>
        </div>
        
        {selectedProject && (
          <div className="selected-project-info">
            <span 
              className="project-color-dot" 
              style={{ backgroundColor: selectedProject.color }}
            ></span>
            Recording to: <strong>{selectedProject.name}</strong>
          </div>
        )}
      </div>

      {/* Quick Create Project */}
      {showCreateProject && (
        <div className="quick-create-project">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name..."
            className="project-name-input"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
            autoFocus
          />
          <button 
            onClick={handleCreateProject}
            disabled={!newProjectName.trim() || isCreatingProject}
            className="create-project-quick-btn"
          >
            {isCreatingProject ? '⏳' : '✅'}
          </button>
          <button 
            onClick={() => {
              setShowCreateProject(false);
              setNewProjectName('');
            }}
            className="cancel-project-btn"
          >
            ❌
          </button>
        </div>
      )}

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

      {/* Mobile hint */}
      {isMobile() && inputMode === 'voice' && (
        <div className="mobile-hint">
          📱 <strong>Tip:</strong> You can also say "{selectedProject?.name}: content" to ensure project assignment
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
          <form onSubmit={(e) => { e.preventDefault(); submitTextInput(); }}>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  submitTextInput();
                }
              }}
              placeholder={`Type your thoughts, tasks, or memories here... (Will be saved to ${selectedProject?.name || 'General'} project)`}
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
                {isSubmitting ? '💾 Saving...' : `💾 Save to ${selectedProject?.name || 'General'}`}
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
      
      {/* Recordings List - Enhanced with project info */}
      <div className="recordings-list">
        <h3>Recent Recordings ({recordings.length})</h3>
        
        {recordings.length > 0 ? (
          recordings.slice(0, 10).map((recording) => (
            <div key={recording.id} className="recording-item">
              <div className="recording-header">
                <div className="recording-meta">
                  <div className="recording-time">
                    {new Date(recording.timestamp).toLocaleString()}
                  </div>
                  {recording.project && (
                    <div className="recording-project">
                      <span 
                        className="project-color-dot" 
                        style={{ backgroundColor: recording.project.color }}
                      ></span>
                      {recording.project.name}
                    </div>
                  )}
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

      <TaskCompletionModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        detectedCompletion={detectedCompletion}
        pendingTasks={pendingTasks}
        onTaskCompleted={(taskId) => {
          setPendingTasks(prev => prev.filter(task => task.id !== taskId));
          setStatus('✅ Task marked as completed!');
          setTimeout(() => setStatus('Ready to record'), 2000);
        }}
      />
    </div>
  );
};

export default RecordingSection;