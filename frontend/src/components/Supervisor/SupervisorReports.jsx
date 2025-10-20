import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Stack,
  Typography,
  Grid,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider
} from "@mui/material";
import {
  PictureAsPdf,
  TableView,
  FileDownload,
  Groups,
  DownloadForOffline,
  InsertDriveFile
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./SupervisorReports.css";

// Dummy data
const GROUPS = [
  {
    id: "G-101",
    title: "Smart Attendance System",
    members: ["Ali Raza", "Sana Tariq", "Bilal Khan"],
    milestones: [
      { name: "Proposal", status: "Completed", feedback: "Great proposal!", score: 18, max: 20 },
      { name: "SRS", status: "Completed", feedback: "Detailed doc.", score: 27, max: 30 },
      { name: "Design", status: "Pending", feedback: "", score: 0, max: 25 },
      { name: "Report", status: "In Progress", feedback: "Needs more detail.", score: 15, max: 25 },
      { name: "Defense", status: "Pending", feedback: "", score: 0, max: 30 },
    ],
  },
  {
    id: "G-102",
    title: "AI-Based Disease Prediction",
    members: ["Ayesha Butt", "Madiha Sumbal", "Saad Farooq"],
    milestones: [
      { name: "Proposal", status: "Completed", feedback: "Innovative!", score: 19, max: 20 },
      { name: "SRS", status: "Completed", feedback: "Well researched.", score: 28, max: 30 },
      { name: "Design", status: "Completed", feedback: "Good diagrams.", score: 22, max: 25 },
      { name: "Report", status: "Pending", feedback: "", score: 0, max: 25 },
      { name: "Defense", status: "Pending", feedback: "", score: 0, max: 30 },
    ],
  },
  {
    id: "G-103",
    title: "Online Exam Proctoring",
    members: ["Fatima Noor", "Usman Ghani", "Hira Qureshi"],
    milestones: [
      { name: "Proposal", status: "Completed", feedback: "Clear and concise.", score: 16, max: 20 },
      { name: "SRS", status: "Completed", feedback: "Covers all cases.", score: 25, max: 30 },
      { name: "Design", status: "Completed", feedback: "Nice architecture.", score: 21, max: 25 },
      { name: "Report", status: "Pending", feedback: "", score: 0, max: 25 },
      { name: "Defense", status: "Pending", feedback: "", score: 0, max: 30 },
    ],
  },
];

const statusColor = (status) =>
  status === "Completed" ? "success" : status === "In Progress" ? "info" : status === "Pending" ? "warning" : "default";

export default function SupervisorReports() {
  const [selectedGroup, setSelectedGroup] = useState("");

  const group = useMemo(() => GROUPS.find((g) => g.id === selectedGroup), [selectedGroup]);

  // Progress summary calculation
  const completed = group ? group.milestones.filter((m) => m.status === "Completed").length : 0;
  const inProgress = group ? group.milestones.filter((m) => m.status === "In Progress").length : 0;
  const pending = group ? group.milestones.filter((m) => m.status === "Pending").length : 0;
  const total = group ? group.milestones.length : 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const groupScore = group ? group.milestones.reduce((sum, m) => sum + m.score, 0) : 0;
  const groupMax = group ? group.milestones.reduce((sum, m) => sum + m.max, 0) : 0;
  const percentOfTotal = groupMax ? Math.round((groupScore / groupMax) * 100) : 0;

  // Export to PDF
  const handleExportPDF = () => {
    if (!group) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.setTextColor("#0b3b69");
    doc.text(`Group Report: ${group.id} — ${group.title}`, 40, 56);
    doc.setFontSize(11);
    doc.setTextColor("#333");
    doc.text(`Members: ${group.members.join(", ")}`, 40, 76);
    autoTable(doc, {
      startY: 96,
      head: [["Milestone", "Status", "Score", "Max", "Feedback"]],
      body: group.milestones.map((m) => [m.name, m.status, m.score, m.max, m.feedback || "-"]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    });
    doc.setFontSize(11);
    doc.text(`Total Score: ${groupScore}/${groupMax}`, 40, doc.lastAutoTable.finalY + 18);
    doc.save(`GroupReport_${group.id}.pdf`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!group) return;
    const ws = XLSX.utils.json_to_sheet(
      group.milestones.map((m) => ({
        Milestone: m.name,
        Status: m.status,
        Score: m.score,
        Max: m.max,
        Feedback: m.feedback || "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `GroupReport_${group.id}.xlsx`);
  };

  return (
    <Box>
      <DashboardSectionHeader
        description={`Visual summary & exportable reports for supervised groups. Select a group to inspect milestones, scores and feedback.`}
      >
        Evaluation Report
      </DashboardSectionHeader>

      <Paper className="reports-paper enhanced-card" sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: "#01337a", fontWeight: 700 }}>
              Group Reports
            </Typography>
            <Typography variant="body2" sx={{ color: "#4b5563", mt: 0.5 }}>
              Pick a group to view detailed milestone progress and export reports.
            </Typography>
          </Grid>

          <Grid item xs={12} md={6} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel>Select Group</InputLabel>
                <Select
                  value={selectedGroup}
                  label="Select Group"
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Choose group</em>
                  </MenuItem>
                  {GROUPS.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ bgcolor: "#2563eb", width: 28, height: 28, fontSize: 12 }}>
                          {g.id.split("-")[1]}
                        </Avatar>
                        <Box sx={{ textAlign: "left" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{g.id}</Typography>
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>{g.title}</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                startIcon={<PictureAsPdf />}
                onClick={handleExportPDF}
                disabled={!group}
                sx={{ fontWeight: 700 }}
              >
                PDF
              </Button>

              <Button
                variant="outlined"
                color="success"
                startIcon={<TableView />}
                onClick={handleExportExcel}
                disabled={!group}
                sx={{ fontWeight: 700 }}
              >
                Excel
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {!group ? (
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography color="#94a3b8" sx={{ fontSize: 16 }}>
              Select a group to view its report.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mt: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper className="summary-card">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: "#2563eb" }}>
                      <Groups />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "#64748b" }}>Members</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{group.members.length}</Typography>
                      <Typography variant="caption" sx={{ color: "#6b7280" }}>{group.members.join(", ")}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper className="summary-card">
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#64748b" }}>Progress</Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box sx={{ position: "relative", display: "inline-flex" }}>
                            <CircularProgress
                              variant="determinate"
                              value={percent}
                              size={72}
                              thickness={5}
                              sx={{ color: "#2563eb" }}
                            />
                            <Box
                              sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{percent}%</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{completed}/{total} milestones</Typography>
                            <LinearProgress variant="determinate" value={percent} sx={{ height: 10, borderRadius: 6, mt: 1 }} />
                          </Box>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper className="summary-card">
                  <Typography variant="subtitle2" sx={{ color: "#64748b" }}>Total Score</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#219653" }}>{groupScore}/{groupMax}</Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280" }}>{percentOfTotal}% of total</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Milestones Cards */}
            <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 12 }}>
              {group.milestones.map((m, idx) => {
                const progress = Math.round((m.score / Math.max(1, m.max)) * 100);
                return (
                  <Paper key={idx} className="milestone-card" elevation={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start">
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0b3b69" }}>{m.name}</Typography>
                        <Chip label={m.status} color={statusColor(m.status)} size="small" sx={{ mt: 1 }} />
                      </Box>

                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{m.score}/{m.max}</Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>{progress}%</Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ minHeight: 48 }}>
                      <Typography variant="body2" sx={{ color: "#243b53" }}>{m.feedback || <span className="feedback-missing">No feedback yet</span>}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                      <LinearProgress variant="determinate" value={progress} sx={{ width: "70%", height: 8, borderRadius: 6 }} />
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Download row as Excel">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const ws = XLSX.utils.json_to_sheet([{
                                Milestone: m.name,
                                Status: m.status,
                                Score: m.score,
                                Max: m.max,
                                Feedback: m.feedback || "-"
                              }]);
                              const wb = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(wb, ws, `${m.name}`);
                              XLSX.writeFile(wb, `${group.id}_${m.name}.xlsx`);
                            }}
                          >
                            <FileDownload />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Download row as PDF">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const doc = new jsPDF({ unit: "pt", format: "a4" });
                              doc.setFontSize(12);
                              doc.text(`${group.id} — ${group.title}`, 40, 40);
                              autoTable(doc, {
                                startY: 60,
                                head: [["Milestone", "Status", "Score", "Max", "Feedback"]],
                                body: [[m.name, m.status, m.score, m.max, m.feedback || "-"]],
                              });
                              doc.save(`${group.id}_${m.name}.pdf`);
                            }}
                          >
                            <InsertDriveFile />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}