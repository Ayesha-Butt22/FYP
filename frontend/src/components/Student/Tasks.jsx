import React, { useState } from "react";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";
import "./Tasks.css";

/**
 * Tasks Component
 * - Top form (Title, Assign To, Status "Pending", Comments)
 * - Cards below form, left-aligned
 * - Update modal for progress & new comment
 */
export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    assignee: "",
    status: "Pending",
    comments: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [updateData, setUpdateData] = useState({ progress: "", comment: "" });

  const groupMembers = ["Ahmed Ali", "Fatima Khan", "Hassan Raza", "Ayesha Malik", "Bilal Sheikh"];
  const currentUser = "Ahmed Ali";

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.assignee) {
      toastService?.error?.("Please enter Title and select an Assignee");
      return;
    }

    const createdAt = new Date();
    const initialComments = formData.comments.trim()
      ? [{ text: formData.comments.trim(), date: createdAt.toLocaleString(), author: currentUser }]
      : [];

    const newTask = {
      id: Date.now(),
      title: formData.title.trim(),
      createdBy: currentUser,
      createDate: createdAt.toLocaleString(),
      assignedTo: formData.assignee,
      progress: 0,
      comments: initialComments,
    };

    setTasks((p) => [newTask, ...p]);
    setFormData({ title: "", assignee: "", status: "Pending", comments: "" });
    toastService?.success?.("Task created");

    setTimeout(() => {
      const el = document.querySelector(".task-cards-wrapper");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const handleOpenModal = (taskId) => {
    setSelectedTaskId(taskId);
    setUpdateData({ progress: "", comment: "" });
    setModalOpen(true);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData((p) => ({ ...p, [name]: value }));
  };

  const saveUpdate = () => {
    if (updateData.progress === "" || isNaN(Number(updateData.progress))) {
      toastService?.error?.("Please provide a progress percentage (0-100)");
      return;
    }
    const pct = Math.max(0, Math.min(100, Number(updateData.progress)));

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTaskId) return t;
        const newComments = [...t.comments];
        if (updateData.comment.trim()) {
          newComments.push({ text: updateData.comment.trim(), date: new Date().toLocaleString(), author: currentUser });
        }
        return { ...t, progress: pct, comments: newComments };
      })
    );

    setModalOpen(false);
    setSelectedTaskId(null);
    setUpdateData({ progress: "", comment: "" });
    toastService?.success?.("Task updated");
  };

  return (
    <div className="tasks-root">
      <DashboardSectionHeader description="Create tasks and update progress with comments.">
        Manage Tasks
      </DashboardSectionHeader>

      <div className="tasks-container">
        {/* Top form */}
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
              <select name="assignee" value={formData.assignee} onChange={handleFormChange} className="input">
                <option value="">Select member</option>
                {groupMembers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label className="form-label">Status</label>
              <input name="status" value={formData.status} disabled className="input disabled" />
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

        {/* Task cards */}
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

                <button className="btn primary" onClick={() => handleOpenModal(task.id)}>
                  Update Status
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
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
