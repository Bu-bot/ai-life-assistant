// frontend/src/components/TaskCompletionModal.js
import React, { useState } from 'react';

const TaskCompletionModal = ({ 
  isOpen, 
  onClose, 
  detectedCompletion, 
  pendingTasks, 
  onTaskCompleted 
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  if (!isOpen || !detectedCompletion) return null;

  // Find potential matching tasks based on keywords
  const findMatchingTasks = () => {
    if (!pendingTasks || pendingTasks.length === 0) return [];
    
    const keywords = detectedCompletion.keywords || [];
    const recordingText = detectedCompletion.recordingText?.toLowerCase() || '';
    
    return pendingTasks.filter(task => {
      const taskText = task.task_description?.toLowerCase() || '';
      
      // Check if any words from the task appear in the recording
      const taskWords = taskText.split(/\s+/).filter(word => word.length > 2);
      const hasWordMatch = taskWords.some(word => recordingText.includes(word));
      
      return hasWordMatch;
    }).slice(0, 3); // Show max 3 potential matches
  };

  const matchingTasks = findMatchingTasks();

  const handleComplete = async () => {
    if (!selectedTaskId) return;
    
    setIsCompleting(true);
    
    try {
      const response = await fetch(`https://ai-life-assistant-api-production.up.railway.app/api/tasks/${selectedTaskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completedByRecordingId: detectedCompletion.recordingId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Task completed:', result);
        onTaskCompleted(selectedTaskId);
        onClose();
      } else {
        console.error('Failed to complete task');
        alert('Failed to mark task as complete. Please try again.');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Error completing task. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = () => {
    setSelectedTaskId(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content task-completion-modal">
        <div className="modal-header">
          <h3>🎯 Task Completion Detected</h3>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="detection-info">
            <p><strong>Recording:</strong> "{detectedCompletion.recordingText}"</p>
            <p><strong>Keywords found:</strong> {detectedCompletion.keywords?.join(', ')}</p>
          </div>

          {matchingTasks.length > 0 ? (
            <div className="task-selection">
              <p><strong>Which task did you complete?</strong></p>
              <div className="task-options">
                {matchingTasks.map(task => (
                  <label key={task.id} className="task-option">
                    <input
                      type="radio"
                      name="selectedTask"
                      value={task.id}
                      checked={selectedTaskId === task.id}
                      onChange={(e) => setSelectedTaskId(parseInt(e.target.value))}
                    />
                    <div className="task-details">
                      <div className="task-description">{task.task_description}</div>
                      <div className="task-meta">
                        Recorded: {new Date(task.recorded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-tasks">
              <p>No matching pending tasks found.</p>
              <p>The completion was detected but couldn't be matched to any existing tasks.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {matchingTasks.length > 0 && (
            <button 
              className="complete-btn" 
              onClick={handleComplete}
              disabled={!selectedTaskId || isCompleting}
            >
              {isCompleting ? '⏳ Marking Complete...' : '✅ Mark as Complete'}
            </button>
          )}
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionModal;