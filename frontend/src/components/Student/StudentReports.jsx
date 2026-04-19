import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Button, Typography, Paper, Divider, Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";
import AppTable from "../Admin/AppTable.jsx";
import "./StudentReports.css";
import TemplateService from "../Api/TemplateService.jsx";
import axios from "axios";

const API_BASE = "http://localhost:5000";

// ─── Template definitions ─────────────────────
const TEMPLATE_DEFINITIONS = [
  { code: "t01", label: "Template 01: Project Team List (FYP-I)", week: 1 },
  { code: "t02", label: "Template 02: Initial Proposal (FYP-I)", week: 2 },
  { code: "t03", label: "Template 03: Proposal Presentation (FYP-I)", week: 4 },
  { code: "t04", label: "Template 04: Proposal & Planning (FYP-I)", week: 6 },
  { code: "t05", label: "Template 05: Progress Presentation (FYP-I)", week: 13 },
  { code: "t06", label: "Template 06: Complete Project Report (FYP-II)", week: 24 },
  { code: "t07", label: "Template 07: Final Presentation (FYP-II)", week: 26 },
  { code: "t08", label: "Template 08: Final Documentation (FYP-II)", week: 30 },
];

// ─── Token helper ─────────────────────────────
const getToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  if (direct) return direct;
  for (const key of ["user", "auth", "userData", "currentUser"]) {
    try {
      const obj = JSON.parse(localStorage.getItem(key) || "{}");
      const tok = obj?.token || obj?.accessToken || obj?.data?.token || obj?.user?.token;
      if (tok) return tok;
    } catch {}
  }
  return "";
};

// ─── Toast helper ─────────────────────────────
function callToast(message, type = "success") {
  try {
    if (toastService) {
      if (type === "success" && typeof toastService.success === "function") { toastService.success(message); return; }
      if (type === "error"   && typeof toastService.error   === "function") { toastService.error(message);   return; }
      if (typeof toastService.show === "function") { toastService.show(message, { type }); return; }
      if (typeof toastService === "function") { toastService(message); return; }
    }
  } catch (e) { console.warn("toastService call failed", e); }
  alert(message);
}

// ─── Format date ──────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Due date calculator ──────────────────────
const calculateDueDate = (startDate, week) => {
  if (!startDate) return "—";
  const d = new Date(startDate);
  d.setDate(d.getDate() + week * 7);
  return d.toLocaleDateString();
};

