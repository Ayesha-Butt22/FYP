import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Modal,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import "./StudentChecklist.css";

const PREVIEW_ROW_LIMIT = 3;

const DEMO_TEMPLATES = [
  { name: "Template-1", due: "2025-10-25", status: "Pending" },
  { name: "Template-2", due: "2025-10-10", status: "Approved" },
  { name: "Template-3", due: "2025-10-18", status: "Overdue" },
  { name: "Template-4", due: "2025-11-01", status: "Pending" },
  { name: "Template-5", due: "2025-16-01", status: "Pending" },
];

const DEMO_TASKS = [
  { title: "Collect dataset", assignedTo: "Team", status: "In Progress" },
  { title: "Preprocess data", assignedTo: "Member 2", status: "Pending" },
  { title: "Model baseline", assignedTo: "Member 1", status: "Completed" },
  { title: "Prepare slides", assignedTo: "Leader", status: "Pending" },
];

const DEMO_NOTICES = [
  { description: "Final presentation scheduled", posted: "2025-10-12", status: "Active" },
  { description: "Supervisor office hours changed", posted: "2025-09-30", status: "Expired" },
  { description: "Template updates released", posted: "2025-10-01", status: "Active" },
  { description: "Exam announced", posted: "2025-08-20", status: "Expired" },
];

function StatusChip({ status }) {
  const s = (status || "").toString().toLowerCase();
  if (s === "approved" || s === "completed" || s === "active") {
    return <Chip label={status} className="chip chip-success" size="small" />;
  }
  if (s === "overdue" || s === "expired") {
    return <Chip label={status} className="chip chip-danger" size="small" />;
  }
  if (s === "in progress") {
    return <Chip label={status} className="chip chip-info" size="small" />;
  }
  return <Chip label={status} className="chip chip-warning" size="small" />;
}

export default function StudentChecklist({
  templates = DEMO_TEMPLATES,
  tasks = DEMO_TASKS,
  notices = DEMO_NOTICES,
}) {
  const [expanded, setExpanded] = useState({ templates: false, tasks: false, notices: false });
  const [modal, setModal] = useState({ open: false, type: null });

  const openModal = (type) => setModal({ open: true, type });
  const closeModal = () => setModal({ open: false, type: null });

  const templatesPreview = templates.slice(0, PREVIEW_ROW_LIMIT);
  const tasksPreview = tasks.slice(0, PREVIEW_ROW_LIMIT);
  const noticesPreview = notices.slice(0, PREVIEW_ROW_LIMIT);

  const renderTable = (type) => {
    if (type === "templates") {
      return (
        <Table size="small" className="checklist-table">
          <TableHead>
            <TableRow>
              <TableCell>Template Name</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((t, i) => (
              <TableRow key={t.name + i} hover>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.due}</TableCell>
                <TableCell><StatusChip status={t.status} /></TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && <TableRow><TableCell colSpan={3} align="center">No templates assigned.</TableCell></TableRow>}
          </TableBody>
        </Table>
      );
    }
    if (type === "tasks") {
      return (
        <Table size="small" className="checklist-table">
          <TableHead>
            <TableRow>
              <TableCell>Task Title</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((t, i) => (
              <TableRow key={t.title + i} hover>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.assignedTo}</TableCell>
                <TableCell><StatusChip status={t.status} /></TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && <TableRow><TableCell colSpan={3} align="center">No tasks assigned.</TableCell></TableRow>}
          </TableBody>
        </Table>
      );
    }
    if (type === "notices") {
      return (
        <Table size="small" className="checklist-table">
          <TableHead>
            <TableRow>
              <TableCell>Notice</TableCell>
              <TableCell>Posted Date</TableCell>
              {/* Status column removed for notices as requested */}
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.map((n, i) => (
              <TableRow key={n.description + i} hover>
                <TableCell>{n.description}</TableCell>
                <TableCell>{n.posted}</TableCell>
               
              </TableRow>
            ))}
            {notices.length === 0 && <TableRow><TableCell colSpan={2} align="center">No notices.</TableCell></TableRow>}
          </TableBody>
        </Table>
      );
    }
    return null;
  };

  return (
    <Box>
      <DashboardSectionHeader description="Quick overview of your template submissions, assigned tasks, and recent whiteboard notices.">
        Student Checklist
      </DashboardSectionHeader>

      <Box className="checklist-grid">
        {/* Templates */}
        <Box className="checklist-card">
          <Box className="checklist-header">
            <Typography className="checklist-title">Template Submission</Typography>
            <Typography variant="body2" className="checklist-count">{templates.length} total</Typography>
          </Box>

          <Box className="checklist-body">
            <table className="small-table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {templatesPreview.map((t, i) => (
                  <tr key={t.name + i}>
                    <td>{t.name}</td>
                    <td>{t.due}</td>
                    <td><StatusChip status={t.status} /></td>
                  </tr>
                ))}
                {templates.length === 0 && <tr><td colSpan={3} className="empty">No templates assigned.</td></tr>}
              </tbody>
            </table>
          </Box>

          <Box className="checklist-footer">
            
          </Box>
        </Box>

        {/* Tasks */}
        <Box className="checklist-card">
          <Box className="checklist-header">
            <Typography className="checklist-title">Tasks</Typography>
            <Typography variant="body2" className="checklist-count">{tasks.length} total</Typography>
          </Box>

          <Box className="checklist-body">
            <table className="small-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasksPreview.map((t, i) => (
                  <tr key={t.title + i}>
                    <td>{t.title}</td>
                    <td>{t.assignedTo}</td>
                    <td><StatusChip status={t.status} /></td>
                  </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={3} className="empty">No tasks assigned.</td></tr>}
              </tbody>
            </table>
          </Box>

          <Box className="checklist-footer">
            
          </Box>
        </Box>

        {/* Notices (whiteboard) — status column removed */}
        <Box className="checklist-card">
          <Box className="checklist-header">
            <Typography className="checklist-title">Whiteboard </Typography>
            <Typography variant="body2" className="checklist-count">{notices.length} total</Typography>
          </Box>

          <Box className="checklist-body">
            <table className="small-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Posted</th>
                  {/* Status column intentionally removed */}
                </tr>
              </thead>
              <tbody>
                {noticesPreview.map((n, i) => (
                  <tr key={n.description + i}>
                    <td>{n.description}</td>
                    <td>{n.posted}</td>
                    {/* Status cell removed from preview */}
                  </tr>
                ))}
                {notices.length === 0 && <tr><td colSpan={2} className="empty">No notices.</td></tr>}
              </tbody>
            </table>
          </Box>

          <Box className="checklist-footer">
            
          </Box>
        </Box>
      </Box>

      {/* Modal: shows the full table for the selected type */}
      <Modal open={modal.open} onClose={closeModal} aria-labelledby="full-list-modal" >
        <Box className="full-list-modal">
          <Box className="modal-header">
            <Typography variant="h6" id="full-list-modal">
              {modal.type === "templates" ? "All Templates" : modal.type === "tasks" ? "All Tasks" : "All Notices"}
            </Typography>
            <IconButton onClick={closeModal}><CloseIcon /></IconButton>
          </Box>

          <Box className="modal-body">
            {renderTable(modal.type)}
          </Box>

          <Box className="modal-actions">
            <Button onClick={closeModal} variant="outlined">Close</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}