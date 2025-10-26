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

const DEMO_MEETINGS = [
  { id: "M-010", meetingDate: "2025-10-13", meetingTime: "11:00 AM", bookedOn: "2025-10-08T09:00:00Z", supervisor: "Dr Bilal" },
  { id: "M-009", meetingDate: "2025-09-18", meetingTime: "10:30 AM", bookedOn: "2025-09-10T08:00:00Z", supervisor: "Dr Ayesha" },
  { id: "M-008", meetingDate: "2025-08-05", meetingTime: "09:00 AM", bookedOn: "2025-08-01T09:00:00Z", supervisor: "Dr Ayesha" },
  { id: "M-007", meetingDate: "2025-08-21", meetingTime: "02:00 PM", bookedOn: "2025-08-18T12:00:00Z", supervisor: "Dr Bilal" },
];

const DEMO_TASKS = [
  { id: "T-010", title: "Collect dataset", assignedTo: "Team", status: "Completed", completedOn: "2025-10-05" },
  { id: "T-009", title: "Prepare slides", assignedTo: "Member 1", status: "Completed", completedOn: "2025-09-22" },
  { id: "T-008", title: "Preprocess data", assignedTo: "Member 2", status: "Completed", completedOn: "2025-08-11" },
  { id: "T-007", title: "Literature review update", assignedTo: "Member 3", status: "Completed", completedOn: "2025-08-15" },
];

const DEMO_MILESTONES = [
  { id: "MS-010", name: "Report draft", submittedOn: "2025-10-02", projectId: "G-1001" },
  { id: "MS-009", name: "SRS draft", submittedOn: "2025-09-05", projectId: "G-1001" },
  { id: "MS-008", name: "Proposal submitted", submittedOn: "2025-08-04", projectId: "G-1001" },
];

const DEMO_EVALS = [
  {
    projectId: "G-1001",
    projectTitle: "Smart Attendance System",
    evaluatedOn: "2025-08-30",
    milestones: [{ id: "proposal", rubric: [{ id: "r1", feedback: "Good overview" }] }],
  },
  {
    projectId: "G-1001",
    projectTitle: "Smart Attendance System",
    evaluatedOn: "2025-09-25",
    milestones: [{ id: "mid", rubric: [{ id: "r2", feedback: "Working prototype" }] }],
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

function prevMonthKey(monthKey, n = 1) {
  const [y, m] = monthKey.split("-").map(Number);
  const dt = new Date(y, m - 1, 1);
  dt.setMonth(dt.getMonth() - n);
  const mm = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  return mm;
}

export default function StudentJournal() {
  const [groupedByMonth, setGroupedByMonth] = useState([]);
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

    // Group by month (YYYY-MM)
    const map = new Map();
    activities.forEach((act) => {
      const monthKey = (act.dateISO || "").slice(0, 7); // '2025-10'
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey).push(act);
    });

    let arr = Array.from(map.entries())
      .map(([monthKey, acts]) => {
        const [year, month] = monthKey.split("-");
        const monthStart = new Date(Number(year), Number(month) - 1, 1);
        const label = monthStart.toLocaleString(undefined, { month: "long", year: "numeric" });
        const sorted = acts.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
        return { monthKey, monthLabel: label, activities: sorted };
      })
      .sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1)); // latest month first

    // Ensure exactly 3 month cards are shown (latest 3 months). If less data exist, pad with previous empty months.
    const WANT = 3;
    if (arr.length >= WANT) {
      arr = arr.slice(0, WANT);
    } else {
      const latestKey = arr.length > 0 ? arr[0].monthKey : (new Date().toISOString().slice(0, 7));
      const padded = [...arr];
      for (let i = 1; i <= WANT - arr.length; i += 1) {
        const key = prevMonthKey(latestKey, i);
        const [y, mo] = key.split("-");
        const monthStart = new Date(Number(y), Number(mo) - 1, 1);
        padded.push({ monthKey: key, monthLabel: monthStart.toLocaleString(undefined, { month: "long", year: "numeric" }), activities: [] });
      }
      arr = padded.slice(0, WANT);
    }

    setGroupedByMonth(arr);
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
      <DashboardSectionHeader description="Monthly project diary collecting meetings, completed tasks, milestone submissions and feedback. Export to PDF for portfolio.">
        FYP Journey Journal
      </DashboardSectionHeader>

      <Box className="journal-controls" sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
        <Tooltip title="Export journal as PDF (requires jspdf & html2canvas)">
          <span>
            {/* added className="export-btn" to target with CSS */}
            <Button className="export-btn" variant="contained" startIcon={<DownloadIcon />} onClick={exportPDF} disabled={loading}>
              Export PDF
            </Button>
          </span>
        </Tooltip>
      </Box>

      <div ref={journalRef} className="journal-body">
        {loading && <Typography>Loading...</Typography>}

        {!loading && groupedByMonth.length === 0 && (
          <Paper className="journal-empty">
            <label>No activity found yet</label>
            <label>Start scheduling meetings, completing tasks or submitting milestones — activities will appear here monthly.</label>
          </Paper>
        )}

        {!loading && (
          <div className="journal-grid">
            {groupedByMonth.map((month) => {
              // show exactly 5 slots per card; if fewer activities exist, pad with placeholders
              const SLOTS = 5;
              const visible = month.activities.slice(0, SLOTS);
              while (visible.length < SLOTS) visible.push({ placeholder: true });

              return (
                <Paper key={month.monthKey} className="journal-month-card" elevation={1}>
                  <Box className="journal-month-header">
                    <label>{month.monthLabel}</label>
                    <label>{month.activities.length} activities</label>
                  </Box>

                  <Box className="journal-month-content">
                    {visible.map((act, idx) => {
                      if (act.placeholder) {
                        return (
                          <Box key={`ph-${idx}`} className="journal-activity placeholder">
                            <Box className="journal-activity-left">
                              <div className="journal-activity-date">—</div>
                              <div className="journal-activity-icon" />
                            </Box>
                            <Box className="journal-activity-right">
                              <div className="journal-activity-title placeholder-title">No activity</div>
                              <div className="journal-activity-desc" />
                            </Box>
                          </Box>
                        );
                      }

                      return (
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
                      );
                    })}
                  </Box>
                </Paper>
              );
            })}
          </div>
        )}
      </div>
    </Box>
  );
}