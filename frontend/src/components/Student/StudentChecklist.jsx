import React, { useState, useEffect } from "react";
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
import axios from "axios";
import SupervisorWhiteboardApi from "../Api/Proposals/supervisorWhiteboardApi.jsx";
import TemplateService from "../Api/TemplateService.jsx";

const PREVIEW_ROW_LIMIT = 3;

// Template definitions with week mapping - Synchronized with StudentUploads
const TEMPLATE_DEFINITIONS = [
  { code: "t01", label: "Template-01: Project Team List", week: 1, fypPart: 1 },
  { code: "t02", label: "Template-02: Initial Proposal", week: 2, fypPart: 1 },
  { code: "t03", label: "Template-03: Proposal Presentation", week: 4, fypPart: 1 },
  { code: "t04", label: "Template-04: Proposal & Plan", week: 6, fypPart: 1 },
  { code: "t05", label: "Template-05: Project Report (Part-1)", week: 16, fypPart: 1 },
  { code: "t07", label: "Template-07: Final Presentation", week: 16, fypPart: 1 },
  { code: "t05", label: "Template-05: Project Report (Part-2)", week: 13, fypPart: 2 },
  { code: "t06", label: "Template-06: Complete Project Report", week: 14, fypPart: 2 },
];

function StatusChip({ status }) {
  const s = (status || "").toString().toLowerCase();
  if (s === "approved" || s === "completed" || s === "active") {
    return <Chip label={status} className="chip chip-success" size="small" />;
  }
  if (s === "overdue" || s === "expired" || s === "rejected") {
    return <Chip label={status} className="chip chip-danger" size="small" />;
  }
  if (s === "in progress" || s === "under review" || s === "submitted") {
    return <Chip label={status} className="chip chip-info" size="small" />;
  }
  return <Chip label={status} className="chip chip-warning" size="small" />;
}

// Helper function to calculate due date based on semester start and week
const calculateDueDate = (startDate, week) => {
  if (!startDate) return "—";
  const d = new Date(startDate);
  d.setDate(d.getDate() + week * 7);
  return d.toLocaleDateString();
};

