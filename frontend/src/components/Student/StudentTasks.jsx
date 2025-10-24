import React, { useState } from "react";
import { Box, TextField, Button, Modal, Typography } from "@mui/material";
import { FaCheckCircle, FaComment } from "react-icons/fa";
import DashboardSectionHeader from "./DashboardSectionHeader";

// Dummy data for tasks
const INITIAL_TASKS = [
  {
    id: "task1",
    title: "Develop Project Proposal",
    createdBy: "Student A",
    createDate: "2025-10-20",
    assignedTo: "Student B",
    status: "Pending",
    progress: 10,
    comments: [{ text: "Initial planning done", date: "2025-10-20" }],
  },
  {
    id: "task2",
    title: "Design Database Schema",
    createdBy: "Student C",
    createDate: "2025-10-21",
    assignedTo: "Student D",
    status: "Pending",
    progress: 30,
    comments: [{ text: "Draft schema created", date: "2025-10-21" }],
  },
];

export default function StudentTasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [formData, setFormData] = useState({
    title: "",
    assignee: "",
    status: "Pending",
    comments: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [modalData, setModalData] = useState({ progress: "", comments: "" });

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newTask = {
      id: `task${tasks.length + 1}`,
      title: formData.title,
      createdBy: "Current User", // Replace with actual user data
      createDate: new Date().toISOString().split("T")[0],
      assignedTo: formData.assignee,
      status: "Pending",
      progress: 0,
      comments: formData.comments ? [{ text: formData.comments, date: new Date().toISOString().split("T")[0] }] : [],
    };
    setTasks([...tasks, newTask]);
    setFormData({ title: "", assignee: "", status: "Pending", comments: "" });
  };

  // Handle modal open
  const handleOpenModal = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    setSelectedTaskId(taskId);
    setModalData({ progress: task.progress, comments: "" });
    setOpenModal(true);
  };

  // Handle modal input changes
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle modal save
  const handleModalSave = () => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === selectedTaskId
          ? {
              ...task,
              progress: parseInt(modalData.progress) || task.progress,
              comments: modalData.comments
                ? [...task.comments, { text: modalData.comments, date: new Date().toISOString().split("T")[0] }]
                : task.comments,
            }
          : task
      )
    );
    setOpenModal(false);
    setModalData({ progress: "", comments: "" });
  };

  return (
    <div style={{ paddingBottom: 18 }}>
      <DashboardSectionHeader>Tasks</DashboardSectionHeader>
      <div
        style={{
          color: "#01337a",
          fontSize: "1rem",
          marginBottom: 12,
        }}
      >
        Here you can view and select a supervisor for your project based on their expertise and availability.
      </div>

      {/* Task Creation Form */}
      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{
          background: "#f8fafc",
          border: "2.2px solid #2563eb33",
          borderRadius: "18px",
          boxShadow: "0 2px 12px #2563eb13",
          padding: "30px 20px",
          marginBottom: "38px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "600px",
          margin: "0 auto 38px auto",
        }}
      >
        <TextField
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleFormChange}
          required
          fullWidth
          sx={{ "& .MuiInputBase-root": { fontSize: "1rem", fontWeight: 700 } }}
        />
        <TextField
          label="Assignee"
          name="assignee"
          value={formData.assignee}
          onChange={handleFormChange}
          required
          fullWidth
          sx={{ "& .MuiInputBase-root": { fontSize: "1rem", fontWeight: 700 } }}
        />
        <TextField
          label="Status"
          name="status"
          value={formData.status}
          InputProps={{ readOnly: true }}
          fullWidth
          sx={{ "& .MuiInputBase-root": { fontSize: "1rem", fontWeight: 700, color: "#a16207" } }}
        />
        <TextField
          label="Comments"
          name="comments"
          value={formData.comments}
          onChange={handleFormChange}
          multiline
          rows={3}
          fullWidth
          sx={{ "& .MuiInputBase-root": { fontSize: "1rem", fontWeight: 700 } }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            fontWeight: 900,
            fontSize: 17,
            bgcolor: "#01337a",
            borderRadius: 6,
            py: 1.1,
            "&:hover": { bgcolor: "#2563eb" },
          }}
        >
          Create Task
        </Button>
      </Box>

      {/* Task Cards */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 30,
          justifyContent: "center",
          marginTop: 22,
        }}
      >
        {tasks.length === 0 ? (
          <div style={{ fontSize: "1.15rem", color: "#444", marginTop: 16 }}>
            No tasks available. Create a new task above.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                width: 400,
                background: "#f8fafc",
                border: "2.2px solid #2563eb33",
                borderRadius: "18px",
                boxShadow: "0 2px 12px #2563eb13",
                padding: "32px 24px",
                marginBottom: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 22, color: "#01337a", marginBottom: 8 }}>
                {task.title}
              </div>
              <div style={{ color: "#2563eb", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                Created By: {task.createdBy}
              </div>
              <div style={{ fontWeight: 700, color: "#222", marginBottom: 8 }}>
                Create Date: <span style={{ color: "#01337a" }}>{task.createDate}</span>
              </div>
              <div style={{ fontWeight: 700, color: "#222", marginBottom: 8 }}>
                Assigned To: <span style={{ color: "#01337a" }}>{task.assignedTo}</span>
              </div>
              <div style={{ fontWeight: 700, color: "#222", marginBottom: 8 }}>
                Progress: <span style={{ color: "#16a34a", fontWeight: 900 }}>{task.progress}%</span>
              </div>
              <div style={{ width: "100%", marginBottom: 12, textAlign: "left" }}>
                <div style={{ fontWeight: 800, color: "#01337a", marginBottom: 6 }}>
                  Comments:
                </div>
                {task.comments.length > 0 ? (
                  task.comments.map((comment, index) => (
                    <div
                      key={index}
                      style={{
                        background: "#2563eb11",
                        color: "#2563eb",
                        fontWeight: 700,
                        borderRadius: 8,
                        padding: "8px 12px",
                        marginBottom: 6,
                        fontSize: 14,
                      }}
                    >
                      {comment.text} <br />
                      <span style={{ fontSize: 12, color: "#444" }}>({comment.date})</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#444", fontSize: 14 }}>No comments yet.</div>
                )}
              </div>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => handleOpenModal(task.id)}
                sx={{
                  fontWeight: 900,
                  fontSize: 17,
                  bgcolor: "#01337a",
                  borderRadius: 6,
                  py: 1.1,
                  "&:hover": { bgcolor: "#2563eb" },
                }}
              >
                Update Status
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Update Progress Modal */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="modal-title"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            background: "#f8fafc",
            border: "2.2px solid #2563eb33",
            borderRadius: "18px",
            boxShadow: "0 2px 12px #2563eb13",
            padding: "30px 20px",
            width: 400,
            maxWidth: "90%",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <Typography id="modal-title" variant="h6" sx={{ fontWeight: 900, color: "#01337a" }}>
            Update Task Progress
          </Typography>
          <TextField
            label="Progress (%)"
            name="progress"
            type="number"
            value={modalData.progress}
            onChange={handleModalChange}
            fullWidth
            inputProps={{ min: 0, max: 100 }}
            sx={{ "& .MuiInputBase-root": { fontSize: "1rem", fontWeight: 700 } }}
          />
          <TextField
            label="Comments"
            name="comments"
            value={modalData.comments}
            onChange={handleModalChange}
            multiline
            rows={3}
            fullWidth
            sx={{ "& .MuiInputBase-root": { fontSize: "1rem", fontWeight: 700 } }}
          />
          <Button
            variant="contained"
            onClick={handleModalSave}
            fullWidth
            sx={{
              fontWeight: 900,
              fontSize: 17,
              bgcolor: "#01337a",
              borderRadius: 6,
              py: 1.1,
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            Save
          </Button>
        </Box>
      </Modal>
    </div>
  );
}