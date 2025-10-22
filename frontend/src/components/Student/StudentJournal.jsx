import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EventIcon from "@mui/icons-material/Event";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlagIcon from "@mui/icons-material/Flag";
import CommentIcon from "@mui/icons-material/Comment";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";
import "./StudentJournal.css";

// LocalStorage keys used by other features (adjust if your app uses different keys)
const KEYS = {
  meetings: "student_meetings_v1",
  tasks: "student_tasks_v1",
  milestones: "student_milestones_v1",
  evaluations: "student_evaluations_v1", // rubric/feedback
};

// Demo fallbacks (used if localStorage doesn't contain data)
const DEMO_MEETINGS = [
  { id: "M-001", meetingDate: "2025-10-06", meetingTime: "10:00 AM", bookedOn: "2025-10-01T12:00:00Z", supervisor: "Dr Ayesha" },
  { id: "M-002", meetingDate: "2025-10-13", meetingTime: "11:00 AM", bookedOn: "2025-10-08T09:00:00Z", supervisor: "Dr Bilal" },
];

const DEMO_TASKS = [
  { id: "T-01", title: "Collect dataset", assignedTo: "Team", status: "Completed", completedOn: "2025-10-05" },
  { id: "T-02", title: "Preprocess data", assignedTo: "Member 2", status: "Completed", completedOn: "2025-10-11" },
];

const DEMO_MILESTONES = [
  { id: "MS-01", name: "Proposal submitted", submittedOn: "2025-10-04", projectId: "G-1001" },
];

const DEMO_EVALS = [
  {
    projectId: "G-1001",
    projectTitle: "Smart Attendance System",
    evaluatedOn: "2025-10-15",
    milestones: [
      {
        id: "proposal",
        rubric: [
          { id: "r1", feedback: "Good overview" },
        ],
      },
    ],
  },
];

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function callToast(message, type = "success") {
  try {
    if (toastService) {
      if (type === "success" && typeof toastService.success === "function") {
        toastService.success(message);
        return;
      }
      if (type === "error" && typeof toastService.error === "function") {
        toastService.error(message);
        return;
      }
      if (typeof toastService.show === "function") {
        toastService.show(message, { type });
        return;
      }
      if (typeof toastService === "function") {
        toastService(message);
        return;
      }
    }
  } catch (e) {
    console.warn("toastService call failed", e);
  }
  alert(message);
}

function parseDateToISO(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (!isNaN(dt)) return dt;
  return null;
}