export default function StudentChecklist() {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [semesterStart, setSemesterStart] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [fypYear, setFypYear] = useState(1);

  // Whiteboard notices state
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  const [expanded, setExpanded] = useState({ templates: false, tasks: false, notices: false });
  const [modal, setModal] = useState({ open: false, type: null });

  const openModal = (type) => setModal({ open: true, type });
  const closeModal = () => setModal({ open: false, type: null });

  const studentId = localStorage.getItem("studentId");
  const email = localStorage.getItem("email");

  // Fetch Semester Start Date
  useEffect(() => {
    const loadSemesterStart = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/semester-start`);
        setSemesterStart(res.data?.date || null);
      } catch (err) {
        console.error("Error loading semester start:", err);
      }
    };
    loadSemesterStart();
  }, []);

  // Fetch Student Info
  useEffect(() => {
    const loadStudentInfo = async () => {
      try {
        const data = await TemplateService.getAuthenticatedStudentInfo();
        setStudentInfo(data);
        
        // Check transition or localStorage
        const storedYear = parseInt(localStorage.getItem("fypYear") || "1");
        setFypYear(storedYear);
      } catch (err) {
        console.error("Error loading student info:", err);
      }
    };
    loadStudentInfo();
  }, []);

  // Fetch Templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!studentInfo?.groupId) return;
      
      try {
        setLoadingTemplates(true);
        const files = await TemplateService.getFiles(studentInfo.groupId);
        
        const normalized = files.map((f) => ({
          code: f.templateCode,
          label: f.templateLabel || `Template ${f.templateCode}`,
          status: f.status || "Pending",
          uploadedAt: f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : "-",
          week: f.week,
          fypPart: Number(f.fypPart || 1)
        }));

        setTemplates(normalized);
      } catch (err) {
        console.error("❌ Failed to fetch templates:", err);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (studentInfo?.groupId) {
      fetchTemplates();
    }
  }, [studentInfo]);

  // Fetch Tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        console.log("🔍 Fetching tasks from http://localhost:5000/api/tasks...");
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks`, config);
        console.log("📦 Tasks API Response:", res.data);

        let fetchedTasks = [];

        if (res.data.success && Array.isArray(res.data.tasks)) {
          fetchedTasks = res.data.tasks;
        } else if (Array.isArray(res.data)) {
          fetchedTasks = res.data;
        }

        console.log("📋 Fetched tasks count:", fetchedTasks.length);

        const formatted = fetchedTasks.map((t) => {
          let assignedByName = 
            t.createdBy ||
            t.createdByName ||
            t.createdBy?.name ||
            null;

          if (!assignedByName && t.createdByEmail) {
            assignedByName = t.createdByEmail.split('@')[0];
          }

          if (!assignedByName) {
            assignedByName = "Unknown";
          }

          return {
            title: t.title || "Untitled Task",
            assignedBy: assignedByName,
            status: t.status || 
                    (t.progress === 100 ? "Completed" : 
                     t.progress > 0 ? "In Progress" : "Pending")
          };
        });

        setTasks(formatted);
      } catch (err) {
        console.error("❌ Failed to fetch tasks:", err);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, []);

  // Fetch Whiteboard Notices
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        if (!email) {
          console.warn("⚠️ No email found");
          setNotices([]);
          setLoadingNotices(false);
          return;
        }

        console.log("🔍 Fetching whiteboard notes for:", email);
        const data = await SupervisorWhiteboardApi.StudentWhiteboard(email);
        console.log("📦 Whiteboard API Response:", data);

        if (data.success && data.notes.length > 0) {
          const allNotes = Array.isArray(data.notes) 
            ? data.notes 
            : Object.values(data.notes).flat();

          const formattedNotices = allNotes
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(note => ({
              description: note.content || note.description || "No content",
              posted: note.date || "Unknown date",
              _id: note._id
            }));

          console.log("✅ Formatted notices:", formattedNotices);
          setNotices(formattedNotices);
        } else {
          console.log("⚠️ No notes found");
          setNotices([]);
        }
      } catch (err) {
        console.error("❌ Error fetching whiteboard:", err);
        setNotices([]);
      } finally {
        setLoadingNotices(false);
      }
    };

    fetchNotes();
  }, [email]);

  // Prepare template rows with due dates - Filtered by current FYP year
  const templateRows = TEMPLATE_DEFINITIONS
    .filter(tpl => {
      if (tpl.fypPart === 2 && fypYear < 2) return false;
      return true;
    })
    .map((tpl) => {
      const uploaded = templates.find((t) => 
        t.code === tpl.code && 
        Number(t.fypPart) === Number(tpl.fypPart)
      );
      
      return {
        label: `${tpl.label} (${tpl.fypPart === 2 ? 'FYP-2' : 'FYP-1'})`,
        dueDate: calculateDueDate(semesterStart, tpl.week),
        status: uploaded ? uploaded.status : "Pending",
        uploadedAt: uploaded ? uploaded.uploadedAt : "—",
      };
    });

  const templatesPreview = templateRows.slice(0, PREVIEW_ROW_LIMIT);
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
            {templateRows.map((t, i) => (
              <TableRow key={i} hover>
                <TableCell>{t.label}</TableCell>
                <TableCell>{t.dueDate}</TableCell>
                <TableCell><StatusChip status={t.status} /></TableCell>
              </TableRow>
            ))}
            {templateRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No templates found.
                </TableCell>
              </TableRow>
            )}
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
              <TableCell>Assigned By</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((t, i) => (
              <TableRow key={t.title + i} hover>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.assignedBy}</TableCell>
                <TableCell><StatusChip status={t.status} /></TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  {loadingTasks ? "Loading tasks..." : "No tasks assigned."}
                </TableCell>
              </TableRow>
            )}
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
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.map((n, i) => (
              <TableRow key={n._id || i} hover>
                <TableCell>
                  <div dangerouslySetInnerHTML={{ __html: n.description }} />
                </TableCell>
                <TableCell>{n.posted}</TableCell>
              </TableRow>
            ))}
            {notices.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  {loadingNotices ? "Loading notices..." : "No notices."}
                </TableCell>
              </TableRow>
            )}
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
        {/* Templates - NOW WITH REAL BACKEND DATA */}
        <Box className="checklist-card">
          <Box className="checklist-header">
            <Typography className="checklist-title">Template Submission</Typography>
            <Typography variant="body2" className="checklist-count">
              {templateRows.filter(r => r.status !== 'Pending').length} uploaded / {templateRows.length} total
            </Typography>
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
                {loadingTemplates ? (
                  <tr><td colSpan={3} className="empty">Loading templates...</td></tr>
                ) : templatesPreview.length > 0 ? (
                  templatesPreview.map((t, i) => (
                    <tr key={i}>
                      <td>{t.label}</td>
                      <td>{t.dueDate}</td>
                      <td><StatusChip status={t.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="empty">No templates assigned.</td></tr>
                )}
              </tbody>
            </table>
          </Box>

          <Box className="checklist-footer">
            {templateRows.length > PREVIEW_ROW_LIMIT && (
              <Button 
                size="small" 
                onClick={() => openModal("templates")}
                sx={{ textTransform: 'none' }}
              >
                View All Templates
              </Button>
            )}
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
                  <th>Assigned By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingTasks ? (
                  <tr><td colSpan={3} className="empty">Loading tasks...</td></tr>
                ) : tasksPreview.length > 0 ? (
                  tasksPreview.map((t, i) => (
                    <tr key={t.title + i}>
                      <td>{t.title}</td>
                      <td>{t.assignedBy}</td>
                      <td><StatusChip status={t.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="empty">No tasks assigned.</td></tr>
                )}
              </tbody>
            </table>
          </Box>

          <Box className="checklist-footer">
            {tasks.length > PREVIEW_ROW_LIMIT && (
              <Button 
                size="small" 
                onClick={() => openModal("tasks")}
                sx={{ textTransform: 'none' }}
              >
                View All Tasks
              </Button>
            )}
          </Box>
        </Box>

        {/* Whiteboard */}
        <Box className="checklist-card">
          <Box className="checklist-header">
            <Typography className="checklist-title">Whiteboard</Typography>
            <Typography variant="body2" className="checklist-count">{notices.length} total</Typography>
          </Box>

          <Box className="checklist-body">
            <table className="small-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Posted</th>
                </tr>
              </thead>
              <tbody>
                {loadingNotices ? (
                  <tr><td colSpan={2} className="empty">Loading notices...</td></tr>
                ) : noticesPreview.length > 0 ? (
                  noticesPreview.map((n, i) => (
                    <tr key={n._id || i}>
                      <td>
                        <div dangerouslySetInnerHTML={{ __html: n.description }} />
                      </td>
                      <td>{n.posted}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={2} className="empty">No notices.</td></tr>
                )}
              </tbody>
            </table>
          </Box>

          <Box className="checklist-footer">
            {notices.length > PREVIEW_ROW_LIMIT && (
              <Button 
                size="small" 
                onClick={() => openModal("notices")}
                sx={{ textTransform: 'none' }}
              >
                View All Notices
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Modal open={modal.open} onClose={closeModal} aria-labelledby="full-list-modal">
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