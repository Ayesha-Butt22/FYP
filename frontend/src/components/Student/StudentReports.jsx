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

// Template definitions with week mapping
const TEMPLATE_DEFINITIONS = [
  { code: "t01", label: "Template-01: Project Team List", week: 1 },
  { code: "t02", label: "Template-02: Initial Proposal", week: 2 },
  { code: "t03", label: "Template-03: Proposal Presentation", week: 4 },
  { code: "t04", label: "Template-04: Proposal & Plan", week: 6 },
  { code: "t05", label: "Template-05: Progress Presentation", week: 13 },
  { code: "t06", label: "Template-06: Complete Project Report", week: 24 },
  { code: "t07", label: "Template-07: Final Presentation", week: 26 },
  { code: "t08", label: "Template-08: Complete Final Presentation", week: 28 },
  { code: "t09", label: "Template-09: Complete Documentation", week: 30 },
];

const STORAGE_KEYS = {
  evaluations: "student_evaluations_v1",
  meetings: "student_meetings_v1",
};

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;

  }
  return "";
};

const authFetch = (path) =>
  fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

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


const calculateDueDate = (startDate, week) => {
  if (!startDate) return "—";
  const d = new Date(startDate);
  d.setDate(d.getDate() + week * 7);
  return d.toLocaleDateString();
};

