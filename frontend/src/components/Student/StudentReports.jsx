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

const BASE_URL = "http://localhost:5000/api";

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
      callToast("PDF export failed. Ensure jspdf and html2canvas are installed.", "error");
    }
  }

  // ── Export Excel ─────────────────────────────
  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");
      const wb   = XLSX.utils.book_new();

      // Templates sheet
      const tSheet = [
        ["Template", "Status", "Uploaded On", "Remarks"],
        ...templates.map((t) => [
          t.templateLabel || t.templateCode || "",
          t.status || "",
          fmtDate(t.uploadedAt),
          t.supervisorRemarks || "",
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tSheet), "Templates");

      // Meetings sheet
      const mSheet = [
        ["Date", "Time", "Supervisor", "Status"],
        ...meetings.map((m) => [
          fmtDate(m.date),
          m.time || "",
          m.supervisorEmail || "",
          m.status === 2 ? "Done" : m.status === 1 ? "Booked" : "Available",
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mSheet), "Meetings");

      // Feedback sheet
      const fSheet = [
        ["Week", "FYP Part", "Evaluated By", "Comments", "Submitted On"],
        ...feedbackRows.map((r) => [
          r["Week"], r["FYP Part"], r["Evaluated By"], r["Comments"], r["Submitted On"],
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fSheet), "Feedback");

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
      callToast("Excel export failed. Ensure xlsx (SheetJS) is installed.", "error");
    }
  }

  // ─────────────────────────────────────────────
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

      {/* Export buttons */}
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

      {/* Error */}
      {error && (
        <Box sx={{ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 2, p: 1.5, mb: 2, color: "#b91c1c", fontSize: 13 }}>
          ⚠️ {error}
        </Box>
      )}

      <div ref={reportRef} className="report-content">

        {/* ── Summary ── */}
        <Paper className="report-summary" elevation={1}>
          <label style={{ fontWeight: 800, color: "#01337a", fontSize: 15 }}>Personal Progress Summary</label>
          <Divider sx={{ my: 1 }} />
          {loading ? (
            <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[1,2,3,4].map((i) => <Box key={i} sx={{ width: 160 }}><Skeleton height={14} /><Skeleton height={20} /></Box>)}
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: "60px", flexWrap: "wrap" }}>
              <Box className="report-card">
                <label>Templates</label>
                <Typography className="report-card-value">
                  {summary.approvedTemplates} approved &bull; {summary.pendingTemplates} pending &bull; {summary.rejectedTemplates} rejected
                </Typography>
              </Box>
              <Box className="report-card">
                <label>Meetings</label>
                <Typography className="report-card-value">
                  {summary.doneMeetings} done &bull; {summary.upcomingMeetings} upcoming &bull; {summary.totalMeetings} total
                </Typography>
              </Box>
              <Box className="report-card">
                <label>Feedback</label>
                <Typography className="report-card-value">
                  {summary.feedbackCount} comment{summary.feedbackCount !== 1 ? "s" : ""} from {summary.totalEvals} evaluation{summary.totalEvals !== 1 ? "s" : ""}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>

        {/* ── Templates Table ── */}
        <Paper className="report-table-wrap" elevation={0}>
          <label style={{ fontWeight: 700, color: "#01337a" }}>Templates / Milestones</label>
          {loading ? (
            [1,2,3].map((i) => <Skeleton key={i} height={32} radius={4} />)
          ) : templates.length === 0 ? (
            <Typography sx={{ color: "#94a3b8", fontSize: 13, mt: 1 }}>Koi template upload nahi hua abhi.</Typography>
          ) : (
            <AppTable headers={templatesTable.headers} rows={templatesTable.rows} />
          )}
        </Paper>

        {/* ── Meetings Table ── */}
        <Paper className="report-table-wrap" elevation={0}>
          <label style={{ fontWeight: 700, color: "#01337a" }}>Meetings</label>
          {loading ? (
            [1,2].map((i) => <Skeleton key={i} height={32} radius={4} />)
          ) : meetings.length === 0 ? (
            <Typography sx={{ color: "#94a3b8", fontSize: 13, mt: 1 }}>Koi meeting book nahi hui abhi.</Typography>
          ) : (
            <AppTable headers={meetingsTable.headers} rows={meetingsTable.rows} />
          )}
        </Paper>

        {/* ── Feedback / Evaluations Table ── */}
        <Paper className="report-table-wrap" elevation={0}>
          <label style={{ fontWeight: 700, color: "#01337a" }}>Feedback / Evaluations</label>
          {loading ? (
            [1,2].map((i) => <Skeleton key={i} height={32} radius={4} />)
          ) : feedbackRows.length === 0 ? (
            <Typography sx={{ color: "#94a3b8", fontSize: 13, mt: 1 }}>Abhi koi evaluation feedback nahi aya.</Typography>
          ) : (
            <AppTable headers={feedbackTable.headers} rows={feedbackTable.rows} />
          )}
        </Paper>

      </div>
    </Box>
  );
}