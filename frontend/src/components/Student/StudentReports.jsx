import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";
import AppTable from "../Admin/AppTable.jsx";
import "./StudentReports.css";

/**
 * StudentReports (updated)
 * - Replaced MUI Table blocks with AppTable usage.
 * - Kept exportPDF / exportExcel and data-loading logic intact.
 * - Added className on export buttons so CSS can apply your system colors.
 */

const STORAGE_KEYS = {
  tasks: "student_tasks_v1",
  milestones: "student_milestones_v1",
  evaluations: "student_evaluations_v1",
  meetings: "student_meetings_v1",
};

const DEMO = {
  tasks: [
    { id: "T-01", title: "Collect dataset", status: "Completed", completedOn: "2025-10-05" },
    { id: "T-02", title: "Preprocess data", status: "In Progress", due: "2025-10-11" },
    { id: "T-03", title: "Write documentation", status: "Overdue", due: "2025-10-15" },
  ],
  milestones: [
    { id: "MS-01", name: "Proposal", submittedOn: "2025-10-04", status: "Completed" },
    { id: "MS-02", name: "Mid", submittedOn: null, status: "Pending" },
  ],
  evaluations: [
    {
      projectId: "G-1001",
      projectTitle: "Smart Attendance System",
      evaluatedOn: "2025-10-15",
      milestones: [
        {
          id: "proposal",
          name: "Proposal",
          rubric: [
            { id: "r1", criterion: "Problem definition", max: 10, score: 8, feedback: "Good" },
          ],
        },
      ],
    },
  ],
  meetings: [
    { id: "M-1", meetingDate: "2025-10-06", meetingTime: "10:00 AM", supervisor: "Dr Ayesha" },
    { id: "M-2", meetingDate: "2025-10-13", meetingTime: "11:00 AM", supervisor: "Dr Bilal" },
  ],
};

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
    // eslint-disable-next-line no-console
    console.warn("toastService call failed", e);
  }
  // final fallback
  // eslint-disable-next-line no-alert
  alert(message);
}