function weekStartISO(date) {
  const dt = new Date(date);
  const day = dt.getDay(); 
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(dt);
  monday.setDate(dt.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function formatDateShort(d) {
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString();
}

function collectActivities() {
  const activities = [];

  const meetings = safeRead(KEYS.meetings) || DEMO_MEETINGS;
  (Array.isArray(meetings) ? meetings : []).forEach((m) => {
    const date = m.meetingDate || (m.bookedOn ? m.bookedOn.slice(0, 10) : null);
    const dateISO = parseDateToISO(date) ? parseDateToISO(date).toISOString().slice(0, 10) : null;
    activities.push({
      dateISO: dateISO || (m.bookedOn ? m.bookedOn.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      type: "Meeting",
      title: `Meeting with ${m.supervisor || "Supervisor"}`,
      description: `${m.meetingDate || ""} ${m.meetingTime || ""}`.trim(),
      raw: m,
    });
  });

  const tasks = safeRead(KEYS.tasks) || DEMO_TASKS;
  (Array.isArray(tasks) ? tasks : []).forEach((t) => {
    const date = t.completedOn || t.completedAt || t.updatedAt || t.due || null;
    const dateISO = parseDateToISO(date) ? parseDateToISO(date).toISOString().slice(0, 10) : null;
    activities.push({
      dateISO: dateISO || new Date().toISOString().slice(0, 10),
      type: "Task",
      title: `${t.title}`,
      description: `${t.status}${t.assignedTo ? ` • ${t.assignedTo}` : ""}`,
      raw: t,
    });
  });

  const milestones = safeRead(KEYS.milestones) || DEMO_MILESTONES;
  (Array.isArray(milestones) ? milestones : []).forEach((ms) => {
    const date = ms.submittedOn || ms.date || null;
    const dateISO = parseDateToISO(date) ? parseDateToISO(date).toISOString().slice(0, 10) : null;
    activities.push({
      dateISO: dateISO || new Date().toISOString().slice(0, 10),
      type: "Milestone",
      title: ms.name || "Milestone submitted",
      description: `${ms.projectId ? `${ms.projectId}` : ""}`.trim(),
      raw: ms,
    });
  });

  const evals = safeRead(KEYS.evaluations) || DEMO_EVALS;
  (Array.isArray(evals) ? evals : []).forEach((ev) => {
    const baseDate = ev.evaluatedOn || null;
    const dateISOBase = parseDateToISO(baseDate) ? parseDateToISO(baseDate).toISOString().slice(0, 10) : null;
    (ev.milestones || []).forEach((m) => {
      (m.rubric || []).forEach((r) => {
        if (r.feedback && r.feedback.trim()) {
          activities.push({
            dateISO: dateISOBase || new Date().toISOString().slice(0, 10),
            type: "Feedback",
            title: `${ev.projectTitle || ev.projectId} — ${m.id || ""}`,
            description: r.feedback,
            raw: { evaluation: ev, milestoneId: m.id, rubric: r },
          });
        }
      });
    });
  });

  return activities;
}

export default function StudentJournal() {
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const journalRef = useRef();

  useEffect(() => {
    setLoading(true);
    const activities = collectActivities()
      .map((a) => ({
        ...a,
        dateISO: a.dateISO || new Date().toISOString().slice(0, 10),
      }))
      .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));

    const map = new Map();
    activities.forEach((act) => {
      const wk = weekStartISO(act.dateISO);
      if (!map.has(wk)) map.set(wk, []);
      map.get(wk).push(act);
    });

    const arr = Array.from(map.entries())
      .map(([weekKey, acts]) => {
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const label = `${formatDateShort(weekStart)} — ${formatDateShort(weekEnd)}`;
        return { weekKey, weekLabel: label, activities: acts.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO)) };
      })
      .sort((a, b) => (a.weekKey < b.weekKey ? 1 : -1));

    setGrouped(arr);
    setLoading(false);
  }, []);

  async function exportPDF() {
    setLoading(true);
    try {
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import("jspdf").then((m) => (m.default ? m.default : m)),
        import("html2canvas").then((m) => (m.default ? m.default : m)),
      ]);

      const node = journalRef.current;
      if (!node) {
        callToast("Nothing to export", "error");
        setLoading(false);
        return;
      }

      const canvas = await html2canvas(node, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 20;
      pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);

      if (imgHeight > pageHeight - 40) {
        let remainingHeight = imgHeight - (pageHeight - 40);
        let offsetY = pageHeight - 40;
        while (remainingHeight > 0) {
          pdf.addPage();
          position = 20 - offsetY;
          pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
          remainingHeight -= pageHeight - 40;
          offsetY += pageHeight - 40;
        }
      }

      pdf.save(`FYP-Journal-${new Date().toISOString().slice(0, 10)}.pdf`);
      callToast("Journal exported to PDF", "success");
    } catch (err) {
      console.error(err);
      callToast("PDF export failed. Make sure jspdf and html2canvas are installed.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <DashboardSectionHeader description="Weekly project diary automatically collecting meetings, completed tasks, milestone submissions and feedback. Export to PDF for portfolio.">
        FYP Journey Journal
      </DashboardSectionHeader>

      <Box className="journal-controls" sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
        <Tooltip title="Export journal as PDF (requires jspdf & html2canvas)">
          <span>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportPDF} disabled={loading}>
              Export PDF
            </Button>
          </span>
        </Tooltip>
      </Box>

      <div ref={journalRef} className="journal-body">
        {loading && <Typography>Loading...</Typography>}

        {!loading && grouped.length === 0 && (
          <Paper className="journal-empty">
            <Typography variant="h6">No activity found yet</Typography>
            <Typography color="textSecondary">Start scheduling meetings, completing tasks or submitting milestones — activities will appear here weekly.</Typography>
          </Paper>
        )}

        {!loading &&
          grouped.map((week) => (
            <Paper key={week.weekKey} className="journal-week-card" elevation={1}>
              <Box className="journal-week-header">
                <Typography variant="h6" className="journal-week-label">{week.weekLabel}</Typography>
                <Typography variant="caption" color="textSecondary">{week.activities.length} activity(ies)</Typography>
              </Box>

              <Box className="journal-timeline">
                {week.activities.map((act, idx) => (
                  <Box key={idx} className="journal-activity">
                    <Box className="journal-activity-left">
                      <div className="journal-activity-date">{formatDateShort(act.dateISO)}</div>
                      <div className="journal-activity-icon">
                        {act.type === "Meeting" && <EventIcon color="primary" />}
                        {act.type === "Task" && <CheckCircleIcon sx={{ color: "#16a34a" }} />}
                        {act.type === "Milestone" && <FlagIcon sx={{ color: "#f59e0b" }} />}
                        {act.type === "Feedback" && <CommentIcon sx={{ color: "#7c3aed" }} />}
                      </div>
                    </Box>

                    <Box className="journal-activity-right">
                      <div className="journal-activity-title">{act.title}</div>
                      <div className="journal-activity-desc">{act.description}</div>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
      </div>
    </Box>
  );
}