// ─── Skeleton loader ──────────────────────────
function Skeleton({ height = 18, width = "100%", radius = 6 }) {
  return (
    <div style={{
      height, width, borderRadius: radius, marginBottom: 8,
      background: "linear-gradient(90deg,#e0e7ef 25%,#f0f4fa 50%,#e0e7ef 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ─── Main Component ───────────────────────────
export default function StudentReports() {
  const studentEmail = localStorage.getItem("email");
  const studentId    = localStorage.getItem("studentId");
  const storedDept   = localStorage.getItem("department");
  const reportRef    = useRef();

  // ── State ──────────────────────────────────
  const [loadingTemplates,  setLoadingTemplates]  = useState(true);
  const [loadingMeetings,   setLoadingMeetings]   = useState(true);
  const [loadingFeedback,   setLoadingFeedback]   = useState(true);

  const [semesterStart,         setSemesterStart]         = useState(null);
  const [studentInfo,           setStudentInfo]           = useState(null);
  const [depTemplate,           setDepTemplate]           = useState([]);
  const [uploadedTemplates,     setUploadedTemplates]     = useState([]);
  const [presentationSchedules, setPresentationSchedules] = useState([]);
  const [meetings,              setMeetings]              = useState([]);
  const [supervisorFeedbacks,   setSupervisorFeedbacks]   = useState([]);

  // ── 1. Semester start ──────────────────────
  useEffect(() => {
    axios.get(`${API_BASE}/api/semester-start`)
      .then((r) => setSemesterStart(r.data?.date || null))
      .catch((e) => console.error("Semester start:", e));
  }, []);

  // ── 2. Student info + coordinator templates ─
  useEffect(() => {
    if (!studentId) return;
    TemplateService.getStudentInfo(studentId)
      .then((d) => setStudentInfo(d))
      .catch((e) => console.error("Student info:", e));

    if (storedDept) {
      fetch(`${API_BASE}/api/templates?department=${storedDept}`)
        .then((r) => r.json())
        .then((d) => setDepTemplate(d.data || []))
        .catch((e) => console.error("Coordinator templates:", e));
    }
  }, [studentId, storedDept]);

  // ── 3. Presentation schedules ──────────────
  useEffect(() => {
    axios.get(`${API_BASE}/api/deadline/presentation`)
      .then((r) => { if (r.data.success) setPresentationSchedules(r.data.data || []); })
      .catch((e) => console.error("Schedules:", e));
  }, []);

  // ── 4. Uploaded templates ──────────────────
  useEffect(() => {
    if (!studentInfo?.groupId) return;
    setLoadingTemplates(true);
    TemplateService.getFiles(studentInfo.groupId)
      .then((files) => {
        setUploadedTemplates(files.map((f) => ({
          code:              f.templateCode,
          label:             f.templateLabel || `Template ${f.templateCode}`,
          status:            f.status || "Pending",
          uploadedAt:        f.uploadedAt,
          week:              f.week,
          supervisorRemarks: f.supervisorRemarks || "",
        })));
      })
      .catch((e) => { console.error("Uploaded templates:", e); setUploadedTemplates([]); })
      .finally(() => setLoadingTemplates(false));
  }, [studentInfo]);

  // ── 5. Meetings ────────────────────────────
  useEffect(() => {
    if (!studentEmail) return;
    setLoadingMeetings(true);
    axios.get(`${API_BASE}/api/meetings/student/${studentEmail}`)
      .then((r) => {
        if (r.data.success && Array.isArray(r.data.meetings)) {
          setMeetings(r.data.meetings.map((m) => ({
            id:          m._id,
            meetingDate: m.date || "—",
            meetingTime: m.time || "—",
            supervisor:  m.supervisorEmail ? m.supervisorEmail.split("@")[0] : "Unknown",
            status:      m.status === 2 ? "Done" : m.status === 1 ? "Booked" : "Available",
          })));
        } else {
          setMeetings([]);
        }
      })
      .catch((e) => { console.error("Meetings:", e); setMeetings([]); })
      .finally(() => setLoadingMeetings(false));
  }, [studentEmail]);

  // ── 6. Supervisor feedback ─────────────────
  // ── NEW: Supervisor feedback from templates ──
useEffect(() => {
  if (!uploadedTemplates.length) {
    setSupervisorFeedbacks([]);
    setLoadingFeedback(false);
    return;
  }

  const feedbackData = uploadedTemplates
  .filter((t) => t.supervisorRemarks && t.supervisorRemarks.trim() !== "")
  .map((t) => ({
    milestone: t.label,
    feedback: t.supervisorRemarks,
    evaluatedOn: t.uploadedAt,
  }));
  setSupervisorFeedbacks(feedbackData);
  setLoadingFeedback(false);
}, [uploadedTemplates, studentInfo]);

  // ── Presentation due date helper ───────────
  const getPresentationDueDate = (week) => {
    const schedule = presentationSchedules.find((s) => {
      if (week === 4  && s.week === "Week 4") return true;
      if (week === 13 && s.week === "13th Week before Final Exams") return true;
      return false;
    });
    if (schedule?.slots?.length > 0) {
      const earliest = schedule.slots.reduce((min, slot) => {
        const d = new Date(slot.startTime);
        return !min || d < min ? d : min;
      }, null);
      return earliest ? earliest.toLocaleDateString() : calculateDueDate(semesterStart, week);
    }
    return calculateDueDate(semesterStart, week);
  };

  // ── Milestone rows ─────────────────────────
  const milestoneRows = useMemo(() => {
    if (!depTemplate.length) return [];
    const depCodes = depTemplate.map((d) => d.template);
    return TEMPLATE_DEFINITIONS
      .filter((tpl) => depCodes.includes(tpl.code))
      .map((tpl) => {
        const uploaded = uploadedTemplates.find((t) => t.code === tpl.code);
        const dueDate  = (tpl.code === "t03" || tpl.code === "t05")
          ? getPresentationDueDate(tpl.week)
          : calculateDueDate(semesterStart, tpl.week);
        return {
          code:    tpl.code,
          name:    tpl.label,
          status:  uploaded?.status || "Pending",
          dueDate,
          remarks: uploaded?.supervisorRemarks || "—",
        };
      });
  }, [depTemplate, uploadedTemplates, semesterStart, presentationSchedules]);

  // ── Summary ────────────────────────────────
  const summary = useMemo(() => ({
    approved:         milestoneRows.filter((m) => m.status?.toLowerCase() === "approved").length,
    underReview:      milestoneRows.filter((m) => m.status?.toLowerCase() === "under review").length,
    pending:          milestoneRows.filter((m) => m.status?.toLowerCase() === "pending").length,
    doneMeetings:     meetings.filter((m) => m.status === "Done").length,
    upcomingMeetings: meetings.filter((m) => m.status === "Booked").length,
    totalMeetings:    meetings.length,
    feedbackCount:    supervisorFeedbacks.length,
  }), [milestoneRows, meetings, supervisorFeedbacks]);

  // ── Table definitions ──────────────────────
  const milestonesTable = {
    headers: ["Template Name", "Due Date", "Status", "Remarks"],
    rows: milestoneRows.map((m) => ({
      "Template Name": m.name    || "—",
      "Due Date":      m.dueDate || "—",
      "Status":        m.status  || "—",
      "Remarks":       m.remarks || "—",
      __meta: m,
    })),
  };

  const meetingsTable = {
    headers: ["Meeting Date", "Time", "Supervisor", "Status"],
    rows: meetings.map((m) => ({
      "Meeting Date": m.meetingDate || "—",
      "Time":         m.meetingTime || "—",
      "Supervisor":   m.supervisor  || "—",
      "Status":       m.status      || "—",
      __meta: m,
    })),
  };

  const feedbackTable = {
  headers: ["Milestone", "Feedback", "Evaluated On"],
  rows: supervisorFeedbacks.map((fb) => ({
    "Milestone":    fb.milestone  || "—",
    "Feedback":     fb.feedback   || "—",
    "Evaluated On": fb.evaluatedOn ? fmtDate(fb.evaluatedOn) : "—",
    __meta: fb,
  })),
};

  // ── Export PDF ─────────────────────────────
  async function exportPDF() {
    try {
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import("jspdf").then((m) => m.default || m),
        import("html2canvas").then((m) => m.default || m),
      ]);
      const node = reportRef.current;
      if (!node) { callToast("Nothing to export", "error"); return; }
      const canvas  = await html2canvas(node, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf     = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pw      = pdf.internal.pageSize.getWidth();
      const iw      = pw - 40;
      const ih      = (canvas.height * iw) / canvas.width;
      pdf.addImage(imgData, "PNG", 20, 20, iw, ih);
      pdf.save(`FYP-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
      callToast("PDF exported", "success");
    } catch (err) {
      console.error(err);
      callToast("PDF export failed. Ensure jspdf and html2canvas are installed.", "error");
    }
  }

  // ── Export Excel ───────────────────────────
  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");
      const wb   = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Template Name", "Due Date", "Status", "Remarks"],
        ...milestoneRows.map((m) => [m.name, m.dueDate, m.status, m.remarks]),
      ]), "Templates");

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Meeting Date", "Time", "Supervisor", "Status"],
        ...meetings.map((m) => [m.meetingDate, m.meetingTime, m.supervisor, m.status]),
      ]), "Meetings");

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Project", "Milestone", "Feedback", "Evaluated On"],
        ...supervisorFeedbacks.map((fb) => [
          fb.project, fb.milestone, fb.feedback,
          fb.evaluatedOn ? fmtDate(fb.evaluatedOn) : "—",
        ]),
      ]), "Feedback");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob  = new Blob([wbout], { type: "application/octet-stream" });
      const url   = URL.createObjectURL(blob);
      const a     = Object.assign(document.createElement("a"), {
        href: url,
        download: `FYP-Report-${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      callToast("Excel exported", "success");
    } catch (err) {
      console.error(err);
      callToast("Excel export failed. Ensure xlsx (SheetJS) is installed.", "error");
    }
  }

  // ── Render ─────────────────────────────────
  return (
    <Box>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <DashboardSectionHeader description="Generate and export your personal FYP reports (PDF / Excel). View templates, meetings and feedback in one place.">
        Reports
      </DashboardSectionHeader>

      {/* ── Export Buttons ── */}
      <Box className="reports-controls" sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mb: 2 }}>
        <Tooltip title="Export Excel (SheetJS)">
          <span>
            <Button className="export-btn export-excel-btn" variant="outlined" startIcon={<DescriptionIcon />} onClick={exportExcel}>
              Export Excel
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Export PDF (jsPDF + html2canvas)">
          <span>
            <Button className="export-btn export-pdf-btn" variant="contained" startIcon={<DownloadIcon />} onClick={exportPDF}>
              Export PDF
            </Button>
          </span>
        </Tooltip>
      </Box>

      <div ref={reportRef} className="report-content">

        {/* ── Summary ── */}
        <Paper className="report-summary" elevation={1}>
          <label style={{ fontWeight: 800, color: "#01337a", fontSize: 15 }}>
            Personal Progress Summary
          </label>
          <Divider sx={{ my: 1 }} />
          {loadingTemplates ? (
            <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[1,2,3].map((i) => (
                <Box key={i} sx={{ width: 180 }}>
                  <Skeleton height={14} />
                  <Skeleton height={20} />
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
              <Box className="report-card">
                <label>Templates</label>
                <Typography className="report-card-value">
                  {summary.approved} approved &bull; {summary.underReview} under review &bull; {summary.pending} pending
                </Typography>
              </Box>
              <Box className="report-card">
                <label>Meetings</label>
                <Typography className="report-card-value">
                  {summary.doneMeetings} done &bull; {summary.upcomingMeetings} upcoming &bull; {summary.totalMeetings} total
                </Typography>
              </Box>
              <Box className="report-card">
                <label>Supervisor Feedback</label>
                <Typography className="report-card-value">
                  {summary.feedbackCount} comment{summary.feedbackCount !== 1 ? "s" : ""}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>

        {/* ── Templates Table ── */}
        <Paper className="report-table-wrap" elevation={0}>
          <label style={{ fontWeight: 700, color: "#01337a" }}>Templates &amp; Milestones</label>
          {loadingTemplates ? (
            [1,2,3].map((i) => <Skeleton key={i} height={32} radius={4} />)
          ) : milestoneRows.length === 0 ? (
            <Typography sx={{ color: "#94a3b8", fontSize: 13, mt: 1 }}>
              Koi template nahi mila.
            </Typography>
          ) : (
            <AppTable headers={milestonesTable.headers} rows={milestonesTable.rows} />
          )}
        </Paper>

        {/* ── Meetings Table ── */}
        <Paper className="report-table-wrap" elevation={0}>
          <label style={{ fontWeight: 700, color: "#01337a" }}>Meetings</label>
          {loadingMeetings ? (
            [1,2].map((i) => <Skeleton key={i} height={32} radius={4} />)
          ) : meetings.length === 0 ? (
            <Typography sx={{ color: "#94a3b8", fontSize: 13, mt: 1 }}>
              Koi meeting book nahi hui abhi.
            </Typography>
          ) : (
            <AppTable headers={meetingsTable.headers} rows={meetingsTable.rows} />
          )}
        </Paper>

        {/* ── Supervisor Feedback Table ── */}
        <Paper className="report-table-wrap" elevation={0}>
          <label style={{ fontWeight: 700, color: "#01337a" }}>Supervisor Feedback</label>
          {loadingFeedback ? (
            [1,2].map((i) => <Skeleton key={i} height={32} radius={4} />)
          ) : supervisorFeedbacks.length === 0 ? (
            <Typography sx={{ color: "#94a3b8", fontSize: 13, mt: 1 }}>
              Abhi koi supervisor feedback nahi aya.
            </Typography>
          ) : (
            <AppTable headers={feedbackTable.headers} rows={feedbackTable.rows} />
          )}
        </Paper>

      </div>
    </Box>
  );
}