export default function StudentReports() {
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [semesterStart, setSemesterStart] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [depTemplate, setDepTemplate] = useState([]);
  const [presentationSchedules, setPresentationSchedules] = useState([]);

  const [evaluations, setEvaluations] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [supervisorFeedbacks, setSupervisorFeedbacks] = useState([]);

  const reportRef = useRef();

  const studentId = localStorage.getItem("studentId");
  const storedDept = localStorage.getItem("department");

  // Fetch coordinator uploaded templates
  const loadCoordinatorTemplates = async () => {
    try {
      const url = `${API_BASE}/api/templates?department=${storedDept}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDepTemplate(data.data || []);
      }
    } catch (err) {
      console.error("Error loading coordinator templates:", err);
      setDepTemplate([]);
    }
  };

  // Fetch Semester Start Date
  useEffect(() => {
    const loadSemesterStart = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/semester-start`);
        setSemesterStart(res.data?.date || null);
      } catch (err) {
        console.error("Error loading semester start:", err);
      }
    };
    loadSemesterStart();
  }, []);

  // Fetch Student Info and Coordinator Templates
  useEffect(() => {
    const loadStudentInfo = async () => {
      if (!studentId) return;
      try {
        const data = await TemplateService.getStudentInfo(studentId);
        setStudentInfo(data);
      } catch (err) {
        console.error("Error loading student info:", err);
      }
    };
    loadStudentInfo();
    loadCoordinatorTemplates();
  }, [studentId]);

  // Fetch Presentation Schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/deadline/presentation`);
        if (res.data.success) {
          setPresentationSchedules(res.data.data || []);
        }
      } catch (err) {
        console.error("Error loading presentation schedules:", err);
      }
    };
    fetchSchedules();
  }, []);

  // Fetch Uploaded Templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!studentInfo?.groupId) return;

      try {
        const files = await TemplateService.getFiles(studentInfo.groupId);

        const normalized = files.map((f) => ({
          code: f.templateCode,
          label: f.templateLabel || `Template ${f.templateCode}`,
          status: f.status || "Pending",
          uploadedAt: f.uploadedAt,
          uploadedAtFormatted: new Date(f.uploadedAt).toLocaleDateString(),
          week: f.week,
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

  // Fetch Meetings + Supervisor Feedback
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const email = localStorage.getItem("email");
        if (!email) {
          setMeetings([]);
          return;
        }

        const res = await axios.get(`${API_BASE}/api/meetings/student/${email}`);

        if (res.data.success && Array.isArray(res.data.meetings)) {
          const formattedMeetings = res.data.meetings.map((m) => ({
            id: m._id,
            meetingDate: m.date || "-",
            meetingTime: m.time || "-",
            supervisor: m.supervisorEmail
              ? m.supervisorEmail.split("@")[0]
              : "Unknown",
            status:
              m.status === 2
                ? "Done"
                : m.status === 1
                ? "Booked"
                : "Available",
            duration: m.duration || 30,
          }));
          setMeetings(formattedMeetings);
        } else {
          setMeetings([]);
        }
      } catch (err) {
        console.error("❌ Error fetching meetings:", err);
        setMeetings([]);
      }
    };

    const fetchSupervisorFeedback = async () => {
      try {
        const token = localStorage.getItem("token");

        // Try by studentId first  ✅ correct route: /api/student-templates/feedback/
        if (studentId) {
          const res = await axios.get(
            `${API_BASE}/api/student-templates/feedback/${studentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.success && res.data.feedbacks?.length > 0) {
            setSupervisorFeedbacks(res.data.feedbacks);
            return;
          }
        }

        // Fallback: try by email
        const email = localStorage.getItem("email");
        if (email) {
          const res = await axios.get(
            `${API_BASE}/api/student-templates/feedback/by-email/${encodeURIComponent(email)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.success) {
            setSupervisorFeedbacks(res.data.feedbacks || []);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching supervisor feedback:", err);
        setSupervisorFeedbacks([]);
      }
    };

    fetchMeetings();
    fetchSupervisorFeedback();
    setEvaluations(safeRead(STORAGE_KEYS.evaluations) || []);
  }, []);

  // Get presentation due date based on week
  const getPresentationDueDate = (week) => {
    const schedule = presentationSchedules.find((s) => {
      if (week === 4 && s.week === "Week 4") return true;
      if (week === 13 && s.week === "13th Week before Final Exams") return true;
      return false;
    });

    if (schedule && schedule.slots && schedule.slots.length > 0) {
      const earliestSlot = schedule.slots.reduce((earliest, slot) => {
        const slotDate = new Date(slot.startTime);
        return !earliest || slotDate < earliest ? slotDate : earliest;
      }, null);
      return earliestSlot
        ? earliestSlot.toLocaleDateString()
        : calculateDueDate(semesterStart, week);
    }

    return calculateDueDate(semesterStart, week);
  };

  // Prepare milestone rows
  const milestoneRows = useMemo(() => {
    if (!depTemplate || depTemplate.length === 0) return [];

    const depTplCodes = depTemplate.map((d) => d.template);
    const coordinatorTemplates = TEMPLATE_DEFINITIONS.filter((tpl) =>
      depTplCodes.includes(tpl.code)
    );

    return coordinatorTemplates.map((tpl) => {
      const uploaded = templates.find((t) => t.code === tpl.code);

      let dueDate;
      if (tpl.code === "t03" || tpl.code === "t05") {
        dueDate = getPresentationDueDate(tpl.week);
      } else {
        dueDate = calculateDueDate(semesterStart, tpl.week);
      }

      return {
        id: tpl.code,
        name: tpl.label,
        status: uploaded ? uploaded.status : "Pending",
        dueDate: dueDate,
      };
    });
  }, [depTemplate, templates, semesterStart, presentationSchedules]);

  const summary = useMemo(() => {
    const completedMilestones = milestoneRows.filter(
      (m) => m.status?.toLowerCase() === "approved"
    ).length;
    const pendingMilestones = milestoneRows.filter(
      (m) => m.status?.toLowerCase() === "pending"
    ).length;
    const underReviewMilestones = milestoneRows.filter(
      (m) => m.status?.toLowerCase() === "under review"
    ).length;
    const rejectedMilestones = milestoneRows.filter(
      (m) => m.status?.toLowerCase() === "rejected"
    ).length;

    return {
      completedMilestones,
      pendingMilestones,
      underReviewMilestones,
      rejectedMilestones,
      feedbackCount: supervisorFeedbacks.length,
      totalMeetings: meetings.length,
    };
  }, [milestoneRows, supervisorFeedbacks, meetings]);
// ─── Format date ──────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Skeleton ─────────────────────────────────
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

// ─── Main ─────────────────────────────────────
export default function StudentReports() {
  const studentEmail = localStorage.getItem("email");
  const reportRef    = useRef();

  const [loading,     setLoading]     = useState(true);
  const [group,       setGroup]       = useState(null);
  const [templates,   setTemplates]   = useState([]);
  const [meetings,    setMeetings]    = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [error,       setError]       = useState(null);

  // ── Fetch all data ──────────────────────────
  useEffect(() => {
    if (!studentEmail) return;

    const load = async () => {
      try {
        setLoading(true);

        // 1. Group
        const gRes  = await authFetch(`/groups/by-email/${studentEmail}`);
        const gData = await gRes.json();
        const grp   = gRes.ok ? gData : null;
        setGroup(grp);

        // 2. Templates (needs groupId)
        if (grp?._id) {
          try {
            const tRes  = await authFetch(`/student-templates/group/${grp._id}`);
            const tData = await tRes.json();
            if (tData.success) setTemplates(tData.data || []);
          } catch (e) { console.error("Templates fetch:", e); }
        }

        // 3. Meetings
        try {
          const mRes  = await fetch(`${BASE_URL}/meetings/student/${studentEmail}`);
          const mData = await mRes.json();
          if (mData.success) setMeetings(mData.meetings || []);
        } catch (e) { console.error("Meetings fetch:", e); }

        // 4. Committee Evaluations (feedback)
        try {
          const eRes  = await fetch(`${BASE_URL}/committee-evaluation/student/${studentEmail}`);
          const eData = await eRes.json();
          if (eData.success) setEvaluations(eData.data || []);
        } catch (e) { console.error("Evaluations fetch:", e); }

      } catch (err) {
        console.error("StudentReports load error:", err);
        setError("Data load karne mein masla hua.");
      } finally {
        setLoading(false);
      }
    };


    load();
  }, [studentEmail]);

  // ── Summary ─────────────────────────────────
  const summary = useMemo(() => {
    const totalTemplates     = templates.length;
    const approvedTemplates  = templates.filter((t) => t.status === "Approved").length;
    const pendingTemplates   = templates.filter((t) => t.status === "Under Review" || t.status === "Pending").length;
    const rejectedTemplates  = templates.filter((t) => t.status === "Rejected").length;

    const totalMeetings    = meetings.length;
    const doneMeetings     = meetings.filter((m) => m.status === 2).length;
    const upcomingMeetings = meetings.filter((m) => m.status === 1).length;

    // feedback from evaluations
    const feedbackCount = evaluations.reduce((sum, ev) => {
      return sum + (ev.evaluations || []).reduce((s, e) => s + (e.comments ? 1 : 0), 0);
    }, 0);

    const totalEvals = evaluations.length;

    return {
      totalTemplates, approvedTemplates, pendingTemplates, rejectedTemplates,
      totalMeetings, doneMeetings, upcomingMeetings,
      feedbackCount, totalEvals,
    };
  }, [templates, meetings, evaluations]);

  // ── Table data ───────────────────────────────

  // Templates table
  const templatesTable = {
    headers: ["Template", "Status", "Uploaded On", "Remarks"],
    rows: templates.map((t) => ({
      Template:    t.templateLabel || t.templateCode?.toUpperCase() || "—",
      Status:      t.status || "—",
      "Uploaded On": fmtDate(t.uploadedAt),
      Remarks:     t.supervisorRemarks || "—",
      __meta: t,
    })),
  };

  // Meetings table
  const meetingsTable = {
    headers: ["Date", "Time", "Supervisor", "Status"],
    rows: meetings.map((m) => ({
      Date:       fmtDate(m.date),
      Time:       m.time || "—",
      Supervisor: m.supervisorEmail || "—",
      Status:     m.status === 2 ? "Done" : m.status === 1 ? "Booked" : "Available",
      __meta: m,
    })),
  };

  // Feedback / Evaluations table
  const feedbackRows = evaluations.flatMap((ev) =>
    (ev.evaluations || []).map((e) => ({
      Week:         ev.scheduleId?.week || "—",
      "FYP Part":   ev.scheduleId?.fypPart || "—",
      "Evaluated By": e.evaluatedBy?.name || e.evaluatedBy?.email || "—",
      Comments:     e.comments || "—",
      "Submitted On": fmtDate(e.submittedAt),
      __meta: { evaluation: ev, entry: e },
    }))
  );

  const feedbackTable = {
    headers: ["Week", "FYP Part", "Evaluated By", "Comments", "Submitted On"],
    rows: feedbackRows,
  };

  // ── Export PDF ───────────────────────────────
  async function exportPDF() {
    try {
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import("jspdf").then((m) => (m.default ? m.default : m)),
        import("html2canvas").then((m) => (m.default ? m.default : m)),
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
      callToast(
        "PDF export failed. Ensure jspdf and html2canvas are installed.",
        "error"
      );
    }
  }

  // ── Export Excel ─────────────────────────────
  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");
      const wb   = XLSX.utils.book_new();


      const milestonesData = [
        ["Template Name", "Due Date", "Status"],
        ...milestoneRows.map((m) => [m.name || "", m.dueDate || "", m.status || ""]),
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(milestonesData),
        "Templates"
      );

      const feedbackData = [
        ["Project", "Milestone", "Feedback", "Evaluated On", "Status"],
        ...supervisorFeedbacks.map((fb) => [
          fb.project || "",
          fb.milestone || "",
          fb.feedback || "",
          fb.evaluatedOn ? new Date(fb.evaluatedOn).toLocaleDateString() : "",
          fb.status || "",
        ]),
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(feedbackData),
        "Feedback"
      );

      const meetingsData = [
        ["ID", "Meeting Date", "Time", "Supervisor"],
        ...meetings.map((m) => [
          m.id || "",
          m.meetingDate || "",
          m.meetingTime || "",
          m.supervisor || "",
        ]),
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(meetingsData),
        "Meetings"
      );



      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob  = new Blob([wbout], { type: "application/octet-stream" });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href      = url;
      a.download  = `FYP-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      callToast("Excel exported", "success");
    } catch (err) {
      console.error(err);
      callToast(
        "Excel export failed. Ensure xlsx (SheetJS) is installed.",
        "error"
      );
    }
  }


  const milestonesTable = {
    headers: ["Template Name", "Due Date", "Status"],
    rows: milestoneRows.map((m) => ({
      "Template Name": m.name || "-",
      "Due Date": m.dueDate || "-",
      Status: m.status || "-",
      __meta: m,
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

  // ✅ Supervisor feedback from backend (supervisorRemarks field)
  const feedbackTable = {
    headers: ["Project", "Milestone", "Feedback", "Evaluated On"],
    rows: supervisorFeedbacks.map((fb) => ({
      Project: fb.project || "-",
      Milestone: fb.milestone || "-",
      Feedback: fb.feedback || "-",
      "Evaluated On": fb.evaluatedOn
        ? new Date(fb.evaluatedOn).toLocaleDateString()
        : "-",
      __meta: fb,
    })),
  };

  return (
    <Box>
      <DashboardSectionHeader description="Generate and export your personal FYP reports (PDF / Excel). View templates, tasks, meetings and feedback in one place.">
        Reports
      </DashboardSectionHeader>

      <Box
        className="reports-controls"
        sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mb: 2 }}
      >

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

      {/* Error */}
      {error && (
        <Box sx={{ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 2, p: 1.5, mb: 2, color: "#b91c1c", fontSize: 13 }}>
          ⚠️ {error}
        </Box>
      )}

      <div ref={reportRef} className="report-content">

        {/* ── Summary ── */}
        <Paper className="report-summary" elevation={1}>

          <label variant="label" sx={{ fontWeight: 800, color: "#01337a" }}>
            Personal Progress Summary
          </label>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", gap: "200px", flexWrap: "wrap" }}>
            <Box className="report-card">
              <label>Templates</label>
              <Typography className="report-card-value">
                {summary.completedMilestones} approved •{" "}
                {summary.underReviewMilestones} under review •{" "}
                {summary.pendingMilestones} pending
              </Typography>
            </Box>
            <Box className="report-card">
              <label>Feedback</label>
              <Typography className="report-card-value">
                {summary.feedbackCount} comments
              </Typography>
            </Box>
            <Box className="report-card">
              <label>Meetings</label>
              <Typography className="report-card-value">
                {summary.totalMeetings} booked
              </Typography>
            </Box>
          </Box>

        </Paper>

        {/* ── Templates Table ── */}
        <Paper className="report-table-wrap" elevation={0}>

          <label>Templates &amp; Milestones</label>
          {loadingTemplates ? (
            <Typography>Loading templates...</Typography>
          ) : (
            <AppTable
              headers={milestonesTable.headers}
              rows={milestonesTable.rows}
            />

          )}
        </Paper>

        {/* ── Meetings Table ── */}
        <Paper className="report-table-wrap" elevation={0}>

          <label>Meetings</label>
          <AppTable
            headers={meetingsTable.headers}
            rows={meetingsTable.rows}
          />

        </Paper>

        {/* ── Feedback / Evaluations Table ── */}
        <Paper className="report-table-wrap" elevation={0}>

          <label>Feedback / Evaluations</label>
          {supervisorFeedbacks.length === 0 ? (
            <Typography sx={{ color: "#888", mt: 1, fontSize: 14 }}>
              No feedback received from supervisor yet.
            </Typography>
          ) : (
            <AppTable
              headers={feedbackTable.headers}
              rows={feedbackTable.rows}
            />

          
          )}
        </Paper>

      </div>
    </Box>
  );
}