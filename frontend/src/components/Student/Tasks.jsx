import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";
import "./Tasks.css";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    assignee: "",
    progress: "0", // Changed from status to progress, default 0
    comments: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [updateData, setUpdateData] = useState({ progress: "", comment: "" });
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  // Fetch group members on component mount
  useEffect(() => {
    fetchGroupMembers();
    fetchTasks();
  }, []);

  const fetchGroupMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks/group-members`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Format: "Name (Email)"
        const memberStrings = data.members.map(member => member.display);
        setGroupMembers(memberStrings);
      } else {
        // Fallback if API fails
        toastService?.error?.(data.message || "Failed to load group members");
        setGroupMembers([
          "Ahmed Ali (ahmed@example.com)",
          "Fatima Khan (fatima@example.com)",
          "Hassan Raza (hassan@example.com)",
          "Ayesha Malik (ayesha@example.com)",
          "Bilal Sheikh (bilal@example.com)"
        ]);
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
      // Fallback data
      setGroupMembers([
        "Ahmed Ali (ahmed@example.com)",
        "Fatima Khan (fatima@example.com)",
        "Hassan Raza (hassan@example.com)",
        "Ayesha Malik (ayesha@example.com)",
        "Bilal Sheikh (bilal@example.com)"
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
      } else {
        toastService?.error?.(data.message || "Failed to load tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toastService?.error?.("Failed to load tasks from server");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.assignee) {
      toastService?.error?.("Please enter Title and select an Assignee");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          assignee: formData.assignee,
          comments: formData.comments.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add new task to state
        setTasks(prev => [data.task, ...prev]);
        
        // Reset form
        setFormData({ 
          title: "", 
          assignee: "", 
          progress: "0", // Reset to 0
          comments: "" 
        });
        
        toastService?.success?.("Task created successfully");

        setTimeout(() => {
          const el = document.querySelector(".task-cards-wrapper");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      } else {
        toastService?.error?.(data.message);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toastService?.error?.("Failed to create task");
    }
  };

  const handleOpenModal = (taskId) => {
    setSelectedTaskId(taskId);
    const task = tasks.find(t => t.id === taskId);
    setUpdateData({ 
      progress: task?.progress?.toString() || "0", // Default 0 if empty
      comment: "" 
    });
    setModalOpen(true);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({ ...prev, [name]: value }));
  };

  const saveUpdate = async () => {
    if (updateData.progress === "" || isNaN(Number(updateData.progress))) {
      toastService?.error?.("Please provide a progress percentage (0-100)");
      return;
    }
    
    const pct = Math.max(0, Math.min(100, Number(updateData.progress)));

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks/${selectedTaskId}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          progress: pct,
          comment: updateData.comment.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update task in state
        setTasks(prev => prev.map(t => 
          t.id === selectedTaskId ? data.task : t
        ));
        
        setModalOpen(false);
        setSelectedTaskId(null);
        setUpdateData({ progress: "", comment: "" });
        
        toastService?.success?.("Task updated successfully");
      } else {
        toastService?.error?.(data.message);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toastService?.error?.("Failed to update task");
    }
  };

  if (loading) {
    return (
      <div className="tasks-root">
        <DashboardSectionHeader description="Loading group members...">
          Manage Tasks
        </DashboardSectionHeader>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="tasks-root">
      <DashboardSectionHeader description="Create tasks and update progress with comments.">
        Manage Tasks
      </DashboardSectionHeader>

      <div className="tasks-container">
        {/* Top form - Status changed to Progress with default 0 */}
        <form className="task-form two-column" onSubmit={handleSubmit}>
          <div className="left-col">
            <div className="form-row">
              <label className="form-label">Task Title *</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Enter task title"
                className="input"
              />
            </div>

            <div className="form-row">
              <label className="form-label">Assign To *</label>
              <select 
                name="assignee" 
                value={formData.assignee} 
                onChange={handleFormChange} 
                className="input"
              >
                <option value="">Select member</option>
                {groupMembers.map((member, index) => (
                  <option key={index} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label className="form-label">Initial Progress %</label>
              <input 
                name="progress" 
                value="0" 
                disabled 
                className="input disabled" 
              />
            </div>
          </div>

          <div className="right-col">
            <label className="form-label">Comments</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleFormChange}
              placeholder="Enter Comments"
              rows={8}
              className="input large-textarea"
            />
          </div>

          <div className="form-row form-actions full-width">
            <button type="submit" className="create-btn">Create Task</button>
          </div>
        </form>

        {/* Task cards - EXACTLY SAME AS BEFORE */}
        <div className="task-cards-wrapper">
          {tasks.length === 0 ? (
            <div className="no-tasks-note">No tasks available. Create a new task above.</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="task-card-inline">
                <div className="task-card-title">{task.title}</div>
                <div className="task-card-info">Created By: <span>{task.createdBy}</span></div>
                <div className="task-card-info">Create Date: <span>{task.createDate}</span></div>
                <div className="task-card-info">Assigned To: <span>{task.assignedTo}</span></div>
                <div className="task-card-progress">Progress: <span>{task.progress}%</span></div>

                <div className="task-card-comments">
                  <div className="comments-title">Comments:</div>
                  {task.comments.length ? (
                    task.comments.map((c, idx) => (
                      <div key={idx} className="comment-box">
                        {c.text}
                        <br />
                        <span className="comment-date">({c.date})</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-comments">No comments yet.</div>
                  )}
                </div>

                <button 
                  className="btn primary" 
                  onClick={() => handleOpenModal(task.id)}
                >
                  Update Status
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal - EXACTLY SAME AS BEFORE */}
        {modalOpen && (
          <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <label>Update Progress</label>
                <button className="close" onClick={() => setModalOpen(false)}>✕</button>
              </div>

              <div className="modal-body">
                <label className="form-label">Progress % *</label>
                <input
                  name="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={updateData.progress}
                  onChange={handleUpdateChange}
                  className="input"
                  placeholder="Enter progress percent (0-100)"
                />

                <label className="form-label">Add Comment (Optional)</label>
                <textarea
                  name="comment"
                  value={updateData.comment}
                  onChange={handleUpdateChange}
                  rows={4}
                  placeholder="Describe progress..."
                  className="input textarea"
                />

                <div className="modal-actions">
                  <button className="btn ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button className="btn primary" onClick={saveUpdate}>Save Update</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}