export default function StudentReports() {
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const reportRef = useRef();

  useEffect(() => {
    setTasks(safeRead(STORAGE_KEYS.tasks) || DEMO.tasks);
    setMilestones(safeRead(STORAGE_KEYS.milestones) || DEMO.milestones);
    setEvaluations(safeRead(STORAGE_KEYS.evaluations) || DEMO.evaluations);
    setMeetings(safeRead(STORAGE_KEYS.meetings) || DEMO.meetings);
  }, []);

  // computed summaries
  const summary = useMemo(() => {
    const completedMilestones = milestones.filter((m) => (m.status || "").toLowerCase() === "completed").length;
    const pendingMilestones = milestones.length - completedMilestones;
    const tasksDone = tasks.filter((t) => (t.status || "").toLowerCase() === "completed").length;
    const tasksInProgress = tasks.filter((t) => (t.status || "").toLowerCase() === "in progress").length;
    const tasksOverdue = tasks.filter((t) => (t.status || "").toLowerCase() === "overdue").length;
    const feedbackCount = evaluations.reduce((sum, ev) => {
      return sum + (ev.milestones ? ev.milestones.reduce((ss, m) => ss + (m.rubric ? m.rubric.filter(r => r.feedback && r.feedback.trim()).length : 0), 0) : 0);
    }, 0);
    const totalMeetings = meetings.length;
    return {
      completedMilestones,
      pendingMilestones,
      tasksDone,
      tasksInProgress,
      tasksOverdue,
      feedbackCount,
      totalMeetings,
    };
  }, [tasks, milestones, evaluations, meetings]);

  async function exportPDF() {
    try {
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import("jspdf").then((m) => (m.default ? m.default : m)),
        import("html2canvas").then((m) => (m.default ? m.default : m)),
      ]);

      const node = reportRef.current;
      if (!node) {
        callToast("Nothing to export", "error");
        return;
      }

      const canvas = await html2canvas(node, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
      pdf.save(`FYP-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
      callToast("PDF exported", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      callToast("PDF export failed. Ensure jspdf and html2canvas are installed.", "error");
    }
  }

  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Tasks sheet
      const tasksSheetData = [
        ["ID", "Title", "Status", "Completed / Due"],
        ...tasks.map((t) => [t.id || "", t.title || "", t.status || "", t.completedOn || t.due || ""]),
      ];
      const wsTasks = XLSX.utils.aoa_to_sheet(tasksSheetData);
      XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks");

      // Milestones sheet
      const msData = [
        ["ID", "Name", "Submitted On", "Status"],
        ...milestones.map((m) => [m.id || "", m.name || "", m.submittedOn || "", m.status || ""]),
      ];
      const wsMs = XLSX.utils.aoa_to_sheet(msData);
      XLSX.utils.book_append_sheet(wb, wsMs, "Milestones");

      // Evaluations sheet (flattened)
      const evalRows = [
        ["Project ID", "Project Title", "Evaluated On", "Milestone", "Criterion", "Score", "Max", "Feedback"],
      ];
      evaluations.forEach((ev) => {
        (ev.milestones || []).forEach((m) => {
          (m.rubric || []).forEach((r) => {
            evalRows.push([ev.projectId || "", ev.projectTitle || "", ev.evaluatedOn || "", m.name || m.id || "", r.criterion || "", r.score || "", r.max || "", r.feedback || ""]);
          });
        });
      });
      const wsEval = XLSX.utils.aoa_to_sheet(evalRows);
      XLSX.utils.book_append_sheet(wb, wsEval, "Evaluations");

      // Meetings sheet
      const meetingsData = [
        ["ID", "Meeting Date", "Time", "Supervisor", "Booked On"],
        ...meetings.map((m) => [m.id || "", m.meetingDate || "", m.meetingTime || "", m.supervisor || "", m.bookedOn || ""]),
      ];
      const wsMeet = XLSX.utils.aoa_to_sheet(meetingsData);
      XLSX.utils.book_append_sheet(wb, wsMeet, "Meetings");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FYP-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      callToast("Excel exported", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      callToast("Excel export failed. Ensure xlsx (SheetJS) is installed.", "error");
    }
  }

  // Build AppTable data for each section
  const milestonesTable = {
    headers: ["Milestone", "Submitted On", "Status"],
    rows: milestones.map((m) => ({
      Milestone: m.name || m.id || "-",
      "Submitted On": m.submittedOn || "-",
      Status: m.status || "Pending",
      __meta: m,
    })),
  };

  const tasksTable = {
    headers: ["Title", "Status", "Completed / Due"],
    rows: tasks.map((t) => ({
      Title: t.title || "-",
      Status: t.status || "-",
      "Completed / Due": t.completedOn || t.due || "-",
      __meta: t,
    })),
  };

  const meetingsTable = {
    headers: ["Meeting Date", "Time", "Supervisor"],
    rows: meetings.map((m) => ({
      "Meeting Date": m.meetingDate || "-",
      Time: m.meetingTime || "-",
      Supervisor: m.supervisor || "-",
      __meta: m,
    })),
  };

  const feedbackRows = evaluations.flatMap((ev) =>
    (ev.milestones || []).flatMap((m) =>
      (m.rubric || []).map((r) => ({
        Project: ev.projectTitle || ev.projectId || "-",
        Milestone: m.name || m.id || "-",
        Feedback: r.feedback || "-",
        "Evaluated On": ev.evaluatedOn || "-",
        __meta: { evaluation: ev, milestone: m, rubric: r },
      }))
    )
  );

  const feedbackTable = {
    headers: ["Project", "Milestone", "Feedback", "Evaluated On"],
    rows: feedbackRows,
  };

  return (
    <Box>
      <DashboardSectionHeader description="Generate and export your personal FYP reports (PDF / Excel). View milestones, tasks, meetings and feedback in one place.">
        Reports
      </DashboardSectionHeader>

      <Box className="reports-controls" sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mb: 2 }}>
        <Tooltip title="Export Excel (SheetJS)">
          <span>
            <Button
              className="export-btn export-excel-btn"
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={exportExcel}
            >
              Export Excel
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Export PDF (jsPDF + html2canvas)">
          <span>
            <Button
              className="export-btn export-pdf-btn"
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportPDF}
            >
              Export PDF
            </Button>
          </span>
        </Tooltip>
      </Box>

      <div ref={reportRef} className="report-content">
        <Paper className="report-summary" elevation={1}>
          <label variant="label" sx={{ fontWeight: 800, color: "#01337a" }}>Personal Progress Summary</label>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", gap: '200px', flexWrap: "wrap" }}>
            <Box className="report-card">
              <label>Milestones</label>
              <Typography className="report-card-value">{summary.completedMilestones} completed • {summary.pendingMilestones} pending</Typography>
            </Box>
            <Box className="report-card">
              <label>Tasks</label>
              <Typography className="report-card-value">{summary.tasksDone} done • {summary.tasksInProgress} in progress • {summary.tasksOverdue} overdue</Typography>
            </Box>
            <Box className="report-card">
              <label>Feedback</label>
              <Typography className="report-card-value">{summary.feedbackCount} comments</Typography>
            </Box>
            <Box className="report-card">
              <label>Meetings</label>
              <Typography className="report-card-value">{summary.totalMeetings} booked</Typography>
            </Box>
          </Box>
        </Paper>

        <Paper className="report-table-wrap" elevation={0}>
          <label>Milestones</label>
          <AppTable headers={milestonesTable.headers} rows={milestonesTable.rows} />
        </Paper>

        <Paper className="report-table-wrap" elevation={0}>
          <label>Milestones</label>
          <AppTable headers={tasksTable.headers} rows={tasksTable.rows} />
        </Paper>

        <Paper className="report-table-wrap" elevation={0}>
          <label>Meetings</label>
          <AppTable headers={meetingsTable.headers} rows={meetingsTable.rows} />
        </Paper>

        <Paper className="report-table-wrap" elevation={0}>
          <label>Feedback / Evaluations (comments)</label>
          <AppTable headers={feedbackTable.headers} rows={feedbackTable.rows} />
        </Paper>
      </div>
    </Box>
  );
}