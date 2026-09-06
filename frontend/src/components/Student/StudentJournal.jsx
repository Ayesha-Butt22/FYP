// StudentJournal.jsx
import React, { useEffect, useState, useRef } from "react";
import { Box, Button, Typography, Paper, Tooltip } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EventIcon from "@mui/icons-material/Event";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlagIcon from "@mui/icons-material/Flag";
import CommentIcon from "@mui/icons-material/Comment";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";
import "./StudentJournal.css";

export default function StudentJournal() {
  const [groupedByMonth, setGroupedByMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const journalRef = useRef();

  // Auto-fetch student email from localStorage
  const studentEmail = localStorage.getItem("email");

  useEffect(() => {
    if (!studentEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/journal?email=${studentEmail}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.months) setGroupedByMonth(data.months);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toastService.error("Failed to fetch journal data.");
        setLoading(false);
      });
  }, [studentEmail]);

  // Format date as "DD MMM YYYY"
  function formatDateShort(d) {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Export journal as PDF
  async function exportPDF() {
    setLoading(true);
    try {
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import("jspdf").then((m) => (m.default ? m.default : m)),
        import("html2canvas").then((m) => (m.default ? m.default : m)),
      ]);

      const node = journalRef.current;
      if (!node) {
        toastService.error("Nothing to export");
        setLoading(false);
        return;
      }

      const canvas = await html2canvas(node, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
      pdf.save(`FYP-Journal-${new Date().toISOString().slice(0, 10)}.pdf`);
      toastService.success("Journal exported to PDF");
    } catch (err) {
      console.error(err);
      toastService.error("PDF export failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!studentEmail) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Please login to view your FYP Journal.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <DashboardSectionHeader description="Monthly project diary collecting meetings, completed tasks, milestone submissions and templates.">
        FYP Journey Journal
      </DashboardSectionHeader>

      
      <div ref={journalRef} className="journal-body">
        {loading && <Typography>Loading...</Typography>}

        {!loading && groupedByMonth.length === 0 && (
          <Paper className="journal-empty">
            <label>No activity found yet</label>
          </Paper>
        )}

        {!loading && (
          <div className="journal-grid">
            {groupedByMonth.map((month) => {
              const SLOTS = 5;
              const activities = month.activities || [];
              const visible = activities.slice(0, SLOTS);
              while (visible.length < SLOTS) visible.push({ placeholder: true });

              return (
                <Paper key={month.monthKey} className="journal-month-card">
                  <Box className="journal-month-header">
                    <label>{month.monthLabel}</label>
                    <label>{activities.length} activities</label>
                  </Box>

                  <Box className="journal-month-content">
                    {visible.map((act, idx) => {
                      if (act.placeholder)
                        return (
                          <Box key={idx} className="journal-activity placeholder">
                            <div className="journal-activity-date">—</div>
                            <div className="journal-activity-title placeholder-title">No activity</div>
                          </Box>
                        );

                      // Determine icon
                      let IconComponent;
                      let iconColor;
                      switch (act.type) {
                        case "Meeting":
                          IconComponent = EventIcon;
                          iconColor = "primary";
                          break;
                        case "Task":
                          IconComponent = CheckCircleIcon;
                          iconColor = "#16a34a";
                          break;
                        case "Template":
                          IconComponent = FlagIcon;
                          iconColor = "#f59e0b";
                          break;
                        case "Feedback":
                          IconComponent = CommentIcon;
                          iconColor = "#7c3aed";
                          break;
                        default:
                          IconComponent = null;
                      }

                      return (
                        <Box key={idx} className="journal-activity">
                          <Box className="journal-activity-left">
                            <div className="journal-activity-date">{formatDateShort(act.dateISO)}</div>
                            <div className="journal-activity-icon">
                              {IconComponent && <IconComponent sx={{ color: iconColor }} />}
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
