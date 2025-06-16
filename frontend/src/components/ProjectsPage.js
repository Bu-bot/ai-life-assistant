// frontend/src/components/ProjectsPage.js
import React, { useState, useEffect } from 'react';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#667eea'
  });

  const API_BASE = 'https://ai-life-assistant-api-production.up.railway.app';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [...prev, newProject]);
        setShowCreateModal(false);
        setFormData({ name: '', description: '', color: '#667eea' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete the "${projectName}" project? All recordings will be moved to the General project.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        if (result.movedRecordings > 0) {
          alert(`Project deleted successfully. ${result.movedRecordings} recordings moved to General project.`);
        }
      } else {
        setError('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    }
  };

  const handleViewProject = async (projectId) => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/recordings`);
      if (response.ok) {
        const recordings = await response.json();
        setSelectedProject({ id: projectId, recordings });
      }
    } catch (error) {
      console.error('Error fetching project recordings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const predefinedColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];

  if (isLoading) {
    return (
      <div className="projects-loading">
        <div className="loading-spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="header-content">
          <h2>📁 Project Management</h2>
          <p>Organize your recordings by project</p>
        </div>
        <button 
          className="create-project-btn"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ New Project
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <div className="projects-grid">
        {projects.map(project => (
          <div key={project.id} className="project-card">
            <div 
              className="project-color-bar" 
              style={{ backgroundColor: project.color }}
            ></div>
            
            <div className="project-content">
              <div className="project-header">
                <h3 className="project-name">{project.name}</h3>
                <div className="project-actions">
                  <button 
                    className="view-btn"
                    onClick={() => handleViewProject(project.id)}
                    title="View recordings"
                  >
                    👁️
                  </button>
                  {project.name !== 'General' && (
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              <p className="project-description">
                {project.description || 'No description'}
              </p>
              
              <div className="project-stats">
                <span className="recordings-count">
                  📝 {project.recording_count} recordings
                </span>
                <span className="project-date">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="project-form">
              <div className="form-group">
                <label htmlFor="name">Project Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Work, Personal, Warp Speed"
                  required
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description for this project"
                  rows="3"
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">Project Color</label>
                <div className="color-selection">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="color-input"
                  />
                  <div className="color-presets">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-preset ${formData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-btn"
                  disabled={!formData.name.trim() || isCreating}
                >
                  {isCreating ? '⏳ Creating...' : '✅ Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Recordings Modal */}
      {selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content project-recordings-modal">
            <div className="modal-header">
              <h3>Project Recordings</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedProject(null)}
              >
                ×
              </button>
            </div>
            
            <div className="recordings-list">
              {selectedProject.recordings.length > 0 ? (
                selectedProject.recordings.map(recording => (
                  <div key={recording.id} className="recording-item">
                    <div className="recording-time">
                      {new Date(recording.timestamp).toLocaleString()}
                    </div>
                    <div className="recording-text">
                      {recording.text}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-recordings">
                  <p>No recordings in this project yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;