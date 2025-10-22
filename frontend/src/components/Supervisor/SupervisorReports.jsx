// components/SupervisorReports.jsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { PictureAsPdf, TableView } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./SupervisorReports.css";
import DashboardSectionHeader from "./DashboardSectionHeader";

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

// Status color coding
const statusColor = (status) =>
  status === "Completed"
    ? "success"
    : status === "In Progress"
    ? "info"
    : status === "Pending"
    ? "warning"
    : "default";

export default function SupervisorReports() {
  const [selectedGroup, setSelectedGroup] = useState("");

  const group = GROUPS.find((g) => g.id === selectedGroup);

  // Progress summary calculation
  const completed = group ? group.milestones.filter((m) => m.status === "Completed").length : 0;
  const inProgress = group ? group.milestones.filter((m) => m.status === "In Progress").length : 0;
  const pending = group ? group.milestones.filter((m) => m.status === "Pending").length : 0;
  const total = group ? group.milestones.length : 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const groupScore = group ? group.milestones.reduce((sum, m) => sum + m.score, 0) : 0;
  const groupMax = group ? group.milestones.reduce((sum, m) => sum + m.max, 0) : 0;

  // Export to PDF
  const handleExportPDF = () => {
    if (!group) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Group Report: ${group.id} - ${group.title}`, 14, 18);
    doc.setFontSize(12);
    doc.text(`Members: ${group.members.join(", ")}`, 14, 28);
    autoTable(doc, {
      startY: 36,
      head: [["Milestone", "Status", "Score", "Max", "Feedback"]],
      body: group.milestones.map((m) => [m.name, m.status, m.score, m.max, m.feedback || "-"]),
    });
    doc.text(`Total Score: ${groupScore}/${groupMax}`, 14, doc.lastAutoTable.finalY + 10);
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
      <Box mx="auto" py={3} mr={0} ml={0} pt={0}>
        <DashboardSectionHeader
        description={"Here you can see preview evaluation & rubrics. Select \"Particular Group\" to view and respected group record will be displayed "}>Evaluation Report</DashboardSectionHeader>

        <Paper className="reports-paper">

          <FormControl className="reports-group-select">
            <InputLabel>Select Group</InputLabel>
            <Select
                value={selectedGroup}
                label="Select Group"
                onChange={(e) => setSelectedGroup(e.target.value)}
                size="small"
                style={{ height: '60px'}}
            >
              {GROUPS.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.id} - {g.title}
                  </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!group ? (
              <Typography color="#aaa" className="supervisor-reports-placeholder">
                Select a group to view its report.
              </Typography>
          ) : (
              <div>
                <div className="report-summary">
                  <Typography className="super-report-title">
                    {group.id} - {group.title}
                  </Typography>
                  <Typography className="super-report-members">
                    <b>Members:</b> {group.members.join(", ")}
                  </Typography>
                  <Stack direction="row" spacing={1} className="super-report-progress-summary">
                    <Chip label={`Completed: ${completed}`} color="success" style={{ width : '200px' , fontSize: '18px' }}/>
                    <Chip label={`In Progress: ${inProgress}`} color="info" style={{ width : '200px' , fontSize: '18px' }}/>
                    <Chip label={`Pending: ${pending}`} color="warning" style={{ width : '200px' , fontSize: '18px' }}/>
                    <Chip label={`Total: ${total}`} color="secondary" style={{ width : '200px' , fontSize: '18px' }}/>
                    <Chip label={`Progress: ${percent}%`} color="primary" style={{ width : '200px' , fontSize: '18px' }}/>
                  </Stack>
                  <Typography className="super-report-total-score">
                    <b>Total Score:</b> {groupScore}/{groupMax}
                  </Typography>
                </div>

                {/* Export Buttons */}
                <div className="report-export-btns">
                  <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PictureAsPdf/>}
                      onClick={handleExportPDF}
                      className="export-btn"
                  >
                    Export PDF
                  </Button>
                  <Button
                      variant="outlined"
                      color="success"
                      startIcon={<TableView/>}
                      onClick={handleExportExcel}
                      className="export-btn"
                  >
                    Export Excel
                  </Button>
                </div>

                {/* Milestones Table */}
                <Table className="super-report-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Milestone</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Max</TableCell>
                      <TableCell>Feedback/Evaluation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.milestones.map((m, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{m.name}</TableCell>
                          <TableCell>
                            <Chip
                                label={m.status}
                                color={statusColor(m.status)}
                                style={{ width : '150px' , fontSize: '18px' }}
                                className="report-status-chip"
                            />
                          </TableCell>
                          <TableCell>{m.score}</TableCell>
                          <TableCell>{m.max}</TableCell>
                          <TableCell>
                            {m.feedback || <span className="feedback-missing">-</span>}
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          )}
        </Paper>
      </Box>
  );
}